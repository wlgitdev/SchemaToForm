import { DynamicList, ListSchema } from "@schematoform/schema-to-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

interface TestItem {
  id: number;
  name: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  department: {
    id: number;
    name: string;
  };
}

const testSchema: ListSchema<TestItem> = {
    columns: {
      name: {
        label: "Name",
        field: "name",
        type: "text",
        format: {
          text: { truncate: 20 }
        }
      },
      age: {
        label: "Age",
        field: "age",
        type: "number"
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
        }
      }
    },
    options: {
      pagination: {
        enabled: true,
        pageSize: 10
      }
    }
  };

  
const mockData: TestItem[] = [
  { id: 1, name: "John Doe", age: 30, isActive: true, createdAt: new Date(), department: { id: 1, name: "Engineering" } },
  { id: 2, name: "Jane Smith", age: 28, isActive: false, createdAt: new Date(), department: { id: 2, name: "Marketing" } },
  { id: 3, name: "Alice Johnson", age: 35, isActive: true, createdAt: new Date(), department: { id: 1, name: "Engineering" } },
  { id: 4, name: "Bob Brown", age: 40, isActive: false, createdAt: new Date(), department: { id: 3, name: "HR" } },
  { id: 5, name: "Charlie Davis", age: 25, isActive: true, createdAt: new Date(), department: { id: 2, name: "Marketing" } },
  { id: 6, name: "Diana Prince", age: 32, isActive: true, createdAt: new Date(), department: { id: 4, name: "Finance" } },
  { id: 7, name: "Ethan Hunt", age: 29, isActive: false, createdAt: new Date(), department: { id: 5, name: "Operations" } },
  { id: 8, name: "Fiona Gallagher", age: 38, isActive: true, createdAt: new Date(), department: { id: 1, name: "Engineering" } },
  { id: 9, name: "George Miller", age: 45, isActive: false, createdAt: new Date(), department: { id: 3, name: "HR" } },
  { id: 10, name: "Hannah Wilson", age: 27, isActive: true, createdAt: new Date(), department: { id: 2, name: "Marketing" } },
  { id: 11, name: "Ian Curtis", age: 31, isActive: false, createdAt: new Date(), department: { id: 4, name: "Finance" } },
  { id: 12, name: "Jack Sparrow", age: 36, isActive: true, createdAt: new Date(), department: { id: 5, name: "Operations" } }
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
        <DynamicList
            schema={testSchema}
            queryKey={['test-items']}
            queryFn={fetchData}
            className="w-full"
        />
        </div>
    </QueryClientProvider>
  );
};