import { SchemaRegistry, basicSchemaValidator, defaultValueTransformer, labelTransformer, UISchema } from "../";

export const userFormSchema: UISchema = {
  fields: {
    firstName: {
      label: "firstName",
      type: "text",
      validation: {
        required: true,
        minLength: 2,
      },
    },
    lastName: {
      label: "lastName",
      type: "text",
      validation: {
        required: true,
        minLength: 2,
      },
    },
    age: {
      label: "age",
      type: "number",
      validation: {
        min: 0,
        max: 120,
      },
    },
    userType: {
      label: "userType",
      type: "select",
      options: [
        { value: "admin", label: "Administrator" },
        { value: "user", label: "Regular User" },
      ],
    },
    skills: {
      label: "skills",
      type: "multiselect",
      options: [
        { value: "js", label: "JavaScript" },
        { value: "ts", label: "TypeScript" },
        { value: "py", label: "Python" },
      ],
    },
  },
  layout: {
    groups: [
      {
        name: "personalInfo",
        label: "Personal Information",
        fields: ["firstName", "lastName", "age"],
      },
      {
        name: "accountInfo",
        label: "Account Information",
        fields: ["userType", "skills"],
      },
    ],
  },
};

async function main() {
  try {
    // Initialize registry with validators and transformers
    const registry = SchemaRegistry.getInstance({
      validators: [basicSchemaValidator],
      transformers: [defaultValueTransformer, labelTransformer],
      enableCaching: true,
    });

    // Register the schema
    console.log("Registering schema...");
    registry.registerSchema("userForm", userFormSchema);

    // Retrieve and display the transformed schema
    console.log("\nRetrieving schema...");
    const transformedSchema = registry.getSchema("userForm");
    console.log("\nTransformed Schema:");
    console.log(JSON.stringify(transformedSchema, null, 2));

    // Display metadata
    console.log("\nSchema Metadata:");
    console.log(registry.getSchemaMetadata("userForm"));

    // Try to register an invalid schema
    console.log("\nTrying to register invalid schema...");
    const invalidSchema: UISchema = {
      fields: {
        invalid: {
          label: "invalid" as any,
          type: "invalid" as any,
        },
      },
    };

    try {
      registry.registerSchema("invalidForm", invalidSchema);
    } catch (error) {
      console.log("Error registering invalid schema:", error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
main();
