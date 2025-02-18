import { testSchema } from "@/schemas";
import {
  DynamicForm,
  FormData,
} from "@schematoform/schema-to-form";
import { customTheme } from "./customTheme";

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
