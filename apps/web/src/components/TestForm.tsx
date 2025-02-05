import { DynamicForm } from "@schematoform/schema-to-form/components/DynamicForm";
import { UISchema } from "@schematoform/schema-to-form/types";
import { FormData } from "@schematoform/schema-to-form/FormStore";
import { FormTheme } from "@schematoform/schema-to-form/types";

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
    multiselect:
      "w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    error: "mt-1 text-sm text-red-600",
  },
  grid: {
    container: "grid gap-4 md:grid-cols-2",
    item: "w-full",
  },
};

const testSchema: UISchema = {
  fields: {
    recordId: { type: "text", label: "Record Id", readOnly: true },
    createdAt: {
      type: "date",
      label: "Created At",
      readOnly: true,
      validation: { required: false },
    },
    updatedAt: {
      type: "date",
      label: "Updated At",
      readOnly: true,
      validation: { required: false },
    },
    name: {
      type: "text",
      label: "Name",
      validation: { required: true },
    },
    direction: {
      type: "select",
      label: "Direction",
      validation: { required: true },
      options: [
        { value: "incoming", label: "Incoming" },
        { value: "outgoing", label: "Outgoing" },
      ],
    },
    amount: {
      type: "number",
      label: "Amount",
      validation: { required: true },
    },
    category: {
      type: "select",
      label: "Category",
      validation: { required: true },
      reference: {
        modelName: "TransactionCategory",
        displayField: "name",
        multiple: false,
      },
    },
    notes: { type: "text", label: "Notes" },
    recurInterval: {
      type: "select",
      label: "Recur Interval",
      validation: { required: true },
      options: [
        { value: "Nonrecurring", label: "Nonrecurring" },
        { value: "Daily", label: "Daily" },
        { value: "Weekly", label: "Weekly" },
        { value: "Monthly", label: "Monthly" },
        { value: "Monthly On", label: "Monthly  On" },
        { value: "Yearly", label: "Yearly" },
      ],
    },
    recurFrequency: {
      type: "number",
      label: "Recur Frequency",
      validation: { required: true },
      dependencies: [
        {
          field: "recurInterval",
          operator: "equals",
          value: "Nonrecurring",
          effect: { hide: true, setValue: 0 },
        },
        {
          field: "recurInterval",
          operator: "notEquals",
          value: "Nonrecurring",
          effect: { hide: false, setValue: 1 },
        },
      ],
    },
    recurOn: {
      type: "multiselect",
      label: "Recur On",
      validation: { required: true },
      dependencies: [
        {
          field: "recurInterval",
          operator: "equals",
          value: "Nonrecurring",
          effect: { hide: true, setValue: 0 },
        },
        {
          field: "recurInterval",
          operator: "equals",
          value: "Weekly",
          effect: {
            hide: false,
            setOptionGroups: [
              {
                label: "Days of Week",
                options: [
                  { value: 16, label: "Monday" },
                  { value: 32, label: "Tuesday" },
                  { value: 64, label: "Wednesday" },
                  { value: 128, label: "Thursday" },
                  { value: 256, label: "Friday" },
                  { value: 512, label: "Saturday" },
                  { value: 1024, label: "Sunday" },
                ],
              },
            ],
          },
        },
        {
          field: "recurInterval",
          operator: "equals",
          value: "Monthly",
          effect: {
            hide: false,
            setOptionGroups: [
              {
                label: "Days of Month",
                options: [
                  { value: 2048, label: "1st" },
                  { value: 4096, label: "2nd" },
                  { value: 8192, label: "3rd" },
                  { value: 16384, label: "4th" },
                  { value: 32768, label: "5th" },
                  { value: 65536, label: "6th" },
                  { value: 131072, label: "7th" },
                  { value: 262144, label: "8th" },
                  { value: 524288, label: "9th" },
                  { value: 1048576, label: "10th" },
                  { value: 2097152, label: "11th" },
                  { value: 4194304, label: "12th" },
                  { value: 8388608, label: "13th" },
                  { value: 16777216, label: "14th" },
                  { value: 33554432, label: "15th" },
                  { value: 67108864, label: "16th" },
                  { value: 134217728, label: "17th" },
                  { value: 268435456, label: "18th" },
                  { value: 536870912, label: "19th" },
                  { value: 1073741824, label: "20th" },
                  { value: 2147483648, label: "21st" },
                  { value: 4294967296, label: "22nd" },
                  { value: 8589934592, label: "23rd" },
                  { value: 17179869184, label: "24th" },
                  { value: 34359738368, label: "25th" },
                  { value: 68719476736, label: "26th" },
                  { value: 137438953472, label: "27th" },
                  { value: 274877906944, label: "28th" },
                  { value: 549755813888, label: "29th" },
                  { value: 1099511627776, label: "30th" },
                  { value: 2199023255552, label: "31st" },
                  { value: 4398046511104, label: "Last Day of Month" },
                ],
              },
            ],
          },
        },
        {
          field: "recurInterval",
          operator: "equals",
          value: "Monthly On",
          effect: {
            hide: false,
            setOptionGroups: [
              {
                label: "Week Occurrence",
                options: [
                  { value: 1, label: "First" },
                  { value: 2, label: "Second" },
                  { value: 4, label: "Third" },
                  { value: 8, label: "Fourth" },
                ],
              },
              {
                label: "Days of Week",
                options: [
                  { value: 16, label: "Monday" },
                  { value: 32, label: "Tuesday" },
                  { value: 64, label: "Wednesday" },
                  { value: 128, label: "Thursday" },
                  { value: 256, label: "Friday" },
                  { value: 512, label: "Saturday" },
                  { value: 1024, label: "Sunday" },
                ],
              },
            ],
          },
        },
      ],
      bitFlags: {
        flagValue: 0,
        groups: {
          daysOfWeek: {
            label: "Days of Week",
            options: [
              { value: 16, label: "Monday" },
              { value: 32, label: "Tuesday" },
              { value: 64, label: "Wednesday" },
              { value: 128, label: "Thursday" },
              { value: 256, label: "Friday" },
              { value: 512, label: "Saturday" },
              { value: 1024, label: "Sunday" },
            ],
          },
          daysOfMonth: {
            label: "Days of Month",
            options: [
              { value: 2048, label: "1st" },
              { value: 4096, label: "2nd" },
              { value: 8192, label: "3rd" },
              { value: 16384, label: "4th" },
              { value: 32768, label: "5th" },
              { value: 65536, label: "6th" },
              { value: 131072, label: "7th" },
              { value: 262144, label: "8th" },
              { value: 524288, label: "9th" },
              { value: 1048576, label: "10th" },
              { value: 2097152, label: "11th" },
              { value: 4194304, label: "12th" },
              { value: 8388608, label: "13th" },
              { value: 16777216, label: "14th" },
              { value: 33554432, label: "15th" },
              { value: 67108864, label: "16th" },
              { value: 134217728, label: "17th" },
              { value: 268435456, label: "18th" },
              { value: 536870912, label: "19th" },
              { value: 1073741824, label: "20th" },
              { value: 2147483648, label: "21st" },
              { value: 4294967296, label: "22nd" },
              { value: 8589934592, label: "23rd" },
              { value: 17179869184, label: "24th" },
              { value: 34359738368, label: "25th" },
              { value: 68719476736, label: "26th" },
              { value: 137438953472, label: "27th" },
              { value: 274877906944, label: "28th" },
              { value: 549755813888, label: "29th" },
              { value: 1099511627776, label: "30th" },
              { value: 2199023255552, label: "31st" },
              { value: 4398046511104, label: "Last Day of Month" },
            ],
          },
          months: {
            label: "Months",
            options: [
              { value: 8796093022208, label: "January" },
              { value: 17592186044416, label: "February" },
              { value: 35184372088832, label: "March" },
              { value: 70368744177664, label: "April" },
              { value: 140737488355328, label: "May" },
              { value: 281474976710656, label: "June" },
              { value: 562949953421312, label: "July" },
              { value: 1125899906842624, label: "August" },
              { value: 2251799813685248, label: "September" },
              { value: 4503599627370496, label: "October" },
              { value: 9007199254740992, label: "November" },
              { value: 18014398509481984, label: "December" },
            ],
          },
          weekOccurrence: {
            label: "Week Occurrence",
            options: [
              { value: 1, label: "First" },
              { value: 2, label: "Second" },
              { value: 4, label: "Third" },
              { value: 8, label: "Fourth" },
            ],
          },
        },
      },
    },
    startDate: {
      type: "date",
      label: "Start Date",
      validation: { required: true },
    },
    endDate: {
      type: "date",
      label: "End Date",
      validation: { required: true },
    },
    nextOccurrence: {
      type: "text",
      label: "Next Occurrence",
      readOnly: true,
      description: "Calculated field: nextOccurrence",
    },
  },
  layout: {
    groups: [
      {
        name: "basic",
        label: "",
        fields: ["name", "direction", "amount", "notes", "nextOccurrence"],
      },
      {
        name: "scheduling",
        label: "Scheduling",
        fields: [
          "startDate",
          "endDate",
          "recurInterval",
          "recurFrequency",
          "recurOn",
        ],
        collapsible: true,
      },
      {
        name: "system",
        label: "System Fields",
        fields: ["recordId", "createdAt", "updatedAt"],
        collapsible: true,
      },
    ],
    order: [
      "name",
      "direction",
      "amount",
      "notes",
      "nextOccurrence",
      "startDate",
      "endDate",
      "recurInterval",
      "recurFrequency",
      "recurOn",
      "recordId",
      "createdAt",
      "updatedAt",
    ],
  },
};

interface TestFormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit }) => {

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
    />
  );
};

export default TestForm;
