# Schema-to-List Field Type Display Requirements
## Requirements 2.1-2.3: Field Type Display Configuration

The **DynamicList** component will use the unified `ColumnFormat` type from `ListSchema.ts` for all field type displays and enforce **runtime validation** using `zod`.

```typescript
import { ListSchema, ColumnFormat, listSchemaValidator } from '../types/ListSchema';
import { z } from 'zod';

// Example implementation
const DynamicList = <T extends unknown>({ 
  schema, 
  queryKey, 
  queryFn,
  referenceQueries 
}: DynamicListProps<T>) => {
  listSchemaValidator.parse(schema); // Runtime validation
  // Implementation details
};

const listSchema: ListSchema<MyDataType> = {
  columns: {
    name: {
      label: "Name",
      field: "name",
      type: "text",
      format: {
        text: {
          truncate: 50,
          transform: "capitalize"
        }
      }
    },
    amount: {
      label: "Amount",
      field: "amount", 
      type: "number",
      format: {
        number: {
          precision: 2
        }
      }
    },
    isActive: {
      label: "Status",
      field: "isActive",
      type: "boolean",
      format: {
        boolean: {
          trueText: "Active",
          falseText: "Inactive"
        }
      }
    },
    tags: {
      label: "Tags",
      field: "tags",
      type: "array",
      format: {
        array: {
          separator: ", ",
          maxItems: 3
        }
      }
    }
  }
};
```

Implementation Guidelines:

1. Field Type Renderers
   - Create separate renderer components for each field type
   - Support default formatting for each type
   - Allow custom formatting through schema configuration
   - Handle null/undefined values gracefully

2. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        renderers/
          TextRenderer.tsx
          NumberRenderer.tsx
          DateRenderer.tsx
          BooleanRenderer.tsx
          ArrayRenderer.tsx
```

3. Dependencies:
   - date-fns (for date formatting)
   - Tailwind CSS (for default styling)

## Requirement 2.4: Reference Field Display

The **DynamicList** component will support **efficient reference field data fetching**, integrating with `react-query` caching.

```typescript
interface ListSchema {
  columns: {
    [key: string]: {
      // ... existing column properties ...
      
      type: "reference";
      format?: {
        reference: {
            labelField: string;
            fallback?: React.ReactNode;
            displayFields?: string[]; 
        }
      };
      
      // Reference data configuration
      reference: {
        entity: string;           // e.g. 'users', 'departments'
        idField?: string;        // defaults to '_id'
      };
    }
  };
}
```

Example Usage:
```typescript
interface DynamicListProps {
  schema: ListSchema;
  queryKey: string | unknown[];
  queryFn: () => Promise<any[]>;
  referenceQueries?: {
    [collection: string]: () => Promise<any[]>;  // Query functions for reference data
  };
}

const MyList = () => {
  return (
    <DynamicList
      schema={{
        columns: {
          userId: {
            label: "User",
            field: "userId",
            type: "reference",
            reference: {
              queryKey: ['users'],
              collection: "users",
              valueField: "_id"
            },
            format: {
              reference: {
                labelField: "name",
                fallback: "Unknown User"
              }
            }
          }
        }
      }}
      queryKey={['items']}
      queryFn={fetchItems}
      referenceQueries={{
        users: fetchUsers
      }}
    />
  );
};
```

Implementation Guidelines:

1. Reference Field Renderer
   - Create ReferenceRenderer component using react-query hooks
   - Leverage existing queryFn pattern from DynamicList
   - Handle loading and error states through react-query

2. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        renderers/
          ReferenceRenderer.tsx
```

3. Dependencies:
   - Uses existing react-query integration
   - Tailwind CSS for default styling


## Requirement 2.5: Action Button Fields
### Core Feature: Action Button Field Type

The DynamicList component will support action button fields through the column schema:

```typescript
interface ListSchema {
  columns: {
    [key: string]: {
      // ... existing column properties ...
      
      type: "action";
      format?: {
        action: {
          label: string;           // Button label text
          variant?: "primary" | "secondary" | "text";  // Button style variant
          icon?: string;          // Optional icon class
          disabled?: boolean | ((row: any) => boolean);  // Disable condition
        }
      };
      
      // Action configuration
      action: {
        onClick: (row: any) => void;  // Click handler function
      };
    }
  };
}
```

Example Usage:
```typescript
const listSchema: ListSchema = {
  columns: {
    name: {
      label: "Name",
      field: "name",
      type: "text"
    },
    edit: {
      label: "Actions",
      type: "action",
      format: {
        action: {
          label: "Edit",
          variant: "primary",
          disabled: (row) => !row.isEditable
        }
      },
      action: {
        onClick: (row) => handleEdit(row)
      }
    }
  }
};
```

Implementation Guidelines:

1. Action Button Renderer
   - Create ActionRenderer component for action button fields
   - Support basic button variants (primary/secondary/text)
   - Handle disabled state through static or dynamic conditions
   - Support optional icon display

2. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        renderers/
          ActionRenderer.tsx
```

3. Dependencies:
   - Uses existing Tailwind CSS classes for button styling
