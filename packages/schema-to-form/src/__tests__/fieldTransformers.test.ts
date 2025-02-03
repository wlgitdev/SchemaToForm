import { FieldTransformer } from "../fieldTransformers";
import { FieldValue } from "../FormStore";
import { UIFieldDefinition, BitFlagConfig } from "../types";

describe("FieldTransformer", () => {
  describe("Basic Transformations", () => {
    it("transforms text fields", () => {
      const definition: UIFieldDefinition = {
        type: "text",
        label: "Text Field",
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay("test")).toBe("test");
      expect(transformer.toDisplay(null)).toBe("");
      expect(transformer.fromDisplay("test")).toBe("test");
    });

    it("transforms number fields", () => {
      const definition: UIFieldDefinition = {
        type: "number",
        label: "Number Field",
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay(42)).toBe(42);
      expect(transformer.toDisplay(null)).toBe(0);
      expect(transformer.fromDisplay("42")).toBe(42);
    });

    it("transforms date fields", () => {
      const definition: UIFieldDefinition = {
        type: "date",
        label: "Date Field",
      };
      const transformer = new FieldTransformer(definition);
      const date = new Date("2025-01-01");

      expect(transformer.toDisplay(date)).toBe("2025-01-01");
      expect(transformer.toDisplay(null)).toBe("");
      expect(transformer.fromDisplay("2025-01-01")).toEqual(
        new Date("2025-01-01")
      );
    });
  });

  describe("BitFlag Transformations", () => {
    const bitFlagConfig: BitFlagConfig = {
      flagValue: 0,
      groups: {
        permissions: {
          label: "Permissions",
          options: [
            { value: 1, label: "Read" },
            { value: 2, label: "Write" },
            { value: 4, label: "Delete" },
          ],
        },
      },
    };

    it("transforms bitflags to display", () => {
      const definition: UIFieldDefinition = {
        type: "multiselect",
        label: "Permissions",
        bitFlags: bitFlagConfig,
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay(3)).toEqual([1, 2]); // Read + Write
      expect(transformer.toDisplay(7)).toEqual([1, 2, 4]); // Read + Write + Delete
    });

    it("transforms bitflags from display", () => {
      const definition: UIFieldDefinition = {
        type: "multiselect",
        label: "Permissions",
        bitFlags: bitFlagConfig,
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.fromDisplay([1, 2])).toBe(3); // Read + Write
      expect(transformer.fromDisplay([1, 2, 4])).toBe(7); // Read + Write + Delete
    });
  });

  describe("Custom Value Mappers", () => {
    it("uses custom value mapper when provided", () => {
      const definition: UIFieldDefinition = {
        type: "text",
        label: "Custom Field",
        valueMapper: {
          toDisplay: (value: any) => `Prefix_${value}`,
          fromDisplay: (value: any) => value.replace("Prefix_", ""),
        },
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay("test")).toBe("Prefix_test");
      expect(transformer.fromDisplay("Prefix_test")).toBe("test");
    });
  });

  describe("Option Groups", () => {
    it("transforms option groups correctly", () => {
      const definition: UIFieldDefinition = {
        type: "multiselect",
        label: "Groups",
        optionGroups: [
          {
            label: "Group 1",
            options: [
              { value: "1", label: "Option 1" },
              { value: "2", label: "Option 2" },
            ],
          },
        ],
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay(["1", "2"])).toEqual(["1", "2"]);
      expect(transformer.fromDisplay(["1", "2"])).toEqual(["1", "2"]);
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined/null values", () => {
      const definition: UIFieldDefinition = {
        type: "text",
        label: "Text Field",
      };
      const transformer = new FieldTransformer(definition);

      const undefinedValue: FieldValue = undefined;
      const nullValue: FieldValue = null;

      expect(transformer.toDisplay(undefinedValue)).toBe("");
      expect(transformer.toDisplay(nullValue)).toBe("");
    });

    it("handles invalid date inputs", () => {
      const definition: UIFieldDefinition = {
        type: "date",
        label: "Date Field",
      };
      const transformer = new FieldTransformer(definition);

      expect(transformer.toDisplay("invalid-date")).toBe("invalid-date");
      const invalidDate = transformer.fromDisplay("invalid-date");
      expect(invalidDate).toBeInstanceOf(Date);
      expect(invalidDate?.toString() ?? "").toBe("Invalid Date");
    });
  });
});
