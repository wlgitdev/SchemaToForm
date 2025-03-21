import { UISchema } from "./DynamicForm/types/schemaUI";
import { ListSchema } from "./DynamicList/types/ListSchema";
import { listSchemaValidator } from "./DynamicList/types/ListSchema";

export type SchemaType = "form" | "list";
export type Schema = UISchema | ListSchema;

export type SchemaValidator = (
  schema: Schema,
  type: SchemaType
) => boolean | { valid: boolean; errors: string[] };

export type SchemaTransformer = (schema: Schema, type: SchemaType) => Schema;

interface SchemaRegistryOptions {
  validators?: SchemaValidator[];
  transformers?: SchemaTransformer[];
  enableCaching?: boolean;
}

interface CachedSchema {
  schema: Schema;
  type: SchemaType;
  timestamp: number;
  version: number;
}

const readOnlyFieldsTransformer: SchemaTransformer = (
  schema: Schema,
  type: SchemaType
): Schema => {
  if (type === "form") {
    const formSchema = schema as UISchema;
    const transformedFields = { ...formSchema.fields };

  Object.entries(transformedFields).forEach(([fieldName, field]) => {
    if (field.readOnly) {
      transformedFields[fieldName] = {
        ...field
      };
    }
  });

  return {
      ...formSchema,
    fields: transformedFields,
  };
  }
  
  // For list schemas, no transformation needed
  return schema;
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
  public registerSchema(name: string, schema: Schema, type: SchemaType): void {
    const validationResults = this.validateSchema(schema, type);
    if (!validationResults.valid) {
      throw new Error(`Invalid schema: ${validationResults.errors.join(", ")}`);
    }

    const transformedSchema = this.transformSchema(schema, type);

    // Cache schema
    this.schemas.set(name, {
      schema: transformedSchema,
      type,
      timestamp: Date.now(),
      version: 1,
    });
  }

  /**
   * Get a schema from the registry
   */
  public getSchema<T extends Schema>(name: string): { schema: T | null; type: SchemaType | null } {
    const cachedSchema = this.schemas.get(name);
    if (!cachedSchema) return { schema: null, type: null };

    const schema = this.enableCaching
      ? cachedSchema.schema
      : this.transformSchema(cachedSchema.schema, cachedSchema.type);

    return {
      schema: schema as T,
      type: cachedSchema.type
    };
  }

  /**
   * Update an existing schema
   */
  public updateSchema(name: string, schema: Schema, type: SchemaType): void {
    const existing = this.schemas.get(name);
    if (!existing) {
      throw new Error(`Schema ${name} not found`);
    }

    if (existing.type !== type) {
      throw new Error(`Schema type mismatch. Expected ${existing.type}, got ${type}`);
    }

    const validationResults = this.validateSchema(schema, type);
    if (!validationResults.valid) {
      throw new Error(`Invalid schema: ${validationResults.errors.join(", ")}`);
    }

    const transformedSchema = this.transformSchema(schema, type);

    this.schemas.set(name, {
      schema: transformedSchema,
      type,
      timestamp: Date.now(),
      version: existing.version + 1,
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
      version: cached.version,
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
  private validateSchema(schema: Schema, type: SchemaType): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Built-in validation for list schemas
    if (type === "list") {
      try {
        listSchemaValidator.parse(schema);
      } catch (error) {
        errors.push(`List schema validation failed: ${error}`);
      }
    }

    // Custom validators
    for (const validator of this.validators) {
      const result = validator(schema, type);
      if (typeof result === "boolean") {
        if (!result) {
          errors.push("Schema validation failed");
        }
      } else {
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transform a schema using all registered transformers
   */
  private transformSchema(schema: Schema, type: SchemaType): Schema {
    return this.transformers.reduce(
      (transformedSchema, transformer) => transformer(transformedSchema, type),
      { ...schema }
    );
  }
}
