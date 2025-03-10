import { UISchema, UIFieldDefinition, UIFieldType } from "./DynamicForm";
import { ColumnType, ListSchema } from './DynamicList';

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

export interface ListAdapterOptions {
  excludeFields?: string[];
  sortableFields?: string[];
  visibleFields?: string[]; 
  defaultGroupBy?: string;
  showGroupCounts?: boolean;
  enableSelection?: boolean;
  selectionType?: "single" | "multi";
  pageSize?: number;
}

export interface SchemaAdapter<T> {
  /**
   * Convert source schema to UISchema
   */
  toUISchema(sourceSchema: T, options?: AdapterOptions): UISchema;

  /**
   * Convert source schema to ListSchema
   */
  toListSchema<U extends object>(sourceSchema: T, options?: ListAdapterOptions): ListSchema<U>;

  /**
   * Get field type mapping
   */
  getFieldTypeMapping(): Record<string, UIFieldType>;

  /**
   * Get list column type mapping
   */
  getListTypeMapping(): Record<string, string>;

  /**
   * Add custom field type mapping
   */
  addFieldTypeMapping(sourceType: string, uiType: UIFieldType): void;

  /**
   * Add custom list column type mapping
   */
  addListTypeMapping(sourceType: string, listType: string): void;

  /**
   * Process field reference/relations
   */
  processReference(field: any): UIFieldDefinition["reference"] | undefined;
}

export abstract class BaseSchemaAdapter<T> implements SchemaAdapter<T> {
  protected fieldTypeMapping: Record<string, UIFieldType>;
  protected listTypeMapping: Record<string, ColumnType>;

  constructor() {
    this.fieldTypeMapping = this.getDefaultFieldTypeMapping();
    this.listTypeMapping = this.getDefaultListTypeMapping();
  }

  abstract toUISchema(sourceSchema: T, options?: AdapterOptions): UISchema;
  
  abstract toListSchema<U extends object>(sourceSchema: T, options?: ListAdapterOptions): ListSchema<U>;

  getFieldTypeMapping(): Record<string, UIFieldType> {
    return this.fieldTypeMapping;
  }

  getListTypeMapping(): Record<string, string> {
    return this.listTypeMapping;
  }

  addFieldTypeMapping(sourceType: string, uiType: UIFieldType): void {
    this.fieldTypeMapping[sourceType] = uiType;
  }

  addListTypeMapping(sourceType: string, listType: ColumnType): void {
    this.listTypeMapping[sourceType] = listType;
  }
  
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

  protected getDefaultListTypeMapping(): Record<string, ColumnType> {
    return {
      String: "text",
      Number: "number",
      Date: "date",
      Boolean: "boolean",
      ObjectId: "reference",
      Array: "array",
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

  protected isSortableField(
    fieldName: string,
    sortableFields: string[] = []
  ): boolean {
    return sortableFields.includes(fieldName);
  }
}