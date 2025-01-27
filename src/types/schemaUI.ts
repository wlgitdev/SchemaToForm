export type UIFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'list'
  | 'multiselect';

// Define possible operations for field dependencies
export type DependencyOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'startsWith'
  | 'endsWith'
  | 'regex';


export interface BitFlagGroup {
  label: string;
  options: BitFlagOption[];
}

export interface BitFlagConfig<T extends string = string> {
  flagValue: number;
  groups: Record<T, BitFlagGroup>;
}

export interface OptionGroup {
  label: string;
  options: Array<{
    value: string | number;
    label: string;
  }>;
}

export interface BitFlagOption {
  value: number;
  label: string;
}



// Define possible effects that can be applied when a dependency condition is met
export interface FieldEffect {
  // Visual effects
  hide?: boolean;
  disable?: boolean;
  highlight?: boolean;
  // Value manipulation
  setValue?: any;
  clearValue?: boolean;
  // Validation changes
  setRequired?: boolean;
  setValidation?: Partial<UIFieldValidation>;
  // Options modification for select/multiselect
  filterOptions?: {
    field: string;
    operator: DependencyOperator;
    value: any;
  };
  setOptions?: Array<{
    value: string | number;
    label: string;
  }>;
  setOptionGroups?: OptionGroup[];
  setBitFlags?: BitFlagConfig;
  defaultFromField?: {
    field: string;
    transform?: (value: any) => any;
  };
  // Custom effects
  custom?: (
    field: UIFieldDefinition,
    dependentValue: any
  ) => Partial<UIFieldDefinition>;
}

// Define a single dependency rule
export interface DependencyRule {
  field: string;
  operator: DependencyOperator;
  value?: any;
  effect: FieldEffect;
  // Optional: evaluate multiple conditions
  and?: DependencyRule[];
  or?: DependencyRule[];
}

export interface UIFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
  custom?: (value: any) => boolean | string;
}

export interface UIFieldReference {
  modelName: string;
  displayField: string;
  multiple?: boolean;
}

export interface UIFieldDefinition {
  type: UIFieldType;
  label: string;
  description?: string;
  defaultValue?: any;
  placeholder?: string;
  validation?: UIFieldValidation;
  reference?: UIFieldReference;
  options?: Array<{
    value: string | number;
    label: string;
  }>;
  readOnly?: boolean;
  hidden?: boolean;
  // Enhanced dependency configuration
  dependencies?: DependencyRule[];
  bitFlags?: BitFlagConfig;
  optionGroups?: OptionGroup[];
  valueMapper?: {
    toDisplay?: (value: any) => any;
    fromDisplay?: (value: any) => any;
  };
}

export interface UISchema {
  fields: Record<string, UIFieldDefinition>;
  // Optional layout configuration
  layout?: {
    groups?: Array<{
      name: string;
      label: string;
      fields: string[];
      collapsible?: boolean;
    }>;
    order?: string[];
  };
}

// Helper function to create a dependency rule
export function createDependencyRule(rule: DependencyRule): DependencyRule {
  return rule;
}
// Helper to create UI schema definitions
export const createUISchema = (config: UISchema): UISchema => config;

// Helper function to create a type-safe bit flag config
export function createBitFlagConfig<T extends string>(config: BitFlagConfig<T>): BitFlagConfig<T> {
  return config;
}