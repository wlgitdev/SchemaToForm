import { DependencyHandler } from "./DependencyHandler";
import { UISchema, UIFieldDefinition, FieldEffect } from "./types";

// FormStore.ts
export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | null
  | undefined;
  
export type FormData = Record<string, FieldValue>;
export type FieldError = string | null;
export type FormErrors = Record<string, FieldError>;
export type TouchedFields = Record<string, boolean>;

export interface FormState {
  values: FormData;
  errors: FormErrors;
  touched: TouchedFields;
  dirty: boolean;
  valid: boolean;
  validating: boolean;
  submitting: boolean;
}

export type FormSubscriber = (state: FormState) => void;
export type FieldSubscriber = (value: FieldValue, error: FieldError) => void;

export interface FormValidator {
  (values: FormData): Promise<FormErrors>;
}

export interface FieldValidator {
  (value: FieldValue, values: FormData): Promise<FieldError>;
}

export class FormStore {
  private state: FormState;
  private schema: UISchema;
  private formSubscribers: Set<FormSubscriber>;
  private fieldSubscribers: Map<string, Set<FieldSubscriber>>;
  private fieldValidators: Map<string, FieldValidator>;
  private formValidator?: FormValidator;
  private validationTimeout: number = 200;
  private validationTimers: Map<string, NodeJS.Timeout>;
  private pendingValidations: Map<string, Promise<void>>;
  private referenceData: Record<
    string,
    Array<{ value: string; label: string }>
  > = {};
  private referenceLoading: Record<string, boolean> = {};
  private referenceLoader?: (
    modelName: string
  ) => Promise<Array<{ _id: string; name: string }>>;
  private dependencyHandler: DependencyHandler;

  constructor(
    schema: UISchema,
    initialValues: FormData = {},
    referenceLoader?: (
      modelName: string
    ) => Promise<Array<{ _id: string; name: string }>>
  ) {
    this.schema = schema;
    this.referenceLoader = referenceLoader;

    if (!schema || !schema.fields) {
      throw new Error("Invalid schema provided to FormStore");
    }

    this.formSubscribers = new Set();
    this.fieldSubscribers = new Map();
    this.fieldValidators = new Map();
    this.validationTimers = new Map();
    this.pendingValidations = new Map();
    this.dependencyHandler = new DependencyHandler(schema.fields);

    const processedState = this.initializeStateWithDependencies(initialValues);
    this.state = processedState;

    this.setupValidators();

    if (referenceLoader) {
      this.loadReferences();
    }

    // For select fields with dependencies, set initial value to first option
    const baseValues = this.initializeValues(initialValues);
    Object.entries(schema.fields).forEach(([fieldName, field]) => {
      if (
        field.type === "select" &&
        field.options?.length &&
        !baseValues[fieldName]
      ) {
        baseValues[fieldName] = field.options[0].value;
      }
    });

    // Evaluate initial dependencies based on these values
    const effects = new Map();
    Object.keys(schema.fields).forEach((field) => {
      const fieldEffects = this.dependencyHandler.evaluateDependencies(
        field,
        baseValues
      );
      fieldEffects.forEach((effect, targetField) => {
        effects.set(targetField, effect);
      });
    });

    // Apply all effects to values and schema
    effects.forEach((effect, field) => {
      if (effect.setValue !== undefined) {
        baseValues[field] = effect.setValue;
      }
      if (effect.hide !== undefined) {
        this.schema.fields[field].hidden = effect.hide;
      }
    });

    // Initialize state
    this.state = {
      values: baseValues,
      errors: {},
      touched: {},
      dirty: false,
      valid: true,
      validating: false,
      submitting: false,
    };

    // Setup field validators from schema
    this.setupValidators();

    if (referenceLoader) {
      this.loadReferences();
    }
  }

  // Public API

  /**
   * Subscribe to form state changes
   */
  subscribe(subscriber: FormSubscriber): () => void {
    this.formSubscribers.add(subscriber);
    subscriber(this.state); // Initial notification
    return () => this.formSubscribers.delete(subscriber);
  }

