import { DependencyHandler } from "../DependencyHandler";
import { UISchema, UIFieldDefinition } from "../types";

describe("DependencyHandler", () => {
  let schema: Record<string, UIFieldDefinition>;
  let handler: DependencyHandler;

  beforeEach(() => {
    schema = {
      employmentType: {
        type: "select",
        label: "Employment Type",
        options: [
          { value: "fullTime", label: "Full Time" },
          { value: "contract", label: "Contract" },
        ],
      },
      contractLength: {
        type: "number",
        label: "Contract Length (months)",
        dependencies: [
          {
            field: "employmentType",
            operator: "equals",
            value: "contract",
            effect: {
              hide: false,
              setRequired: true,
            },
          },
        ],
      },
      salary: {
        type: "number",
        label: "Salary",
        dependencies: [
          {
            field: "employmentType",
            operator: "equals",
            value: "fullTime",
            effect: {
              setValidation: {
                required: true,
                min: 30000,
              },
            },
          },
        ],
      },
      benefits: {
        type: "multiselect",
        label: "Benefits",
        dependencies: [
          {
            field: "employmentType",
            operator: "equals",
            value: "fullTime",
            effect: {
              hide: false,
            },
            and: [
              {
                field: "salary",
                operator: "greaterThan",
                value: 50000,
                effect: {
                  setOptions: [
                    { value: "health", label: "Health Insurance" },
                    { value: "dental", label: "Dental Insurance" },
                    { value: "401k", label: "401(k)" },
                  ],
                },
              },
            ],
          },
        ],
      },
    };

    handler = new DependencyHandler(schema);
  });

  test("identifies dependent fields correctly", () => {
    const dependents = handler.getDependentFields("employmentType");
    expect(dependents).toContain("contractLength");
    expect(dependents).toContain("salary");
    expect(dependents).toContain("benefits");
  });

  test("evaluates simple dependency", () => {
    const effects = handler.evaluateDependencies("employmentType", {
      employmentType: "contract",
    });

    const contractEffect = effects.get("contractLength");
    expect(contractEffect).toBeDefined();
    expect(contractEffect?.hide).toBe(false);
    expect(contractEffect?.setRequired).toBe(true);
  });

  test("evaluates complex AND conditions", () => {
    const effects = handler.evaluateDependencies("salary", {
      employmentType: "fullTime",
      salary: 60000,
    });

    const benefitsEffect = effects.get("benefits");
    expect(benefitsEffect).toBeDefined();
    expect(benefitsEffect?.setOptions).toHaveLength(3);
  });

  test("handles multiple dependent fields", () => {
    const effects = handler.evaluateDependencies("employmentType", {
      employmentType: "fullTime",
      salary: 60000,
    });

    expect(effects.size).toBeGreaterThan(1);
    expect(effects.has("salary")).toBe(true);
    expect(effects.has("benefits")).toBe(true);
  });

  test("handles non-existent dependencies gracefully", () => {
    const effects = handler.evaluateDependencies("nonexistent", {});
    expect(effects.size).toBe(0);
  });
});
