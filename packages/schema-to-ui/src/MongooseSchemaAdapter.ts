import { Schema } from "mongoose";
import {
  UISchema,
  UIFieldDefinition,
  UIFieldType,
  UIFieldReference,
  BaseSchemaAdapter,
  AdapterOptions,
  ListAdapterOptions,
  ListSchema,
  ColumnDefinition,
  ColumnType,
} from ".";

interface MongooseFieldType {
  instance: string;
  options: any;
  schema?: Schema;
}

export class MongooseSchemaAdapter extends BaseSchemaAdapter<Schema> {
  toUISchema(mongooseSchema: Schema, options: AdapterOptions = {}): UISchema {
    const {
      excludeFields = ["_id", "__v"],
      readOnlyFields = [],
      groups = [],
    } = options;

    const fields: Record<string, UIFieldDefinition> = {};

    // Process regular fields
    this.processSchemaFields(
      mongooseSchema,
      "",
      fields,
      excludeFields,
      readOnlyFields
    );

    // Process virtuals
    const virtuals = this.processVirtuals(mongooseSchema, excludeFields);
    Object.assign(fields, virtuals);

    // Update groups to include only existing fields
    const validGroups = groups.map((group) => ({
      ...group,
      fields: group.fields.filter((field) => fields[field] !== undefined),
    }));

    return {
      fields,
      layout: {
        groups: validGroups,
        order: validGroups.flatMap((group) => group.fields),
      },
    };
  }

  toListSchema<T extends object>(
    mongooseSchema: Schema,
    options: ListAdapterOptions = {}
  ): ListSchema<T> {
    const {
      excludeFields = ["_id", "__v"],
      sortableFields = [],
      visibleFields = [],
      defaultGroupBy,
      showGroupCounts = true,
      enableSelection = false,
      selectionType = "multi",
      pageSize = 10,
    } = options;

    const columns: Record<string, ColumnDefinition<T>> = {};

    // Process regular fields
    this.processListColumns(
      mongooseSchema,
      "",
      columns as Record<string, ColumnDefinition<any>>,
      excludeFields,
      sortableFields,
      visibleFields
    );

    // Process virtuals
    const virtualColumns = this.processVirtualColumns(
      mongooseSchema,
      excludeFields,
      sortableFields
    );
    Object.assign(columns, virtualColumns);

    // Build the list schema
    const listSchema: ListSchema<T> = {
      columns,
      options: {
        pagination: {
          enabled: true,
          pageSize,
        },
      },
    };

    // Add selection if enabled
    if (enableSelection) {
      listSchema.options!.selection = {
        enabled: true,
        type: selectionType,
      };
    }

    // Add grouping if specified
    if (defaultGroupBy) {
      listSchema.options!.groupBy = {
        field: defaultGroupBy as keyof T,
        showCounts: showGroupCounts,
        expanded: true,
      };
    }

    return listSchema;
  }

  private processSchemaFields(
    schema: Schema,
    prefix: string,
    fields: Record<string, UIFieldDefinition>,
    excludeFields: string[],
    readOnlyFields: string[]
  ): void {
    schema.eachPath((path: string, schemaType: MongooseFieldType) => {
      const fullPath = prefix ? `${prefix}.${path}` : path;

      if (this.shouldExcludeField(fullPath, excludeFields)) return;

      // Handle nested schemas
      if (schemaType.schema) {
        this.processSchemaFields(
          schemaType.schema,
          fullPath,
          fields,
          excludeFields,
          readOnlyFields
        );
        return;
      }

      fields[fullPath] = this.convertField(
        fullPath,
        schemaType,
        readOnlyFields
      );
    });
  }

  private processListColumns(
    schema: Schema,
    prefix: string,
    columns: Record<string, ColumnDefinition<any>>,
    excludeFields: string[],
    sortableFields: string[],
    visibleFields: string[]
  ): void {
    schema.eachPath((path: string, schemaType: MongooseFieldType) => {
      const fullPath = prefix ? `${prefix}.${path}` : path;

      if (this.shouldExcludeField(fullPath, excludeFields)) return;

      // Handle nested schemas
      if (schemaType.schema) {
        this.processListColumns(
          schemaType.schema,
          fullPath,
          columns,
          excludeFields,
          sortableFields,
          visibleFields
        );
        return;
      }

      // Skip hidden fields if visibleFields is specified and doesn't include this field
      if (visibleFields.length > 0 && !visibleFields.includes(fullPath)) return;

      columns[fullPath] = this.convertListColumn(
        fullPath,
        schemaType,
        sortableFields
      );
    });
  }