  /**
   * Subscribe to specific field changes
   */
  subscribeToField(field: string, subscriber: FieldSubscriber): () => void {
    if (!this.fieldSubscribers.has(field)) {
      this.fieldSubscribers.set(field, new Set());
    }
    const subscribers = this.fieldSubscribers.get(field)!;
    subscribers.add(subscriber);

    // Initial notification
    subscriber(this.state.values[field], this.state.errors[field] || null);

    return () => {
      const subscribers = this.fieldSubscribers.get(field);
      if (subscribers) {
        subscribers.delete(subscriber);
      }
    };
  }

  /**
   * Set a field value
   */

  async setFieldValue(field: string, value: FieldValue): Promise<void> {
    if (!this.schema.fields[field]) {
      throw new Error(`Field ${field} does not exist in schema`);
    }

    const newValues = {
      ...this.state.values,
      [field]: value,
    };
    // Evaluate dependencies and apply effects

    const effects = this.evaluateAllDependencies(newValues);
    const newState = this.applyEffectsToState(newValues, effects);

    effects.forEach((effect, targetField) => {
      if (effect.setValue !== undefined) {
        newValues[targetField] = effect.setValue;
      }
      if (effect.clearValue) {
        newValues[targetField] = null;
      }
      if (effect.hide !== undefined) {
        this.schema.fields[targetField]!.hidden = effect.hide;
      }
      if (effect.disable !== undefined) {
        this.schema.fields[targetField]!.readOnly = effect.disable;
      }
      if (effect.setValidation) {
        this.schema.fields[targetField]!.validation = {
          ...this.schema.fields[targetField]!.validation,
          ...effect.setValidation,
        };
      }
    });

    const newTouched = {
      ...this.state.touched,
      [field]: true,
    };

    this.setState({
      ...this.state,
      ...newState,
      dirty: true,
      touched: {
        ...this.state.touched,
        [field]: true,
      },
    });

    // Notify field subscribers of value change
    const subscribers = this.fieldSubscribers.get(field);
    if (subscribers) {
      subscribers.forEach((subscriber) =>
        subscriber(value, this.state.errors[field] || null)
      );
    }

    // Await validation
    await this.validateField(field, value, newState.values);
  }

  /**
   * Set multiple field values
   */
  setValues(values: Partial<FormData>): void {
    const filteredValues = Object.entries(values).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as FormData
    );

    const newValues = {
      ...this.state.values,
      ...filteredValues,
    };

    this.setState({
      ...this.state,
      values: newValues,
      dirty: true,
    });

