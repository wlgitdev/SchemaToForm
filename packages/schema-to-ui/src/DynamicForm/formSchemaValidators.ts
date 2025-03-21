import { Schema, SchemaTransformer, SchemaType, SchemaValidator, UIFieldDefinition, UIFieldType, UISchema } from "..";

type DefaultFieldValue = string | number | boolean | null | string[] | never[];

export const basicSchemaValidator: SchemaValidator = (schema: Schema, type: SchemaType) => {
  if (type !== "form") {
    return { valid: true, errors: [] };
  }

  const formSchema = schema as UISchema;
  const errors: string[] = [];

  // Check if schema has fields
  if (!formSchema.fields || Object.keys(formSchema.fields).length === 0) {
    errors.push("Schema must have at least one field");
  }

  // Validate each field
  Object.entries(formSchema.fields).forEach(([fieldName, field]) => {
    // Check required field properties
    if (!field.type) {
      errors.push(`Field ${fieldName} must have a type`);
    }

    // Validate field type
    const validTypes: UIFieldType[] = [
      "text",
      "number",
      "date",
      "select",
      "checkbox",
      "list",
      "multiselect",
    ];
    if (!validTypes.includes(field.type)) {
      errors.push(`Field ${fieldName} has invalid type: ${field.type}`);
    }

    // Validate select/multiselect fields
    if (
      (field.type === "select" || field.type === "multiselect") &&
      !field.options &&
      !field.reference
    ) {
      errors.push(`Field ${fieldName} must have options or reference`);
    }
  });

  // Validate layout if present
  if (formSchema.layout) {
    if (formSchema.layout.groups) {
      formSchema.layout.groups.forEach((group, index) => {
        if (!group.name) {
          errors.push(`Group ${index} must have a name`);
        }
        if (!group.fields || group.fields.length === 0) {
          errors.push(
            `Group ${group.name || index} must have at least one field`
          );
        }
        // Check if all group fields exist in schema
        group.fields.forEach((fieldName) => {
          if (!formSchema.fields[fieldName]) {
            errors.push(
              `Group ${
                group.name || index
              } references non-existent field: ${fieldName}`
            );
          }
        });
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Transformers
export const defaultValueTransformer: SchemaTransformer = (
  schema: Schema,
  type: SchemaType
): Schema => {
  if (type !== "form") return schema;
  
  const formSchema = schema as UISchema;
  const transformedFields: Record<string, UIFieldDefinition> = {};

  Object.entries(formSchema.fields).forEach(([fieldName, field]) => {
    transformedFields[fieldName] = {
      ...field,
      defaultValue: field.defaultValue ?? getDefaultValueForType(field.type),
    };
  });

  return {
    ...formSchema,
    fields: transformedFields,
  };
};

export const labelTransformer: SchemaTransformer = (
  schema: Schema,
  type: SchemaType
): Schema => {
  if (type !== "form") return schema;

  const formSchema = schema as UISchema;
  const transformedFields: Record<string, UIFieldDefinition> = {};

  Object.entries(formSchema.fields).forEach(([fieldName, field]) => {
    transformedFields[fieldName] = {
      ...field,
      label: field.label || formatFieldLabel(fieldName),
    };
  });

  return {
    ...formSchema,
    fields: transformedFields,
  };
};

// Helper functions
function getDefaultValueForType(type: UIFieldType): DefaultFieldValue {
  switch (type) {
    case "text":
      return "";
    case "number":
      return 0;
    case "date":
      return null;
    case "checkbox":
      return false;
    case "select":
      return "";
    case "multiselect":
      return [];
    case "list":
      return [];
    default:
      return null;
  }
}

function formatFieldLabel(fieldName: string): string {
  return fieldName
    .split(/(?=[A-Z])|_/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
