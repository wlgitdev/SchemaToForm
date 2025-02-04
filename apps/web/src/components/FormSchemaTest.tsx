import { useState } from "react";
import { DynamicForm } from "@schematoform/schema-to-form/components/DynamicForm";
import { UISchema } from "@schematoform/schema-to-form/types";
import { FormData } from "@schematoform/schema-to-form/FormStore";
import { FormTheme } from "@schematoform/schema-to-form/types";

const customTheme: Partial<FormTheme> = {
  form: {
    container: "space-y-8",
    fieldsContainer: "space-y-6",
    submitContainer: "mt-8",
  },
  section: {
    container: "border rounded-lg p-6 mb-6",
    header: "flex items-center justify-between mb-6",
    title: "text-xl font-medium",
    content: "space-y-6",
    collapsible: {
      container: "border rounded-lg mb-6 overflow-hidden",
      button:
        "w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors duration-150 ease-in-out border-b",
      icon: "w-5 h-10 transform transition-transform",
      iconOpen: "rotate-180",
      content: "p-6",
    },
  },
  field: {
    container: "mb-6",
    label: "block mb-3 font-medium",
    input: "block w-full border rounded p-2 mt-2",
    select: "block w-full border rounded p-2 mt-2",
    checkbox: {
      container: "flex items-center gap-3 mt-2",
      input: "h-5 w-5",
      label: "font-medium",
    },
    multiselect: "block w-full border rounded p-2 mt-2",
    error: "text-red-500 text-sm mt-2",
  },
  grid: {
    container: "grid gap-6 md:grid-cols-2",
    item: "w-full",
  },
};

const testSchema: UISchema = {
  fields: {
    firstName: {
      type: "text",
      label: "First Name",
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    },
    lastName: {
      type: "text",
      label: "Last Name",
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
    },
    age: {
      type: "number",
      label: "Age",
      validation: {
        min: 0,
        max: 150,
      },
    },
    employmentStatus: {
      type: "select",
      label: "Employment Status",
      options: [
        { value: "employed", label: "Employed" },
        { value: "unemployed", label: "Unemployed" },
        { value: "student", label: "Student" },
      ],
    },
    employerName: {
      type: "text",
      label: "Employer Name",
      dependencies: [
        {
          field: "employmentStatus",
          operator: "equals",
          value: "employed",
          effect: {
            hide: false,
            setRequired: true,
          },
          or: [
            {
              field: "employmentStatus",
              operator: "equals",
              value: "student",
              effect: {
                hide: true,
                setRequired: false,
              },
            },
          ],
        },
      ],
    },
    skills: {
      type: "multiselect",
      label: "Skills",
      placeholder: "Select your skills",
      description: "Choose all that apply",
      options: [
        { value: "react", label: "React" },
        { value: "vue", label: "Vue" },
        { value: "angular", label: "Angular" },
        { value: "node", label: "Node.js" },
        { value: "python", label: "Python" },
        { value: "java", label: "Java" },
      ],
    },
    subscribedToNewsletter: {
      type: "checkbox",
      label: "Newsletter",
      description: "Subscribe to our newsletter",
    },
    startDate: {
      type: "date",
      label: "Start Date",
      dependencies: [
        {
          field: "employmentStatus",
          operator: "equals",
          value: "employed",
          effect: {
            setRequired: true,
          },
        },
      ],
    },
  },
  layout: {
    groups: [
      {
        name: "personal",
        label: "Personal Information",
        fields: ["firstName", "lastName", "age"],
        collapsible: true,
      },
      {
        name: "employment",
        label: "Employment Details",
        fields: ["employmentStatus", "employerName", "startDate"],
        collapsible: true,
      },
      {
        name: "additional",
        label: "Additional Information",
        fields: ["skills", "subscribedToNewsletter"],
        collapsible: true,
      },
    ],
  },
};

const FormSchemaTest = () => {
  const [formData, setFormData] = useState<FormData | null>(null);

  const handleSubmit = async (values: FormData) => {
    setFormData(values);
    console.log("Form submitted:", values);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Form Schema Test
      </h1>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <DynamicForm
            schema={testSchema}
            onSubmit={handleSubmit}
            submitLabel="Submit Form"
            theme={customTheme}
          />

          {formData && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Submitted Data
              </h2>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormSchemaTest;