    this.validateForm(newValues);
  }

  /**
   * Reset form to initial values
   */
  reset(values?: FormData): void {
    const newValues = values || this.initializeValues({});
    this.setState({
      values: newValues,
      errors: {},
      touched: {},
      dirty: false,
      valid: true,
      validating: false,
      submitting: false,
    });
  }

  /**
   * Set form-level validator
   */

  async setFormValidator(validator: FormValidator): Promise<void> {
    this.formValidator = validator;
    // Validate form immediately when setting validator
    await this.validateForm(this.state.values);
  }

  /**
   * Set field-level validator
   */

  async setFieldValidator(
    field: string,
    validator: FieldValidator
  ): Promise<void> {
    this.fieldValidators.set(field, validator);
    // Validate field immediately when setting validator
    await this.validateField(
      field,
      this.state.values[field],
      this.state.values
    );
  }

  /**
   * Get current form state
   */
  getState(): FormState {
    return this.state;
  }

  /**
   * Validate entire form
   */
  async validate(): Promise<boolean> {
    const errors = await this.validateForm(this.state.values);
    return Object.keys(errors).length === 0;
  }

  // Private methods
  private initializeStateWithDependencies(initialValues: FormData): FormState {
    // Initialize base values
    const baseValues = { ...initialValues };

    // Set select fields to first option if no value provided
    Object.entries(this.schema.fields).forEach(([fieldName, field]) => {
      if (
        field.type === "select" &&
        field.options?.length &&
        !baseValues[fieldName]
      ) {
        baseValues[fieldName] = field.options[0].value;
      }
    });

    // Evaluate and collect all effects
    const allEffects = this.evaluateAllDependencies(baseValues);

    // Apply all effects to create final state
    const finalState = this.applyEffectsToState(baseValues, allEffects);

    return finalState;
  }

  private async loadReferences(): Promise<void> {
    if (!this.referenceLoader) return;

    const referenceFields = Object.entries(this.schema.fields).filter(
      ([_, field]) => field.reference
    );

    await Promise.all(
      referenceFields.map(async ([fieldName, field]) => {
        if (!field.reference) return;

        this.referenceLoading[fieldName] = true;
        this.notifySubscribers();

        try {
          const data = await this.referenceLoader!(field.reference.modelName);
          this.referenceData[fieldName] = data.map((item) => ({
            value: item._id,
            label:
              (item[
                field.reference!.displayField as keyof typeof item
              ] as string) || item.name,
          }));
        } catch (error) {
          console.error(
            `Failed to load reference data for ${fieldName}:`,
            error
          );
        } finally {
          this.referenceLoading[fieldName] = false;
          this.notifySubscribers();
        }
      })
    );
  }

  public getReferenceData(
    field: string
  ): Array<{ value: string; label: string }> | undefined {
    return this.referenceData[field];
  }

  public isReferenceLoading(field: string): boolean {
    return this.referenceLoading[field] || false;
  }

  private initializeDependencies(initialValues: FormData): FormData {
    const newValues = { ...initialValues };

    // Get all fields with dependencies
    Object.entries(this.schema.fields).forEach(([fieldName, field]) => {
      if (field.dependencies) {
        // Evaluate dependencies for each field
        const effects = this.dependencyHandler.evaluateDependencies(
          fieldName,
          newValues
        );

        // Apply effects to the initial values
        effects.forEach((effect, targetField) => {
          if (effect.setValue !== undefined) {
            newValues[targetField] = effect.setValue;
          }
          if (effect.hide !== undefined) {
            this.schema.fields[targetField]!.hidden = effect.hide;
          }
          if (effect.disable !== undefined) {
            this.schema.fields[targetField]!.readOnly = effect.disable;
          }
        });
      }
    });

    return newValues;
  }
  private evaluateAllDependencies(values: FormData): Map<string, FieldEffect> {
    const allEffects = new Map<string, FieldEffect>();

    // Evaluate dependencies for each field
    Object.keys(this.schema.fields).forEach((fieldName) => {
      const effects = this.dependencyHandler.evaluateDependencies(
        fieldName,
        values
      );
      effects.forEach((effect, targetField) => {
        allEffects.set(targetField, {
          ...(allEffects.get(targetField) || {}),
          ...effect,
        });
      });
    });

    return allEffects;
  }

  private initializeValues(initialValues: FormData): FormData {
    const values: FormData = {};
    Object.entries(this.schema.fields).forEach(([field, definition]) => {
      values[field] = initialValues[field] ?? definition.defaultValue ?? null;
    });
    return values;
  }
  private applyEffectsToState(
    values: FormData,
    effects: Map<string, FieldEffect>
  ): FormState {
    const newValues = { ...values };

    // Apply all effects
    effects.forEach((effect, fieldName) => {
      // Apply value effects
      if (effect.setValue !== undefined) {
        newValues[fieldName] = effect.setValue;
      }
      if (effect.clearValue) {
        newValues[fieldName] = null;
      }

      // Apply schema modifications
      if (effect.hide !== undefined) {
        this.schema.fields[fieldName].hidden = effect.hide;
      }
      if (effect.disable !== undefined) {
        this.schema.fields[fieldName].readOnly = effect.disable;
      }
      if (effect.setValidation) {
        this.schema.fields[fieldName].validation = {
          ...this.schema.fields[fieldName].validation,
          ...effect.setValidation,
        };
      }
      if (effect.setOptions) {
        this.schema.fields[fieldName].options = effect.setOptions;
      }
      if (effect.setOptionGroups) {
        this.schema.fields[fieldName].optionGroups = effect.setOptionGroups;
      }
    });

    return {
      values: newValues,
      errors: {},
      touched: {},
      dirty: false,
      valid: true,
      validating: false,
      submitting: false,
    };
  }

  private setupValidators(): void {
    Object.entries(this.schema.fields).forEach(([field, definition]) => {
      if (definition.validation) {
        this.fieldValidators.set(field, this.createFieldValidator(definition));
      }
    });
  }

  private createFieldValidator(fieldDef: UIFieldDefinition): FieldValidator {
    return async (value: FieldValue, values: FormData): Promise<FieldError> => {
      const validation = fieldDef.validation;
      if (!validation) return null;

      if (validation.required && !value) {
        return `${fieldDef.label} is required`;
      }

      if (value) {
        if (typeof value === "string") {
          if (validation.minLength && value.length < validation.minLength) {
            return `${fieldDef.label} must be at least ${validation.minLength} characters`;
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            return `${fieldDef.label} must be at most ${validation.maxLength} characters`;
          }
          if (validation.pattern) {
            const regex = new RegExp(validation.pattern);
            if (!regex.test(value)) {
              return (
                validation.patternMessage ||
                `${fieldDef.label} format is invalid`
              );
            }
          }
        }

        if (typeof value === "number") {
          if (validation.min !== undefined && value < validation.min) {
            return `${fieldDef.label} must be at least ${validation.min}`;
          }
          if (validation.max !== undefined && value > validation.max) {
            return `${fieldDef.label} must be at most ${validation.max}`;
          }
        }
      }

      if (validation.custom) {
        const result = await validation.custom(value);
        if (typeof result === "string") return result;
        if (result === false) return `${fieldDef.label} is invalid`;
      }

      return null;
    };
  }

  private async validateField(
    field: string,
    value: FieldValue,
    values: FormData
  ): Promise<void> {
    const validator = this.fieldValidators.get(field);
    if (!validator) return;

    // Clear existing timer and pending validation
    if (this.validationTimers.has(field)) {
      clearTimeout(this.validationTimers.get(field));
    }

    // Create new validation promise
    const validationPromise = new Promise<void>((resolve) => {
      const timer = setTimeout(async () => {
        try {
          this.setState({
            ...this.state,
            validating: true,
          });

          const error = await validator(value, values);

          this.setState({
            ...this.state,
            errors: {
              ...this.state.errors,
              [field]: error,
            },
            validating: false,
            valid: !error,
          });

          // Notify field subscribers of validation result
          const subscribers = this.fieldSubscribers.get(field);
          if (subscribers) {
            subscribers.forEach((subscriber) => subscriber(value, error));
          }

          resolve();
        } catch (err) {
          console.error("Validation error:", err);
          resolve();
        }
      }, this.validationTimeout);

      this.validationTimers.set(field, timer);
    });

    this.pendingValidations.set(field, validationPromise);
    await validationPromise;
  }

  /**
   * Validate entire form
   */
  async validateForm(values: FormData): Promise<FormErrors> {
    if (!this.formValidator) return {};

    this.setState({
      ...this.state,
      validating: true,
    });

    try {
      const errors = await this.formValidator(values);

      this.setState({
        ...this.state,
        errors: {
          ...this.state.errors,
          ...errors,
        },
        valid: Object.keys(errors).length === 0,
        validating: false,
      });

      // Notify field subscribers of new errors
      Object.entries(errors).forEach(([field, error]) => {
        const subscribers = this.fieldSubscribers.get(field);
        if (subscribers) {
          subscribers.forEach((subscriber) => subscriber(values[field], error));
        }
      });

      return errors;
    } catch (err) {
      console.error("Form validation error:", err);
      return {};
    }
  }

  private setState(newState: FormState): void {
    this.state = newState;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.formSubscribers.forEach((subscriber) => {
      subscriber(this.state);
    });
  }
}
