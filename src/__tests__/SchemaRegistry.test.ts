import { SchemaRegistry } from "../SchemaRegistry";
import {
  basicSchemaValidator,
  defaultValueTransformer,
  labelTransformer,
} from "../schemaValidators";
import { UISchema } from "../types";

describe("SchemaRegistry", () => {
  let registry: SchemaRegistry;

  const validSchema: UISchema = {
    fields: {
      firstName: {
        type: "text",
        label: "First Name",
        validation: {
          required: true,
          minLength: 2,
        },
      },
      age: {
        type: "number",
        label: "Age",
        validation: {
          min: 0,
          max: 120,
        },
      },
    },
    layout: {
      groups: [
        {
          name: "personal",
          label: "Personal Information",
          fields: ["firstName", "age"],
        },
      ],
    },
  };

  beforeEach(() => {
    registry = SchemaRegistry.getInstance({
      validators: [basicSchemaValidator],
      transformers: [defaultValueTransformer, labelTransformer],
      enableCaching: true,
    });
    registry.clearCache();
  });

  describe("Initialization", () => {
    it("should create a singleton instance", () => {
      const instance1 = SchemaRegistry.getInstance();
      const instance2 = SchemaRegistry.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should initialize with provided options", () => {
      const registry = SchemaRegistry.getInstance({
        validators: [basicSchemaValidator],
        transformers: [defaultValueTransformer],
        enableCaching: false,
      });
      expect(registry).toBeDefined();
    });
  });

  describe("Schema Registration", () => {
    it("should register a valid schema", () => {
      expect(() => {
        registry.registerSchema("testForm", validSchema);
      }).not.toThrow();
      expect(registry.hasSchema("testForm")).toBe(true);
    });

    it("should throw error for invalid schema", () => {
      const invalidSchema: UISchema = {
        fields: {
          invalid: {
            type: "invalid" as any,
            label: "Invalid",
          },
        },
      };

      expect(() => {
        registry.registerSchema("invalidForm", invalidSchema);
      }).toThrow();
    });

    it("should apply transformers during registration", () => {
      registry.registerSchema("testForm", validSchema);
      const transformed = registry.getSchema("testForm");

      expect(transformed?.fields.firstName.defaultValue).toBe("");
      expect(transformed?.fields.age.defaultValue).toBe(0);
    });
  });

  describe("Schema Retrieval", () => {
    beforeEach(() => {
      registry.registerSchema("testForm", validSchema);
    });

    it("should retrieve registered schema", () => {
      const schema = registry.getSchema("testForm");
      expect(schema).toBeDefined();
      expect(schema?.fields.firstName).toBeDefined();
    });

    it("should return null for non-existent schema", () => {
      const schema = registry.getSchema("nonexistent");
      expect(schema).toBeNull();
    });

    it("should handle caching correctly", () => {
      // Get schema with caching enabled
      const cachedSchema = registry.getSchema("testForm");

      // Create new instance with caching disabled
      const noCacheRegistry = SchemaRegistry.getInstance({
        enableCaching: false,
      });

      const uncachedSchema = noCacheRegistry.getSchema("testForm");

      expect(cachedSchema).toEqual(uncachedSchema);
    });
  });

  describe("Schema Updates", () => {
    beforeEach(() => {
      registry.registerSchema("testForm", validSchema);
    });

    it("should update existing schema", () => {
      const updatedSchema: UISchema = {
        ...validSchema,
        fields: {
          ...validSchema.fields,
          lastName: {
            type: "text",
            label: "Last Name",
            validation: {
              required: true,
            },
          },
        },
      };

      registry.updateSchema("testForm", updatedSchema);
      const schema = registry.getSchema("testForm");
      expect(schema?.fields.lastName).toBeDefined();
    });

    it("should increment version on update", () => {
      const initialMeta = registry.getSchemaMetadata("testForm");
      registry.updateSchema("testForm", validSchema);
      const updatedMeta = registry.getSchemaMetadata("testForm");

      expect(updatedMeta?.version).toBe((initialMeta?.version || 0) + 1);
    });

    it("should throw error when updating non-existent schema", () => {
      expect(() => {
        registry.updateSchema("nonexistent", validSchema);
      }).toThrow();
    });
  });

  describe("Schema Removal", () => {
    beforeEach(() => {
      registry.registerSchema("testForm", validSchema);
    });

    it("should remove existing schema", () => {
      expect(registry.removeSchema("testForm")).toBe(true);
      expect(registry.hasSchema("testForm")).toBe(false);
    });

    it("should return false when removing non-existent schema", () => {
      expect(registry.removeSchema("nonexistent")).toBe(false);
    });
  });

  describe("Validator Management", () => {
    it("should add new validator", () => {
      const customValidator = (schema: UISchema) => true;
      registry.addValidator(customValidator);

      // Should still validate with new validator
      expect(() => {
        registry.registerSchema("testForm", validSchema);
      }).not.toThrow();
    });
  });

  describe("Transformer Management", () => {
    it("should add new transformer", () => {
      const customTransformer = (schema: UISchema): UISchema => ({
        ...schema,
        fields: {
          ...schema.fields,
          timestamp: {
            type: "text" as const, // explicitly type as UIFieldType
            label: "Timestamp",
            defaultValue: new Date().toISOString(),
          },
        },
      });

      registry.addTransformer(customTransformer);
      registry.registerSchema("testForm", validSchema);

      const transformed = registry.getSchema("testForm");
      expect(transformed?.fields.timestamp).toBeDefined();
    });
  });
});
