import {
  basicSchemaValidator,
  defaultValueTransformer,
  labelTransformer,
} from "../schemaValidators";
import { UISchema } from "../types";

describe("Schema Validators", () => {
  describe("basicSchemaValidator", () => {
    it("should validate a correct schema", () => {
      const schema: UISchema = {
        fields: {
          name: {
            type: "text",
            label: "Name",
          },
        },
      };

      const result = basicSchemaValidator(schema);
      expect(typeof result !== "boolean" && result.valid).toBe(true);
      expect(typeof result !== "boolean" && result.errors).toHaveLength(0);
    });

    it("should fail on empty fields", () => {
      const schema: UISchema = {
        fields: {},
      };

      const result = basicSchemaValidator(schema);
      expect(typeof result !== "boolean" && result.valid).toBe(false);
      expect(typeof result !== "boolean" && result.errors).toContain(
        "Schema must have at least one field"
      );
    });

    it("should validate field types", () => {
      const schema: UISchema = {
        fields: {
          invalid: {
            type: "invalid" as any,
            label: "Invalid",
          },
        },
      };

      const result = basicSchemaValidator(schema);
      expect(typeof result !== "boolean" && result.valid).toBe(false);
      expect(typeof result !== "boolean" && result.errors).toContain(
        "Field invalid has invalid type: invalid"
      );
    });

    it("should validate select/multiselect fields", () => {
      const schema: UISchema = {
        fields: {
          type: {
            type: "select",
            label: "Type",
          },
        },
      };

      const result = basicSchemaValidator(schema);
      expect(typeof result !== "boolean" && result.valid).toBe(false);
      expect(typeof result !== "boolean" && result.errors).toContain(
        "Field type must have options or reference"
      );
    });

    it("should validate layout groups", () => {
      const schema: UISchema = {
        fields: {
          name: {
            type: "text",
            label: "Name",
          },
        },
        layout: {
          groups: [
            {
              name: "",
              label: "Group",
              fields: ["nonexistent"],
            },
          ],
        },
      };

      const result = basicSchemaValidator(schema);
      expect(typeof result !== "boolean" && result.valid).toBe(false);
      expect(typeof result !== "boolean" && result.errors).toContain(
        "Group 0 must have a name"
      );
      expect(typeof result !== "boolean" && result.errors).toContain(
        "Group 0 references non-existent field: nonexistent"
      );
    });
  });
});

describe("Schema Transformers", () => {
  describe("defaultValueTransformer", () => {
    it("should add default values to fields", () => {
      const schema: UISchema = {
        fields: {
          text: { type: "text", label: "Text" },
          number: { type: "number", label: "Number" },
          date: { type: "date", label: "Date" },
          checkbox: { type: "checkbox", label: "Checkbox" },
          select: { type: "select", label: "Select" },
          multiselect: { type: "multiselect", label: "MultiSelect" },
          list: { type: "list", label: "List" },
        },
      };

      const transformed = defaultValueTransformer(schema);

      expect(transformed.fields.text.defaultValue).toBe("");
      expect(transformed.fields.number.defaultValue).toBe(0);
      expect(transformed.fields.date.defaultValue).toBe(null);
      expect(transformed.fields.checkbox.defaultValue).toBe(false);
      expect(transformed.fields.select.defaultValue).toBe("");
      expect(transformed.fields.multiselect.defaultValue).toEqual([]);
      expect(transformed.fields.list.defaultValue).toEqual([]);
    });

    it("should not override existing default values", () => {
      const schema: UISchema = {
        fields: {
          text: {
            type: "text",
            label: "Text",
            defaultValue: "custom",
          },
        },
      };

      const transformed = defaultValueTransformer(schema);
      expect(transformed.fields.text.defaultValue).toBe("custom");
    });
  });

  describe("labelTransformer", () => {
    it("should format field names into labels", () => {
      const schema: UISchema = {
        fields: {
          firstName: { type: "text", label: "" },
          last_name: { type: "text", label: "" },
          userAge: { type: "number", label: "" },
        },
      };

      const transformed = labelTransformer(schema);

      expect(transformed.fields.firstName.label).toBe("First Name");
      expect(transformed.fields.last_name.label).toBe("Last Name");
      expect(transformed.fields.userAge.label).toBe("User Age");
    });

    it("should not override existing labels", () => {
      const schema: UISchema = {
        fields: {
          firstName: {
            type: "text",
            label: "Custom Label",
          },
        },
      };

      const transformed = labelTransformer(schema);
      expect(transformed.fields.firstName.label).toBe("Custom Label");
    });
  });
});
