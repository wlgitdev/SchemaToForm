import React from "react";
import { DynamicForm, FormData } from "@schematoform/schema-to-ui";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { customTheme } from "./customTheme";
import { DepartmentsApi, SkillsApi } from "../api";
import { Department, Skill } from "../types";
import { userFormSchema } from "../schemas";

const departmentsApi = new DepartmentsApi();
const skillsApi = new SkillsApi();
const queryClient = new QueryClient();

const fetchDepartments = async (): Promise<Department[]> => {
  return departmentsApi.getAll();
};

const fetchSkills = async (): Promise<Skill[]> => {
  return skillsApi.getAll();
};

interface TestFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialValues?: FormData;
}

const TestFormContent: React.FC<TestFormProps> = ({
  onSubmit,
  initialValues,
}) => {
  // Pre-load reference data for form fields
  useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  useQuery({
    queryKey: ["skills"],
    queryFn: fetchSkills,
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("TestForm - Error in onSubmit:", error);
    }
  };

  return (
    <DynamicForm
      schema={userFormSchema}
      onSubmit={handleSubmit}
      submitLabel="Submit Form"
      theme={customTheme}
      initialValues={initialValues}
      queryClient={queryClient}
    />
  );
};

const TestForm: React.FC<TestFormProps> = ({ onSubmit, initialValues }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TestFormContent onSubmit={onSubmit} initialValues={initialValues} />
    </QueryClientProvider>
  );
};

export default TestForm;
