import mongoose, { Schema } from "mongoose";
import { MongooseSchemaAdapter } from "../MongooseSchemaAdapter";

describe("MongooseSchemaAdapter", () => {
  let adapter: MongooseSchemaAdapter;

  beforeEach(() => {
    adapter = new MongooseSchemaAdapter();
  });

  describe("Basic Schema Conversion", () => {
    it("should convert basic mongoose schema to UISchema", () => {
      const mongooseSchema = new Schema({
        name: { type: String, required: true },
        age: { type: Number, min: 0, max: 120 },
        isActive: Boolean,
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);

      expect(uiSchema.fields.name).toBeDefined();
      expect(uiSchema.fields.name.type).toBe("text");
      expect(uiSchema.fields.name.validation?.required).toBe(true);

      expect(uiSchema.fields.age).toBeDefined();
      expect(uiSchema.fields.age.type).toBe("number");
      expect(uiSchema.fields.age.validation?.min).toBe(0);
      expect(uiSchema.fields.age.validation?.max).toBe(120);

      expect(uiSchema.fields.isActive).toBeDefined();
      expect(uiSchema.fields.isActive.type).toBe("checkbox");
    });

    it("should exclude specified fields", () => {
      const mongooseSchema = new Schema({
        name: String,
        secretField: String,
        _id: String,
        __v: Number,
      });

      const uiSchema = adapter.toUISchema(mongooseSchema, {
        excludeFields: ["secretField", "_id", "__v"],
      });

      expect(uiSchema.fields.name).toBeDefined();
      expect(uiSchema.fields.secretField).toBeUndefined();
      expect(uiSchema.fields._id).toBeUndefined();
      expect(uiSchema.fields.__v).toBeUndefined();
    });

    it("should handle read-only fields", () => {
      const mongooseSchema = new Schema({
        id: String,
        name: String,
        createdAt: Date,
      });

      const uiSchema = adapter.toUISchema(mongooseSchema, {
        readOnlyFields: ["id", "createdAt"],
      });

      expect(uiSchema.fields.id.readOnly).toBe(true);
      expect(uiSchema.fields.name.readOnly).toBeUndefined();
      expect(uiSchema.fields.createdAt.readOnly).toBe(true);
    });
  });

  describe("Field Type Handling", () => {
    it("should handle array types correctly", () => {
      const mongooseSchema = new Schema({
        tags: [String],
        scores: [Number],
        roles: {
          type: [String],
          enum: ["admin", "user", "guest"],
        },
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);

      expect(uiSchema.fields.tags.type).toBe("list");
      expect(uiSchema.fields.scores.type).toBe("list");
      expect(uiSchema.fields.roles.type).toBe("multiselect");
      expect(uiSchema.fields.roles.options).toBeDefined();
      expect(uiSchema.fields.roles.options?.length).toBe(3);
    });

    it("should handle enum fields correctly", () => {
      const mongooseSchema = new Schema({
        status: {
          type: String,
          enum: ["active", "inactive", "pending"],
        },
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);

      expect(uiSchema.fields.status.type).toBe("select");
      expect(uiSchema.fields.status.options).toBeDefined();
      expect(uiSchema.fields.status.options?.length).toBe(3);
      expect(uiSchema.fields.status.options?.[0].label).toBe("Active");
    });

    it("should handle nested schema fields", () => {
      const addressSchema = new Schema({
        street: String,
        city: String,
        country: String,
      });

      const mongooseSchema = new Schema({
        name: String,
        address: addressSchema,
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);

      expect(uiSchema.fields["address.street"]).toBeDefined();
      expect(uiSchema.fields["address.city"]).toBeDefined();
      expect(uiSchema.fields["address.country"]).toBeDefined();
    });
  });

  describe("Validation Processing", () => {
    it("should process string validations", () => {
      const mongooseSchema = new Schema({
        username: {
          type: String,
          required: true,
          minlength: 3,
          maxlength: 20,
          match: /^[a-zA-Z0-9]+$/,
        },
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);
      const field = uiSchema.fields.username;

      expect(field.validation?.required).toBe(true);
      expect(field.validation?.minLength).toBe(3);
      expect(field.validation?.maxLength).toBe(20);
      expect(field.validation?.pattern).toBeDefined();
    });

    it("should process number validations", () => {
      const mongooseSchema = new Schema({
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);
      const field = uiSchema.fields.score;

      expect(field.validation?.required).toBe(true);
      expect(field.validation?.min).toBe(0);
      expect(field.validation?.max).toBe(100);
    });
  });

  describe("Reference Handling", () => {
    it("should process single references correctly", () => {
      const mongooseSchema = new Schema({
        department: {
          type: Schema.Types.ObjectId,
          ref: "Department",
        },
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);
      const field = uiSchema.fields.department;

      expect(field.type).toBe("select");
      expect(field.reference).toBeDefined();
      expect(field.reference?.modelName).toBe("Department");
      expect(field.reference?.multiple).toBe(false);
    });

    it("should process array references correctly", () => {
      const mongooseSchema = new Schema({
        teams: [
          {
            type: Schema.Types.ObjectId,
            ref: "Team",
          },
        ],
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);
      const field = uiSchema.fields.teams;

      expect(field.type).toBe("multiselect");
      expect(field.reference).toBeDefined();
      expect(field.reference?.modelName).toBe("Team");
      expect(field.reference?.multiple).toBe(true);
    });
  });

  describe("Virtual Fields", () => {
    it("should handle virtual fields correctly", () => {
      const mongooseSchema = new Schema({
        firstName: String,
        lastName: String,
      });

      mongooseSchema.virtual("fullName").get(function () {
        return `${this.firstName} ${this.lastName}`;
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);
      const field = uiSchema.fields.fullName;

      expect(field).toBeDefined();
      expect(field.type).toBe("text");
      expect(field.readOnly).toBe(true);
    });

    it("should infer virtual field types correctly", () => {
      const mongooseSchema = new Schema({
        price: Number,
        quantity: Number,
      });

      mongooseSchema.virtual("total").get(function () {
        return (this.price || 0) * (this.quantity || 0);
      });

      mongooseSchema.virtual("isExpensive").get(function () {
        return (this.price || 0) > 100;
      });

      const uiSchema = adapter.toUISchema(mongooseSchema);

      expect(uiSchema.fields.total.type).toBe("number");
      expect(uiSchema.fields.isExpensive.type).toBe("checkbox");
    });
  });

  describe("Layout Handling", () => {
    it("should handle layout groups correctly", () => {
      const mongooseSchema = new Schema({
        name: String,
        email: String,
        age: Number,
        address: String,
      });

      const groups = [
        {
          name: "personal",
          label: "Personal Information",
          fields: ["name", "age"],
        },
        {
          name: "contact",
          label: "Contact Information",
          fields: ["email", "address"],
        },
      ];

      const uiSchema = adapter.toUISchema(mongooseSchema, { groups });

      expect(uiSchema.layout?.groups).toBeDefined();
      expect(uiSchema.layout?.groups?.length).toBe(2);
      expect(uiSchema.layout?.groups?.[0].fields).toEqual(["name", "age"]);
      expect(uiSchema.layout?.order).toBeDefined();
      expect(uiSchema.layout?.order?.length).toBe(4);
    });

    it("should filter out non-existent fields from groups", () => {
      const mongooseSchema = new Schema({
        name: String,
        email: String,
      });

      const groups = [
        {
          name: "personal",
          label: "Personal Information",
          fields: ["name", "nonexistent"],
        },
      ];

      const uiSchema = adapter.toUISchema(mongooseSchema, { groups });

      expect(uiSchema.layout?.groups?.[0].fields).toEqual(["name"]);
    });
  });
});
