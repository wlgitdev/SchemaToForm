import { FormTheme } from "../..";

// Default theme with Tailwind classes

export const defaultFormTheme: FormTheme = {
  form: {
    container: "",
    fieldsContainer: "space-y-6",
    submitContainer: "mt-6 flex justify-end",
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
      item: "text-red-700 text-sm"
    }
  },
  field: {
    container: "w-full",
    label: "block text-sm font-medium text-gray-700 mb-1",
    required: "text-red-500 ml-1 font-medium",
    labelGroup: "flex items-center gap-1 mb-1",
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
    radio: {
      group: "space-y-2",
      container: "flex items-center gap-2",
      input: "h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500",
      label: "text-sm text-gray-900",
    },
  },
  section: {
    container: "border rounded-lg p-4 mb-4",
    header: "flex items-center justify-between mb-4",
    title: "text-lg font-medium text-gray-900",
    content: "space-y-4",
    collapsible: {
      container: "mb-6 border rounded-lg overflow-hidden bg-white",
      button:
        "w-full flex items-center justify-between text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-150 ease-in-out border-b",
      icon: "w-4 h-4 transform transition-transform",
      iconOpen: "rotate-180",
      content: "bg-white px-4 py-4 border-gray-100",
    },
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
