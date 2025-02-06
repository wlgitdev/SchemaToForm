import { UISchema, UIFieldDefinition, UIFieldType } from "./";

export interface AdapterOptions {
  excludeFields?: string[];
  readOnlyFields?: string[];
  groups?: Array<{
    name: string;
    label: string;
    fields: string[];
    collapsible?: boolean;
  }>;
}

export interface SchemaAdapter<T> {
  /**
   * Convert source schema to UISchema
   */
  toUISchema(sourceSchema: T, options?: AdapterOptions): UISchema;

  /**
   * Get field type mapping
   */
  getFieldTypeMapping(): Record<string, UIFieldType>;

  /**
   * Add custom field type mapping
   */
  addFieldTypeMapping(sourceType: string, uiType: UIFieldType): void;

  /**
   * Process validation rules
   */
  processValidation(field: any): UIFieldDefinition["validation"];

  /**
   * Process field reference/relations
   */
  processReference(field: any): UIFieldDefinition["reference"] | undefined;
}

export abstract class BaseSchemaAdapter<T> implements SchemaAdapter<T> {
  protected fieldTypeMapping: Record<string, UIFieldType>;

  constructor() {
    this.fieldTypeMapping = this.getDefaultFieldTypeMapping();
  }

  abstract toUISchema(sourceSchema: T, options?: AdapterOptions): UISchema;

  getFieldTypeMapping(): Record<string, UIFieldType> {
    return this.fieldTypeMapping;
  }

  addFieldTypeMapping(sourceType: string, uiType: UIFieldType): void {
    this.fieldTypeMapping[sourceType] = uiType;
  }

  abstract processValidation(field: any): UIFieldDefinition["validation"];

  abstract processReference(
    field: any
  ): UIFieldDefinition["reference"] | undefined;

  protected getDefaultFieldTypeMapping(): Record<string, UIFieldType> {
    return {
      String: "text",
      Number: "number",
      Date: "date",
      Boolean: "checkbox",
      ObjectId: "select",
      Array: "multiselect",
    };
  }

  protected formatFieldLabel(fieldName: string): string {
    return fieldName
      .split(/(?=[A-Z])|_/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  protected shouldExcludeField(
    fieldName: string,
    excludeFields: string[] = []
  ): boolean {
    return excludeFields.includes(fieldName);
  }

  protected isReadOnlyField(
    fieldName: string,
    readOnlyFields: string[] = []
  ): boolean {
    return readOnlyFields.includes(fieldName);
  }
}
