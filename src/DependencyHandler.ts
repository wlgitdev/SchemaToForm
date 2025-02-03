import {
  DependencyRule,
  DependencyOperator,
  FieldEffect,
  UIFieldDefinition,
} from "./types";
import { FormData } from "./FormStore";

export class DependencyHandler {
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private fields: Record<string, UIFieldDefinition>;

  constructor(fields: Record<string, UIFieldDefinition>) {
    this.fields = fields;
    this.buildDependencyGraph();
  }

  public getDependentFields(field: string): Set<string> {
    return this.dependencyGraph.get(field) || new Set();
  }

  public evaluateDependencies(
    field: string,
    formData: FormData
  ): Map<string, FieldEffect> {
    const effects = new Map<string, FieldEffect>();
    const dependentFields = this.getDependentFields(field);

    dependentFields.forEach((dependentField) => {
      const fieldDef = this.fields[dependentField];
      if (!fieldDef!.dependencies) return;

      const fieldEffects = this.evaluateFieldDependencies(
        fieldDef!.dependencies,
        formData
      );
      if (fieldEffects) {
        effects.set(dependentField, fieldEffects);
      }
    });

    return effects;
  }

  private buildDependencyGraph(): void {
    Object.entries(this.fields).forEach(([fieldName, field]) => {
      if (!field.dependencies) return;

      field.dependencies.forEach((rule) => {
        this.addDependency(rule.field, fieldName);
        this.addGroupDependencies(rule, fieldName);
      });
    });
  }

  private addDependency(sourceField: string, targetField: string): void {
    if (!this.dependencyGraph.has(sourceField)) {
      this.dependencyGraph.set(sourceField, new Set());
    }
    this.dependencyGraph.get(sourceField)!.add(targetField);
  }

  private addGroupDependencies(
    rule: DependencyRule,
    targetField: string
  ): void {
    // Handle AND conditions
    rule.and?.forEach((andRule) => {
      this.addDependency(andRule.field, targetField);
      this.addGroupDependencies(andRule, targetField);
    });

    // Handle OR conditions
    rule.or?.forEach((orRule) => {
      this.addDependency(orRule.field, targetField);
      this.addGroupDependencies(orRule, targetField);
    });
  }

  private evaluateRule(rule: DependencyRule, formData: FormData): boolean {
    // Check main condition
    const mainCondition = this.evaluateCondition(
      rule.field,
      rule.operator,
      rule.value,
      formData
    );

    if (!mainCondition) return false;

    // Check AND conditions
    if (rule.and?.length) {
      return rule.and.every((andRule) => this.evaluateRule(andRule, formData));
    }

    // Check OR conditions
    if (rule.or?.length) {
      return rule.or.some((orRule) => this.evaluateRule(orRule, formData));
    }

    return true;
  }

  private evaluateFieldDependencies(
    rules: DependencyRule[],
    formData: FormData
  ): FieldEffect | null {
    for (const rule of rules) {
      if (this.evaluateRule(rule, formData)) {
        // If rule has AND conditions with effects, use the last AND effect
        if (rule.and?.length) {
          const lastAndRule = rule.and[rule.and.length - 1];
          return lastAndRule!.effect;
        }
        return rule.effect;
      }
    }
    return null;
  }

  private evaluateCondition(
    field: string,
    operator: DependencyOperator,
    expectedValue: any,
    formData: FormData
  ): boolean {
    const actualValue = formData[field];

    switch (operator) {
      case "equals":
        return actualValue === expectedValue;
      case "notEquals":
        return actualValue !== expectedValue;
      case "contains":
        return String(actualValue).includes(String(expectedValue));
      case "notContains":
        return !String(actualValue).includes(String(expectedValue));
      case "greaterThan":
        return Number(actualValue) > Number(expectedValue);
      case "lessThan":
        return Number(actualValue) < Number(expectedValue);
      case "greaterThanOrEqual":
        return Number(actualValue) >= Number(expectedValue);
      case "lessThanOrEqual":
        return Number(actualValue) <= Number(expectedValue);
      case "in":
        return (
          Array.isArray(expectedValue) && expectedValue.includes(actualValue)
        );
      case "notIn":
        return (
          Array.isArray(expectedValue) && !expectedValue.includes(actualValue)
        );
      case "isNull":
        return actualValue === null || actualValue === undefined;
      case "isNotNull":
        return actualValue !== null && actualValue !== undefined;
      case "startsWith":
        return String(actualValue).startsWith(String(expectedValue));
      case "endsWith":
        return String(actualValue).endsWith(String(expectedValue));
      case "regex":
        return new RegExp(expectedValue).test(String(actualValue));
      default:
        return false;
    }
  }
}
