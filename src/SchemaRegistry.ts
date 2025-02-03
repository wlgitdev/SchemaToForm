import { UISchema } from "./types";

export type SchemaValidator = (
  schema: UISchema
) => boolean | { valid: boolean; errors: string[] };
export type SchemaTransformer = (schema: UISchema) => UISchema;

interface SchemaRegistryOptions {
  validators?: SchemaValidator[];
  transformers?: SchemaTransformer[];
  enableCaching?: boolean;
}

interface CachedSchema {
  schema: UISchema;
  timestamp: number;
  version: number;
}

const readOnlyFieldsTransformer: SchemaTransformer = (
  schema: UISchema
): UISchema => {
  const transformedFields = { ...schema.fields };

  Object.entries(transformedFields).forEach(([fieldName, field]) => {
    if (field.readOnly) {
      transformedFields[fieldName] = {
        ...field,
        validation: field.validation
          ? {
              ...field.validation,
              required: false,
            }
          : undefined,
      };
    }
  });

  return {
    ...schema,
    fields: transformedFields,
  };
};

export class SchemaRegistry {
  private schemas: Map<string, CachedSchema>;
  private validators: SchemaValidator[];
  private transformers: SchemaTransformer[];
  private enableCaching: boolean;
  private static instance: SchemaRegistry;

  private constructor(options: SchemaRegistryOptions = {}) {
    this.schemas = new Map();
    this.validators = options.validators || [];
    // Always include readOnlyFieldsTransformer as the first transformer
    this.transformers = [
      readOnlyFieldsTransformer,
      ...(options.transformers || []),
    ];
    this.enableCaching = options.enableCaching ?? true;
  }

  public static getInstance(
    options: SchemaRegistryOptions = {}
  ): SchemaRegistry {
    if (!SchemaRegistry.instance) {
      SchemaRegistry.instance = new SchemaRegistry(options);
    }
    // If instance exists but new transformers are provided, add them after the readOnlyFieldsTransformer
    else if (options.transformers) {
      SchemaRegistry.instance.transformers = [
        readOnlyFieldsTransformer,
        ...options.transformers,
      ];
    }
    return SchemaRegistry.instance;
  }

  /**
   * Register a new schema with the registry
   */
  public registerSchema(name: string, schema: UISchema): void {
    // Validate schema
    const validationResults = this.validateSchema(schema);
    if (!validationResults.valid) {
      throw new Error(`Invalid schema: ${validationResults.errors.join(', ')}`);
    }

    // Transform schema
    const transformedSchema = this.transformSchema(schema);

    // Cache schema
    this.schemas.set(name, {
      schema: transformedSchema,
      timestamp: Date.now(),
      version: 1
    });
  }

  /**
   * Get a schema from the registry
   */
  public getSchema(name: string): UISchema | null {
    const cachedSchema = this.schemas.get(name);
    if (!cachedSchema) return null;

    return this.enableCaching
      ? cachedSchema.schema
      : this.transformSchema(cachedSchema.schema);
  }

  /**
   * Update an existing schema
   */
  public updateSchema(name: string, schema: UISchema): void {
    const existing = this.schemas.get(name);
    if (!existing) {
      throw new Error(`Schema ${name} not found`);
    }

    const validationResults = this.validateSchema(schema);
    if (!validationResults.valid) {
      throw new Error(`Invalid schema: ${validationResults.errors.join(', ')}`);
    }

    const transformedSchema = this.transformSchema(schema);

    this.schemas.set(name, {
      schema: transformedSchema,
      timestamp: Date.now(),
      version: existing.version + 1
    });
  }

  /**
   * Remove a schema from the registry
   */
  public removeSchema(name: string): boolean {
    return this.schemas.delete(name);
  }

  /**
   * Check if a schema exists in the registry
   */
  public hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  /**
   * Get schema metadata
   */
  public getSchemaMetadata(name: string) {
    const cached = this.schemas.get(name);
    if (!cached) return null;

    return {
      timestamp: cached.timestamp,
      version: cached.version
    };
  }

  /**
   * Add a new validator
   */
  public addValidator(validator: SchemaValidator): void {
    this.validators.push(validator);
  }

  /**
   * Add a new transformer
   */
  public addTransformer(transformer: SchemaTransformer): void {
    this.transformers.push(transformer);
  }

  /**
   * Clear all cached schemas
   */
  public clearCache(): void {
    this.schemas.clear();
  }

  /**
   * Validate a schema using all registered validators
   */
  private validateSchema(schema: UISchema): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const validator of this.validators) {
      const result = validator(schema);
      if (typeof result === 'boolean') {
        if (!result) {
          errors.push('Schema validation failed');
        }
      } else {
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform a schema using all registered transformers
   */
  private transformSchema(schema: UISchema): UISchema {
    return this.transformers.reduce(
      (transformedSchema, transformer) => transformer(transformedSchema),
      { ...schema }
    );
  }
}