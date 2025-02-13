import { testSchema } from "@/schemas";
import {
  DynamicForm,
  FormData,
  FormTheme,
} from "@schematoform/schema-to-form";

const customTheme: Partial<FormTheme> = {
  form: {
    container: "space-y-6",
    fieldsContainer: "space-y-4",
    submitContainer: "mt-6",
  },
  section: {
    container: "border border-gray-200 rounded-lg p-4 mb-4",
    header: "flex items-center justify-between mb-4",
    title: "text-lg font-semibold",
    content: "space-y-4",
    collapsible: {
      container: "border border-gray-200 rounded-lg mb-4 overflow-hidden",
      button:
        "w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors border-b border-gray-200",
      icon: "w-5 h-5 transform transition-transform",
      iconOpen: "rotate-180",
      content: "p-4",
    },
  },
  field: {
    container: "mb-4",
    label: "block text-sm font-medium text-gray-700 mb-1",
    input:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    select:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    checkbox: {
      container: "flex items-center gap-2",
      input:
        "rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500",
      label: "text-sm font-medium text-gray-700",
    },
    radio: {
      group: "space-y-2",
      container: "flex items-center gap-2",
      input: "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
      label: "text-sm text-gray-900",
    },
    multiselect:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    error: "mt-1 text-sm text-red-600",
    required: "text-red-600 ml-1 font-medium",
    labelGroup: "flex items-center gap-1",
  },
  grid: {
    container: "grid gap-4 md:grid-cols-2",
    item: "w-full",
  },
  banner: {
    container: "mb-4 p-4 border rounded-md",
    title: "font-medium mb-2",
    list: "list-disc list-inside space-y-1",
    item: "text-sm",
    error: {
      container: "border-red-300 bg-red-50",
      title: "text-red-800",
      list: "list-disc list-inside space-y-1",
      item: "text-red-700 text-sm",
    },
  },
};

interface TestFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialValues?: FormData;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit, initialValues }) => {
  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("TestForm - Error in onSubmit:", error);
    }
  };
  
  return (
    <DynamicForm
      schema={testSchema}
      onSubmit={handleSubmit}
      submitLabel="Submit Form"
      theme={customTheme}
      initialValues={initialValues}
    />
  );
};

export default TestForm;
