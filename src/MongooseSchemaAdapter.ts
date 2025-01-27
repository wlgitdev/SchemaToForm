import { Schema } from "mongoose";
import {
  UISchema,
  UIFieldDefinition,
  UIFieldType,
  UIFieldValidation,
  UIFieldReference,
} from "./types";
import { BaseSchemaAdapter, AdapterOptions } from "./SchemaAdapter";

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

  private convertField(
    fieldName: string,
    schemaType: MongooseFieldType,
    readOnlyFields: string[]
  ): UIFieldDefinition {
    const isReadOnly = this.isReadOnlyField(fieldName, readOnlyFields);

    const baseField: UIFieldDefinition = {
      type: this.determineFieldType(schemaType),
      label: this.formatFieldLabel(fieldName),
      ...(isReadOnly ? { readOnly: true } : {}),
    };

    // Add validation
    const validation = this.processValidation(schemaType);
    if (validation) {
      baseField.validation = validation;
    }

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

  processValidation(
    schemaType: MongooseFieldType
  ): UIFieldValidation | undefined {
    if (!schemaType.options) return undefined;

    const validation: UIFieldValidation = {};

    // Required validation
    if (schemaType.options.required) {
      validation.required = true;
    }

    // Number validations
    if (schemaType.instance === "Number") {
      if (schemaType.options.min !== undefined) {
        validation.min = schemaType.options.min;
      }
      if (schemaType.options.max !== undefined) {
        validation.max = schemaType.options.max;
      }
    }

    // String validations
    if (schemaType.instance === "String") {
      if (schemaType.options.minlength !== undefined) {
        validation.minLength = schemaType.options.minlength;
      }
      if (schemaType.options.maxlength !== undefined) {
        validation.maxLength = schemaType.options.maxlength;
      }
      if (schemaType.options.match) {
        validation.pattern = schemaType.options.match.toString();
      }
    }

    return Object.keys(validation).length > 0 ? validation : undefined;
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
}
