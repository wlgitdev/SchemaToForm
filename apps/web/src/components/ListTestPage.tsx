import { DynamicList, ListSchema } from "@schematoform/schema-to-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

interface TestItem {
  id: number;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
  department: {
    id: number;
    name: string;
  };
  actions?: Array<{
    label: string;
    variant?: "primary" | "secondary" | "text" | "link";
    icon?: string;
    onClick: () => void;
  }>;
}

const testSchema: ListSchema<TestItem> = {
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
          transform: "capitalize"
        }
        }
      },
      age: {
        label: "Age",
        field: "age",
      type: "number",
      sortable: true,
      format: {
        number: {
          precision: 0
        }
      }
      },
      isActive: {
        label: "Status",
        field: "isActive",
        type: "boolean",
        format: {
          boolean: {
          trueText: "✅",
          falseText: "❌"
        }
      },
      className: (row) => row.isActive ? "text-green-600" : "text-red-600"
    },
    createdAt: {
      label: "Created",
      field: "createdAt",
      type: "date",
      sortable: true,
      format: {
        date: {
          relative: true
        }
      }
    },
    tags: {
      label: "Tags",
      field: "tags",
      type: "array",
      format: {
        array: {
          maxItems: 2,
          separator: ", ",
          more: "more..."
        }
      }
    },
    department: {
      label: "Department",
      field: "department",
      type: "reference",
      format: {
        reference: {
          labelField: "name",
          fallback: "Unknown"
          }
        }
      }
    },
    options: {
      pagination: {
        enabled: true,
      pageSize: 5,
      pageSizeOptions: [5, 10, 20]
    },

    // Selection configuration
    selection: {
      enabled: true,
      type: "multi",
      onSelect: (selectedRows) => console.log("Selected:", selectedRows)
    },

    // Grouping configuration
    groupBy: {
      field: "department",
      expanded: true,
      showCounts: true
    },

    // Default sorting
    defaultSort: {
      field: "name",
      direction: "asc"
    },

    // Row actions
    rowActions: {
      onClick: (row) => console.log("Row clicked:", row),
      onDoubleClick: (row) => console.log("Row double clicked:", row)
    },

    // Selected actions
    selectedActions: [
      {
        label: "Delete Selected",
        onClick: (selectedRows) => console.log("Delete:", selectedRows),
        disabled: (selectedRows) => selectedRows.length === 0
      },
      {
        label: "Export Selected",
        onClick: (selectedRows) => console.log("Export:", selectedRows),
        disabled: (selectedRows) => selectedRows.length === 0
      }
    ]
  }
};
  
const mockData: TestItem[] = [  
  {
    id: 1,
    name: "John Doe",
    age: 30,
    isActive: true,
    createdAt: new Date("2024-01-01"),
    tags: ["frontend", "react", "typescript"],
    department: { id: 1, name: "Engineering" }
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    age: 28, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 2, name: "Marketing" }, 
    tags: ["SEO", "content", "branding"] 
  },
  { 
    id: 3, 
    name: "Alice Johnson", 
    age: 35, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 1, name: "Engineering" }, 
    tags: ["backend", "node.js", "databases"] 
  },
  { 
    id: 4, 
    name: "Bob Brown", 
    age: 40, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 3, name: "HR" }, 
    tags: ["recruitment", "policy", "training"] 
  },
  { 
    id: 5, 
    name: "Charlie Davis", 
    age: 25, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 2, name: "Marketing" }, 
    tags: ["social media", "ads", "copywriting"] 
  },
  { 
    id: 6, 
    name: "Diana Prince", 
    age: 32, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 4, name: "Finance" }, 
    tags: ["accounting", "budgeting", "taxation"] 
  },
  { 
    id: 7, 
    name: "Ethan Hunt", 
    age: 29, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 5, name: "Operations" }, 
    tags: ["logistics", "supply chain", "efficiency"] 
  },
  { 
    id: 8, 
    name: "Fiona Gallagher", 
    age: 38, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 1, name: "Engineering" }, 
    tags: ["fullstack", "java", "cloud computing"] 
  },
  { 
    id: 9, 
    name: "George Miller", 
    age: 45, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 3, name: "HR" }, 
    tags: ["employee relations", "compensation", "benefits"] 
  },
  { 
    id: 10, 
    name: "Hannah Wilson", 
    age: 27, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 2, name: "Marketing" }, 
    tags: ["branding", "campaigns", "market research"] 
  },
  { 
    id: 11, 
    name: "Ian Curtis", 
    age: 31, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 4, name: "Finance" }, 
    tags: ["auditing", "financial analysis", "compliance"] 
  },
  { 
    id: 14, 
    name: "WL Record", 
    age: 31, 
    isActive: false, 
    createdAt: new Date(), 
    department: { id: 4, name: "Finance" }, 
    tags: ["auditing", "financial analysis", "compliance"] 
  },
  { 
    id: 12, 
    name: "Jack Sparrow", 
    age: 36, 
    isActive: true, 
    createdAt: new Date(), 
    department: { id: 5, name: "Operations" }, 
    tags: ["risk management", "workflow optimization", "logistics"] 
  }
];
  

const queryClient = new QueryClient();

export const ListTestPage = () => {
  const fetchData = async function () {
    return mockData
  };

  return (
    <QueryClientProvider client={queryClient}>
        <div className="p-4">
        <h1 className="text-2xl mb-4">Dynamic List Test</h1>
        <DynamicList<TestItem>
          schema={testSchema}
          queryKey={['test-items']}
          queryFn={fetchData}
          className="w-full"
        />
        </div>
    </QueryClientProvider>
  );
};