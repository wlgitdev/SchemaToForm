import { DependencyHandler, UISchema, FieldEffect } from "./";
import { ValidationError, ValidationService } from "./ValidationService";

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
export type TouchedFields = Record<string, boolean>;

export interface FormState {
  values: FormData;
  touched: TouchedFields;
  errors: Record<string, string>;
  dirty: boolean;
  submitting: boolean;
  isValid: boolean;
}

export type FormSubscriber = (state: FormState) => void;
export type FormFieldSubscriber = (value: FieldValue) => void;

export class FormStore {
  private state: FormState;
  private schema: UISchema;
  private formSubscribers: Set<FormSubscriber>;
  private fieldSubscribers: Map<string, Set<FormFieldSubscriber>>;
  private referenceData: Record<
    string,
    Array<{ value: string; label: string }>
  > = {};
  private referenceLoading: Record<string, boolean> = {};
  private referenceLoader?: (
    modelName: string
  ) => Promise<Array<{ _id: string; name: string }>>;
  private dependencyHandler: DependencyHandler;
  private validationService: ValidationService;

  constructor(
    schema: UISchema,
    initialValues: FormData = {},
    referenceLoader?: (
      modelName: string
    ) => Promise<Array<{ _id: string; name: string }>>
  ) {
    this.schema = schema;
    this.referenceLoader = referenceLoader;
    this.validationService = new ValidationService(schema);

    if (!schema || !schema.fields) {
      throw new Error("Invalid schema provided to FormStore");
    }

    this.formSubscribers = new Set();
    this.fieldSubscribers = new Map();
    this.dependencyHandler = new DependencyHandler(schema.fields);

    const processedState = this.initializeStateWithDependencies(initialValues);
    this.state = processedState;

    if (referenceLoader) {
      this.loadReferences();
    }

    // For select fields with dependencies, set initial value to first option
    const baseValues = this.initializeValues(initialValues);
    const initialErrors = this.validationService.validateForm(baseValues);
    Object.entries(schema.fields).forEach(([fieldName, field]) => {
      if (
        field.type === "select" &&
        field.options?.length &&
        !baseValues[fieldName]
      ) {
        baseValues[fieldName] = field.options[0]!.value;
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
        this.schema.fields[field]!.hidden = effect.hide;
      }
    });

    // Initialize state
    this.state = {
      values: baseValues,
      touched: {},
      errors: this.transformValidationErrors(initialErrors),
      dirty: false,
      submitting: false,
      isValid: initialErrors.length === 0,
    };

    if (referenceLoader) {
      this.loadReferences();
    }
  }

  // Public API

  private transformValidationErrors(
    errors: ValidationError[]
  ): Record<string, string> {
    return errors.reduce((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {} as Record<string, string>);
  }
  private validateField(field: string, value: FieldValue): string | null {
    const error = this.validationService.validateField(field, value);
    return error?.message || null;
  }

  validateForm(): boolean {
    const errors = this.validationService.validateForm(this.state.values);
    const newErrors = this.transformValidationErrors(errors);

    this.setState({
      ...this.state,
      errors: newErrors,
      isValid: errors.length === 0,
    });

    return errors.length === 0;
  }

  async submit(): Promise<boolean> {
    if (!this.validateForm()) {
      return false;
    }

    this.setState({
      ...this.state,
      submitting: true,
    });

    return true;
  }

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
  subscribeToField(field: string, subscriber: FormFieldSubscriber): () => void {
    if (!this.fieldSubscribers.has(field)) {
      this.fieldSubscribers.set(field, new Set());
    }
    const subscribers = this.fieldSubscribers.get(field)!;
    subscribers.add(subscriber);

    // Initial notification
    subscriber(this.state.values[field]);

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

    // Validate the changed field
    const fieldError = this.validateField(field, value);
    const newErrors = {
      ...this.state.errors,
      [field]: fieldError || "",
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
    });

    const newTouched = {
      ...this.state.touched,
      [field]: true,
    };

    this.setState({
      ...newState,
      errors: newErrors,
      touched: {
        ...this.state.touched,
        [field]: true,
      },
      dirty: true,
      isValid: Object.values(newErrors).every((error) => !error),
    });

    // Notify field subscribers of value change
    const subscribers = this.fieldSubscribers.get(field);
    if (subscribers) {
      subscribers.forEach((subscriber) => subscriber(value));
    }
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
  }

  /**
   * Reset form to initial values
   */
  reset(values?: FormData): void {
    const newValues = values || this.initializeValues({});
    // Validate the new/initial values
    const validationErrors = this.validationService.validateForm(newValues);
    const errors = this.transformValidationErrors(validationErrors);

    this.setState({
      values: newValues,
      touched: {},
      dirty: false,
      submitting: false,
      errors,
      isValid: validationErrors.length === 0,
    });
  }

  /**
   * Get current form state
   */
  getState(): FormState {
    return this.state;
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
        baseValues[fieldName] = field.options[0]!.value;
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
      const defaultValue = (() => {
        switch (definition.type) {
          case "text":
          case "select":
            return "";
          case "number":
            return 0;
          case "date":
            return "";
          case "checkbox":
            return false;
          case "multiselect":
          case "list":
            return [];
          default:
            return "";
        }
      })();

      values[field] =
        initialValues[field] ?? definition.defaultValue ?? defaultValue;
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
        this.schema.fields[fieldName]!.hidden = effect.hide;
      }
      if (effect.disable !== undefined) {
        this.schema.fields[fieldName]!.readOnly = effect.disable;
      }
      if (effect.setOptions) {
        this.schema.fields[fieldName]!.options = effect.setOptions;
      }
      if (effect.setOptionGroups) {
        this.schema.fields[fieldName]!.optionGroups = effect.setOptionGroups;
      }
    });

    // Validate the new state after applying effects
    const validationErrors = this.validationService.validateForm(newValues);
    const errors = this.transformValidationErrors(validationErrors);

    return {
      values: newValues,
      touched: {},
      dirty: false,
      submitting: false,
      errors,
      isValid: validationErrors.length === 0,
    };
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
