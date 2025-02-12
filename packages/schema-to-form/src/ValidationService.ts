import { UISchema, FormData, UIFieldDefinition } from "./";

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationService {
  private schema: UISchema;

  constructor(schema: UISchema) {
    this.schema = schema;
  }

  private isFieldValidatable(field: UIFieldDefinition): boolean {
    if (field.hidden || field.readOnly) {
      return false;
    }

    return true;
  }

  validateField(fieldName: string, value: any): ValidationError | null {
    const field = this.schema.fields[fieldName];
    if (!field?.validation || !this.isFieldValidatable(field)) return null;

    // Required field validation
    if (field.validation.required) {
      if (value === undefined || value === null || value === "") {
        return {
          field: fieldName,
          message: field.validation.message || `${field.label} is required`,
        };
      }

      // Array type validation (multiselect, list)
      if (
        (field.type === "multiselect" || field.type === "list") &&
        Array.isArray(value) &&
        value.length === 0
      ) {
        return {
          field: fieldName,
          message: field.validation.message || `${field.label} is required`,
        };
      }
    }

    return null;
  }

  validateForm(values: FormData): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.entries(this.schema.fields).forEach(([fieldName, field]) => {
      if (!this.isFieldValidatable(field)) return;

      const error = this.validateField(fieldName, values[fieldName]);
      if (error) {
        errors.push(error);
      }
    });

    return errors;
  }

  isValid(values: FormData): boolean {
    return this.validateForm(values).length === 0;
  }
}