  private isFieldRequired(schemaType: MongooseFieldType): boolean {
    // Check direct required flag
    if (schemaType.options?.required) {
      return true;
    }

    // Check nested required in type definition
    if (
      Array.isArray(schemaType.options.type) &&
      schemaType.options.type[0]?.required
    ) {
      return true;
    }

    // Check for validation array
    if (Array.isArray(schemaType.options?.validate)) {
      return schemaType.options.validate.some(
        (validator: any) => validator.required || validator.options?.required
      );
    }

    return false;
  }

  private convertField(
    fieldName: string,
    schemaType: MongooseFieldType,
    readOnlyFields: string[]
  ): UIFieldDefinition {
    const isReadOnly = this.isReadOnlyField(fieldName, readOnlyFields);
    const isRequired = this.isFieldRequired(schemaType);

    const baseField: UIFieldDefinition = {
      type: this.determineFieldType(schemaType),
      label: this.formatFieldLabel(fieldName),
      ...(isReadOnly ? { readOnly: true } : {}),
      ...(isRequired ? { validation: { required: true } } : {}),
    };

    // Add reference if it exists
    const reference = this.processReference(schemaType);
    if (reference) {
      baseField.reference = reference;
    }

    // Handle enums
    if (schemaType.options.enum || schemaType.options.type?.[0]?.enum) {
      const enumValues =
        schemaType.options.enum || schemaType.options.type[0].enum;
      baseField.options = this.processEnumOptions(enumValues);
      baseField.type =
        schemaType.instance === "Array" ? "multiselect" : "select";
    }

    return baseField;
  }

  private convertListColumn(
    fieldName: string,
    schemaType: MongooseFieldType,
    sortableFields: string[]
  ): ColumnDefinition<any> {
    const isSortable = this.isSortableField(fieldName, sortableFields);

    const baseColumn: ColumnDefinition<any> = {
      label: this.formatFieldLabel(fieldName),
      field: fieldName as any,
      type: this.determineListColumnType(schemaType),
      sortable: isSortable,
    };

    // Add reference configuration if it's a reference field
    const reference = this.processReference(schemaType);
    if (reference) {
      baseColumn.reference = {
        queryKey: [`${reference.modelName.toLowerCase()}-list`],
        collection: reference.modelName,
        valueField: "_id",
      };

      // Add format for reference display
      baseColumn.format = {
        reference: {
          labelField: reference.displayField,
          fallback: "-",
        },
      };
    }

    // Handle enums
    if (schemaType.options.enum || schemaType.options.type?.[0]?.enum) {
      // For enums, we still use "text" type but provide formatting options
      baseColumn.type = "text";

      // Could add more sophisticated handling for enum values if needed
      baseColumn.format = {
        text: {
          transform: "capitalize",
        },
      };
    }

    // Add specific format for dates
    if (baseColumn.type === "date") {
      baseColumn.format = {
        date: {
          format: "MMM dd, yyyy",
          timezone: "UTC",
        },
      };
    }

    return baseColumn;
  }

  private determineFieldType(schemaType: MongooseFieldType): UIFieldType {
    // Handle array references
    if (
      Array.isArray(schemaType.options.type) &&
      schemaType.options.type[0]?.ref
    ) {
      return "multiselect";
    }

    // Handle single references
    if (schemaType.options.ref) {
      return "select";
    }

    // Handle enum types
    if (schemaType.options.enum || schemaType.options.type?.[0]?.enum) {
      return schemaType.instance === "Array" ? "multiselect" : "select";
    }

    // Handle array types
    if (schemaType.instance === "Array") {
      return "list";
    }

    // Use standard type mapping
    return this.fieldTypeMapping[schemaType.instance] || "text";
  }

  private determineListColumnType(schemaType: MongooseFieldType): ColumnType {
    // Handle array references
    if (
      Array.isArray(schemaType.options.type) &&
      schemaType.options.type[0]?.ref
    ) {
      return "reference";
    }

    // Handle single references
    if (schemaType.options.ref) {
      return "reference";
    }

    // Use standard type mapping
    return this.listTypeMapping[schemaType.instance] || "text";
  }

  processReference(
    schemaType: MongooseFieldType
  ): UIFieldReference | undefined {
    // Handle array references
    if (
      Array.isArray(schemaType.options.type) &&
      schemaType.options.type[0]?.ref
    ) {
      return {
        modelName: schemaType.options.type[0].ref,
        displayField: "name",
        multiple: true,
      };
    }

    // Handle single references
    if (schemaType.options.ref) {
      return {
        modelName: schemaType.options.ref,
        displayField: "name",
        multiple: false,
      };
    }

    return undefined;
  }

