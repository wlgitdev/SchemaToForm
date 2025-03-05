import { UIFieldDefinition, FieldValue, FieldTransformer } from ".";

export interface FieldState {
  value: FieldValue;
  error: string | null;
  touched: boolean;
  dirty: boolean;
  dependent: boolean;
}

export type FieldSubscriber = (state: FieldState) => void;

export class FieldStore {
  private transformer: FieldTransformer;
  private state: FieldState;
  private definition: UIFieldDefinition;
  private subscribers: Set<FieldSubscriber>;
  private dependencyFields: Set<string>;

  constructor(definition: UIFieldDefinition, initialValue?: FieldValue) {
    this.transformer = new FieldTransformer(definition);
    this.definition = definition;
    this.subscribers = new Set();
    this.dependencyFields = new Set();

    // Initialize state
    this.state = {
      value:
        initialValue !== undefined
          ? this.transformer.fromDisplay(initialValue)
          : this.getDefaultValue(),
      error: null,
      touched: false,
      dirty: false,
      dependent: false,
    };

    // Setup dependencies
    this.setupDependencies();
  }

  // Public API

  /**
   * Subscribe to field state changes
   */
  subscribe(subscriber: FieldSubscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.state);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Set field value
   */
  async setValue(value: FieldValue): Promise<void> {
    const transformedValue = this.transformer.fromDisplay(value);
    this.setState({
      ...this.state,
      value: transformedValue,
      touched: true,
      dirty: true,
    });
  }

  getValue(): FieldValue {
    return this.transformer.toDisplay(this.state.value);
  }

  /**
   * Set field error
   */
  setError(error: string | null): void {
    this.setState({
      ...this.state,
      error,
    });
  }

  /**
   * Reset field state
   */
  reset(value?: FieldValue): void {
    this.setState({
      value: value ?? this.getDefaultValue(),
      error: null,
      touched: false,
      dirty: false,
      dependent: this.state.dependent,
    });
  }

  /**
   * Get current field state
   */
  getState(): FieldState {
    return this.state;
  }

  /**
   * Get dependency fields
   */
  getDependencyFields(): Set<string> {
    return this.dependencyFields;
  }

  /**
   * Update field based on dependency changes
   */
  updateFromDependencies(dependentValues: Record<string, FieldValue>): void {
    if (!this.definition.dependencies) return;

    let shouldUpdate = false;
    let newState = { ...this.state };

    for (const rule of this.definition.dependencies) {
      const dependentValue = dependentValues[rule.field];

      // Check if rule conditions are met
      const conditionMet = this.evaluateDependencyRule(rule, dependentValue);

      if (conditionMet) {
        // Apply rule effects
        if (rule.effect.hide !== undefined) {
          newState.dependent = true;
          shouldUpdate = true;
        }

        if (rule.effect.setValue !== undefined) {
          newState.value = rule.effect.setValue;
          newState.dependent = true;
          shouldUpdate = true;
        }

        if (rule.effect.clearValue) {
          newState.value = this.getDefaultValue();
          newState.dependent = true;
          shouldUpdate = true;
        }
      }
    }

    if (shouldUpdate) {
      this.setState(newState);
    }
  }

  // Private methods

  private setupDependencies(): void {
    if (!this.definition.dependencies) return;

    for (const rule of this.definition.dependencies) {
      this.dependencyFields.add(rule.field);
    }
  }

  private getDefaultValue(): FieldValue {
    if (this.definition.defaultValue !== undefined) {
      return this.definition.defaultValue;
    }

    switch (this.definition.type) {
      case "text":
        return "";
      case "number":
        return 0;
      case "checkbox":
        return false;
      case "date":
        return "";
      case "select":
        return "";
      case "multiselect":
      case "list":
        return [];
      default:
        return "";
    }
  }

  private evaluateDependencyRule(
    rule: any,
    dependentValue: FieldValue
  ): boolean {
    switch (rule.operator) {
      case "equals":
        return dependentValue === rule.value;
      case "notEquals":
        return dependentValue !== rule.value;
      case "contains":
        return String(dependentValue).includes(String(rule.value));
      case "notContains":
        return !String(dependentValue).includes(String(rule.value));
      case "greaterThan":
        return Number(dependentValue) > Number(rule.value);
      case "lessThan":
        return Number(dependentValue) < Number(rule.value);
      case "isNull":
        return dependentValue === null || dependentValue === undefined;
      case "isNotNull":
        return dependentValue !== null && dependentValue !== undefined;
      default:
        return false;
    }
  }

  private setState(newState: FieldState): void {
    this.state = newState;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((subscriber) => {
      subscriber(this.state);
    });
  }
}
