import { UIFieldDefinition,
          FieldValue } from "./index";

export interface TransformerConfig {
  toDisplay: (value: FieldValue) => any;
  fromDisplay: (value: any) => FieldValue;
}

export class FieldTransformer {
  private definition: UIFieldDefinition;

  constructor(definition: UIFieldDefinition) {
    this.definition = definition;
  }

  toDisplay(value: FieldValue): any {
    // Use custom mapper if provided
    if (this.definition.valueMapper?.toDisplay) {
      return this.definition.valueMapper.toDisplay(value);
    }

    // Handle BitFlags
    if (this.definition.bitFlags && typeof value === "number") {
      return this.transformBitFlagsToDisplay(value);
    }

    // Handle option groups
    if (this.definition.optionGroups && Array.isArray(value)) {
      return this.transformOptionGroupsToDisplay(value);
    }

    return this.defaultToDisplay(value);
  }

  fromDisplay(value: any): FieldValue {
    // Use custom mapper if provided
    if (this.definition.valueMapper?.fromDisplay) {
      return this.definition.valueMapper.fromDisplay(value);
    }

    // Handle BitFlags
    if (this.definition.bitFlags && Array.isArray(value)) {
      return this.transformBitFlagsFromDisplay(value);
    }

    // Handle option groups
    if (this.definition.optionGroups && Array.isArray(value)) {
      return this.transformOptionGroupsFromDisplay(value);
    }

    return this.defaultFromDisplay(value);
  }

  private transformBitFlagsToDisplay(value: number): number[] {
    const selectedFlags: number[] = [];
    Object.values(this.definition.bitFlags!.groups).forEach((group) => {
      group.options.forEach((option) => {
        if ((value & option.value) === option.value) {
          selectedFlags.push(option.value);
        }
      });
    });
    return selectedFlags;
  }

  private transformBitFlagsFromDisplay(values: number[]): number {
    return values.reduce((acc, val) => acc | val, 0);
  }

  private transformOptionGroupsToDisplay(value: any[]): string[] {
    return value.map(String);
  }

  private transformOptionGroupsFromDisplay(values: string[]): string[] {
    return values;
  }

  private defaultToDisplay(value: FieldValue): any {
    if (value === null || value === undefined) {
      switch (this.definition.type) {
        case "text":
        case "select":
        case "date":
          return "";
        case "number":
          return 0;
        case "checkbox":
          return false;
        case "multiselect":
        case "list":
          return [];
        default:
          return "";
      }
    }

    switch (this.definition.type) {
      case "date":
        return value instanceof Date
          ? value.toISOString().split("T")[0]
          : String(value || "");
      case "number":
        return Number(value || 0);
      case "multiselect":
      case "list":
        return Array.isArray(value) ? value : [];
      case "checkbox":
        return Boolean(value);
      default:
        return String(value || "");
    }
  }

  private defaultFromDisplay(value: any): FieldValue {
    if (value === null || value === undefined) {
      return null;
    }

    switch (this.definition.type) {
      case "date":
        return value ? new Date(value) : null;
      case "number":
        return Number(value);
      case "multiselect":
      case "list":
        return Array.isArray(value) ? value : [String(value)];
      case "checkbox":
        return Boolean(value);
      default:
        return String(value);
    }
  }

  private getDefaultDisplayValue(): any {
    switch (this.definition.type) {
      case "text":
        return "";
      case "number":
        return 0;
      case "date":
        return "";
      case "checkbox":
        return false;
      case "select":
        return "";
      case "multiselect":
      case "list":
        return [];
      default:
        return null;
    }
  }
}