  private processEnumOptions(
    enumValues: any[]
  ): Array<{ value: string | number; label: string }> {
    return enumValues.map((value) => ({
      value,
      label: this.formatFieldLabel(value.toString()),
    }));
  }

  private processVirtuals(
    mongooseSchema: Schema,
    excludeFields: string[]
  ): Record<string, UIFieldDefinition> {
    const virtualFields: Record<string, UIFieldDefinition> = {};
    const virtuals = (mongooseSchema as any).virtuals;

    Object.entries(virtuals).forEach(
      ([virtualPath, virtual]: [string, any]) => {
        if (this.shouldExcludeField(virtualPath, excludeFields)) return;
        if (virtual.options?.ref) return; // Skip populated virtuals

        const getterFunction = virtual.getters?.[0]?.toString() || "";
        virtualFields[virtualPath] = {
          type: this.inferVirtualType(getterFunction),
          label: this.formatFieldLabel(virtualPath),
          readOnly: true,
          description: `Calculated field: ${virtualPath}`,
        };
      }
    );

    return virtualFields;
  }

  private processVirtualColumns(
    mongooseSchema: Schema,
    excludeFields: string[],
    sortableFields: string[]
  ): Record<string, ColumnDefinition<any>> {
    const virtualColumns: Record<string, ColumnDefinition<any>> = {};
    const virtuals = (mongooseSchema as any).virtuals;

    Object.entries(virtuals).forEach(
      ([virtualPath, virtual]: [string, any]) => {
        if (this.shouldExcludeField(virtualPath, excludeFields)) return;
        if (virtual.options?.ref) return; // Skip populated virtuals

        const getterFunction = virtual.getters?.[0]?.toString() || "";
        const columnType = this.inferVirtualColumnType(getterFunction);

        virtualColumns[virtualPath] = {
          label: this.formatFieldLabel(virtualPath),
          field: virtualPath as any,
          type: columnType,
          sortable: this.isSortableField(virtualPath, sortableFields),
        };

        // Add specific formatting based on column type
        if (columnType === "boolean") {
          virtualColumns[virtualPath]!.format = {
            boolean: {
              trueText: "Yes",
              falseText: "No",
            },
          };
        } else if (columnType === "date") {
          virtualColumns[virtualPath]!.format = {
            date: {
              format: "MMM dd, yyyy",
            },
          };
        } else if (columnType === "number") {
          virtualColumns[virtualPath]!.format = {
            number: {
              precision: 2,
            },
          };
        }
      }
    );

    return virtualColumns;
  }

  private inferVirtualType(getterFunction: string): UIFieldType {
    // Check for boolean comparisons and returns
    if (
      /return.*[><=!]+/.test(getterFunction) ||
      getterFunction.includes("Boolean") ||
      /\btrue\b/.test(getterFunction) ||
      /\bfalse\b/.test(getterFunction)
    ) {
      return "checkbox";
    }

    // Check for date operations
    if (
      getterFunction.includes("new Date") ||
      getterFunction.includes("Date(")
    ) {
      return "date";
    }

    // Check for numeric operations
    if (
      getterFunction.includes("Number") ||
      getterFunction.includes("Math.") ||
      /[-+*/%]/.test(getterFunction) ||
      /\d+/.test(getterFunction)
    ) {
      return "number";
    }

    // Check for array operations
    if (getterFunction.includes("Array") || getterFunction.includes("[]")) {
      return "list";
    }

    // Default to text for string concatenation and other string operations
    return "text";
  }

  private inferVirtualColumnType(getterFunction: string): ColumnType {
    // Check for boolean comparisons and returns
    if (
      /return.*[><=!]+/.test(getterFunction) ||
      getterFunction.includes("Boolean") ||
      /\btrue\b/.test(getterFunction) ||
      /\bfalse\b/.test(getterFunction)
    ) {
      return "boolean";
    }

    // Check for date operations
    if (
      getterFunction.includes("new Date") ||
      getterFunction.includes("Date(")
    ) {
      return "date";
    }

    // Check for numeric operations
    if (
      getterFunction.includes("Number") ||
      getterFunction.includes("Math.") ||
      /[-+*/%]/.test(getterFunction) ||
      /\d+/.test(getterFunction)
    ) {
      return "number";
    }

    // Check for array operations
    if (getterFunction.includes("Array") || getterFunction.includes("[]")) {
      return "array";
    }

    // Default to text for string concatenation and other string operations
    return "text";
  }
}
