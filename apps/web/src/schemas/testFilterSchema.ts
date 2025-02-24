import { UISchema } from "@schematoform/schema-to-form";

export const testFilterSchema: UISchema = {
  fields: {
    recordId: { type: "text", label: "Record Id" },
    createdAt: { type: "date", label: "Created At", valueMapper: {} },
    updatedAt: { type: "date", label: "Updated At", valueMapper: {} },
    name: { type: "text", label: "Name" },
    direction: {
      type: "select",
      label: "Direction",
      options: [
        { value: "incoming", label: "Incoming" },
        { value: "outgoing", label: "Outgoing" },
      ],
    },
    amount: { type: "number", label: "Amount" },
    bankAccount: {
      type: "select",
      label: "Bank Account",
      reference: {
        modelName: "BankAccount",
        displayField: "name",
        multiple: false,
      },
    },
    notes: { type: "text", label: "Notes" },
    recurInterval: {
      type: "select",
      label: "Recur Interval",
      options: [
        { value: "Nonrecurring", label: "Nonrecurring" },
        { value: "Daily", label: "Daily" },
        { value: "Weekly", label: "Weekly" },
        { value: "Monthly", label: "Monthly" },
        { value: "Monthly On", label: "Monthly  On" },
        { value: "Yearly", label: "Yearly" },
      ],
    },
    recurFrequency: { type: "number", label: "Recur Frequency" },
    recurOn: { type: "number", label: "Recur On" },
    startDate: { type: "date", label: "Start Date", valueMapper: {} },
    endDate: { type: "date", label: "End Date", valueMapper: {} },
    categories: {
      type: "multiselect",
      label: "Categories",
      reference: {
        modelName: "TransactionCategory",
        displayField: "name",
        multiple: true,
      },
    },
    nextOccurrence: {
      type: "text",
      label: "Next Occurrence",
      description: "Calculated field: nextOccurrence",
    },
  },
  layout: {
    groups: [
      {
        name: "basic",
        label: "",
        fields: [
          "name",
          "bankAccount",
          "direction",
          "amount",
          "notes",
          "categories",
        ],
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
      "bankAccount",
      "direction",
      "amount",
      "notes",
      "categories",
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
