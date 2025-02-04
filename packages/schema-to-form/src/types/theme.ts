export interface FormTheme {
  form: {
    container: string;
    fieldsContainer: string;
    submitContainer: string;
  };
  field: {
    container: string;
    label: string;
    input: string;
    select: string;
    checkbox: {
      container: string;
      input: string;
      label: string;
    };
    multiselect: string;
    error: string;
  };
  section: {
    container: string;
    header: string;
    title: string;
    content: string;
  };
  button: {
    base: string;
    primary: string;
    disabled: string;
  };
  grid: {
    container: string;
    item: string;
  };
}

// Default theme with Tailwind classes
export const defaultTheme: FormTheme = {
  form: {
    container: "",
    fieldsContainer: "space-y-6",
    submitContainer: "mt-6 flex justify-end",
  },
  field: {
    container: "w-full",
    label: "block text-sm font-medium text-gray-700 mb-1",
    input:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    select:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    checkbox: {
      container: "flex items-center",
      input:
        "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
      label: "ml-2 block text-sm text-gray-900",
    },
    multiselect:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500",
    error: "text-red-600 text-sm mt-1",
  },
  section: {
    container: "border rounded-lg p-4 mb-4",
    header: "flex items-center justify-between mb-4",
    title: "text-lg font-medium text-gray-900",
    content: "space-y-4",
  },
  button: {
    base: "px-4 py-2 rounded-md text-white font-medium transition-colors duration-200",
    primary: "bg-blue-600 hover:bg-blue-700",
    disabled: "bg-gray-300 cursor-not-allowed",
  },
  grid: {
    container: "grid gap-4 md:grid-cols-2",
    item: "w-full",
  },
};
