import { ListSchema, UISchema } from "@schematoform/schema-to-ui";
import { UserList } from "../types";

export const userSchema: ListSchema<UserList> = {
  columns: {
    name: {
      label: "Name",
      field: "name",
      type: "text",
      sortable: true,
      filterable: true,
      format: {
        text: {
          truncate: 20,
          transform: "capitalize",
        },
      },
    },
    age: {
      label: "Age",
      field: "age",
      type: "number",
      sortable: true,
      filterable: true,
      format: {
        number: {
          precision: 0,
        },
      },
    },
    isActive: {
      label: "Status",
      field: "isActive",
      type: "boolean",
      sortable: true,
      filterable: true,
      format: {
        boolean: {
          trueText: "✅",
          falseText: "❌",
        },
      },
      className: (row) => (row.isActive ? "text-green-600" : "text-red-600"),
    },
    createdAt: {
      label: "Created",
      field: "createdAt",
      type: "date",
      sortable: true,
      filterable: true,
      format: {
        date: {
          relative: true,
        },
      },
    },
    tags: {
      label: "Tags",
      field: "tags",
      type: "array",
      sortable: true,
      filterable: true,
      format: {
        array: {
          maxItems: 2,
          separator: ", ",
          more: "more...",
          filter: {
            isMulti: true,
            placeholder: "Filter by tags...",
            isSearchable: true,
            isClearable: true,
          },
        },
      },
    },
    department: {
      label: "Department",
      field: "department",
      type: "reference",
      sortable: true,
      filterable: true,
      reference: {
        queryKey: ["departments"],
        collection: "departments",
        valueField: "id",
        labelField: "name",
        fallback: "No Department",
        isArray: false,
      },
      format: {
        reference: {
          labelField: "name",
          fallback: "Unknown",
          filter: {
            isMulti: false,
            placeholder: "Filter by department...",
            isSearchable: true,
            isClearable: true,
          },
        },
      },
    },
    skills: {
      label: "Skills",
      field: "skills",
      type: "reference",
      sortable: true,
      filterable: true,
      reference: {
        queryKey: ["skills"],
        collection: "skills",
        valueField: "id",
        labelField: "name",
        fallback: "No Skills",
        isArray: true,
      },
      format: {
        reference: {
          labelField: "name",
          fallback: "No Skills",
          filter: {
            isMulti: true,
            placeholder: "Filter by skills...",
            isSearchable: true,
            isClearable: true,
          },
        },
      },
    },
    actions: {
      label: "Actions",
      field: "actions",
      type: "action",
      format: {
        action: {
          label: "View",
          variant: "primary",
        },
      },
      sortable: false,
    },
  },
  options: {
    pagination: {
      enabled: true,
      pageSize: 5,
      pageSizeOptions: [5, 10, 20],
    },

    // Selection configuration
    selection: {
      enabled: true,
      type: "multi",
      onSelect: (selectedRows) => console.log("Selected:", selectedRows),
    },

    // Grouping configuration
    groupBy: {
      field: "department",
      expanded: true,
      showCounts: true,
    },

    // Default sorting
    defaultSort: {
      field: "name",
      direction: "asc",
    },

    // Row actions
    // Add row-level actions
    rowActions: {
      onClick: (row) => console.log("Row clicked:", row),
      onDoubleClick: (row) => console.log("Row double clicked:", row),
    },

    // Selected actions
    selectedActions: [
      {
        label: "Delete Selected",
        onClick: (selectedRows) => {
          console.log("Delete:", selectedRows);
          alert(`Would delete ${selectedRows.length} items`);
        },
        // Disable if more than 3 items selected
        disabled: (selectedRows) => selectedRows.length > 3,
      },
      {
        label: "Export Selected",
        onClick: (selectedRows) => {
          console.log("Export:", selectedRows);
          alert(`Would export ${selectedRows.length} items`);
        },
      },
      {
        label: "Activate Selected",
        onClick: (selectedRows) => {
          console.log("Activate:", selectedRows);
          alert(`Would activate ${selectedRows.length} items`);
        },
        // Only enable if all selected items are inactive
        disabled: (selectedRows) => !selectedRows.every((row) => !row.isActive),
      },
    ],
  },
};

export const userFormSchema: UISchema = {
  fields: {
    name: {
      type: "text",
      label: "Full Name",
      placeholder: "Enter full name",
      validation: {
        required: true,
        message: "Name is required",
      },
    },
    age: {
      type: "number",
      label: "Age",
      placeholder: "Enter age",
      validation: {
        required: true,
        message: "Age is required",
      },
    },
    isActive: {
      type: "checkbox",
      label: "Active Status",
      defaultValue: true,
    },
    department: {
      type: "select",
      label: "Department",
      placeholder: "Select department",
      reference: {
        modelName: "departments",
        displayField: "name",
        multiple: false,
      },
      validation: {
        required: true,
        message: "Department is required",
      },
    },
    skills: {
      type: "multiselect",
      label: "Skills",
      placeholder: "Select skills",
      reference: {
        modelName: "skills",
        displayField: "name",
        multiple: true,
      },
    },
    tags: {
      type: "multiselect",
      label: "Tags",
      options: [{ value: "test1", label: "test value 1" }],
    },
  },
  layout: {
    groups: [
      {
        name: "personal",
        label: "Personal Information",
        fields: ["name", "age"],
        collapsible: false,
      },
      {
        name: "work",
        label: "Work Information",
        fields: ["department", "skills", "isActive"],
        collapsible: true,
      },
      {
        name: "metadata",
        label: "Additional Information",
        fields: ["tags"],
        collapsible: true,
      },
    ],
    order: ["name", "age", "department", "skills", "isActive", "tags"],
  },
};
