# Schema-to-List Dynamic Table Generation Requirements
## Requirement 1.1. Column Schema Definition

```typescript:packages/schema-to-ui/src/types/ListSchema.ts
// Base types for type-safety
import { z } from 'zod';

export type PrimitiveType = string | number | boolean | Date;
export type DataType = PrimitiveType | PrimitiveType[];

// Unified format configurations
export interface BaseFormat<T> {
  formatter?: (value: T, row: unknown) => React.ReactNode;
}

export interface ColumnFormat<T = unknown> {
  text?: {
    truncate?: number;
    transform?: "uppercase" | "lowercase" | "capitalize";
  };
  number?: {
    precision?: number;
    notation?: "standard" | "scientific" | "engineering" | "compact";
    currency?: string;
  };
  date?: {
    format?: string;
    relative?: boolean;
    timezone?: string;
  };
  boolean?: {
    trueText?: string;
    falseText?: string;
    trueIcon?: string;
    falseIcon?: string;
  };
  array?: {
    separator?: string;
    maxItems?: number;
    more?: string;
    itemFormatter?: (item: unknown) => React.ReactNode;
  };
  reference?: {
    labelField: string;
    fallback?: React.ReactNode;
  };
  action?: {
    label?: string;
    variant?: "primary" | "secondary" | "text" | "link";
    icon?: string;
    disabled?: boolean | ((row: T) => boolean);
    hidden?: boolean | ((row: T) => boolean);
  };
}

// Unified column type definition
export type ColumnType = 
  | "text" 
  | "number" 
  | "date" 
  | "boolean" 
  | "array"
  | "reference"
  | "action";

// Column definition with proper typing
export interface ColumnDefinition<T = unknown> {
  label: string;
  field: keyof T;
  type: ColumnType;
  width?: number | string;
  sortable?: boolean;
  filterable?: boolean;
  visible?: boolean | ((row: T) => boolean);
  className?: string | ((row: T) => string);
  format?: ColumnFormat<T>;
  
  // Reference configuration (only for reference type)
  reference?: {
    queryKey: readonly unknown[];
    collection: string;
    valueField?: string;
  };
}

// Main schema interface
export interface ListSchema<T = unknown> {
  columns: {
    [K in keyof T]?: ColumnDefinition<T>;
  };
  
  options?: {
    // Pagination
    pagination?: {
      enabled: boolean;
      pageSize?: number;
      pageSizeOptions?: number[];
    };

    // Selection
    selection?: {
      enabled: boolean;
      type: "single" | "multi";
      onSelect?: (selectedRows: T[]) => void;
    };

    // Grouping
    groupBy?: {
      field: keyof T;
      expanded?: boolean;
      showCounts?: boolean;
    };

    // Sorting
    defaultSort?: {
      field: keyof T;
      direction: "asc" | "desc";
    };

    // Row actions
    rowActions?: {
      onClick?: (row: T) => void;
      onDoubleClick?: (row: T) => void;
    };
    selectedActions?: Array<{
      label: string;
      onClick: (selectedRows: T[]) => void;
      disabled?: boolean | ((selectedRows: T[]) => boolean);
    }>;
  };
}

// Schema validation using zod
export const listSchemaValidator = z.object({
  columns: z.record(z.string(), z.object({
    label: z.string(),
    field: z.string(),
    type: z.enum(["text", "number", "date", "boolean", "array", "reference", "action"]),
  })),
  options: z.object({
    pagination: z.object({
      enabled: z.boolean(),
      pageSize: z.number().optional(),
      pageSizeOptions: z.array(z.number()).optional()
    }).optional(),
    selection: z.object({
      enabled: z.boolean(),
      type: z.enum(["single", "multi"]),
      onSelect: z.function().optional()
    }).optional()
  }).optional()
});
```

Key Features and Requirements:

1. Column Definition
   - Support for basic data types (text, number, date, boolean, array)
   - Flexible width configuration
   - Optional sorting and filtering capabilities
   - Custom formatting options
   - Conditional visibility and styling
   - Action column support with button/link/menu variants
   - Schema adapter available to pass a mongoose model schema to and it creates table columns from the fields

2. Data Display Options
   - Pagination configuration with customizable page sizes
   - Row selection (single/multi) with selection callbacks
   - Row grouping by specified fields
   - Default sorting configuration
   - Row-level event handlers

3. Example Usage:
```typescript
interface User {
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
}

const userListSchema: ListSchema<User> = {
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
    age: {
      label: "Age",
      field: "age",
      type: "number",
      format: {
        number: {
          precision: 0
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
  }
};
```

1. Implementation should follow existing patterns in schema-to-ui:
   - Use TypeScript for type safety
   - Leverage existing validation system
   - Integrate with current theme system
   - Support dependency injection for custom formatters

2. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        ColumnSchema.ts
        ColumnRenderer.tsx
        ListHeader.tsx
        ListBody.tsx
    types/
      listTypes.ts
    validators/
      columnSchemaValidator.ts
```



## Requirement 1.2. Rendering Lists
### Core Component: DynamicList

The DynamicList component will be a React component that leverages react-table for UI rendering and react-query for data fetching.

````typescript
interface DynamicListProps {
  // Core props
  schema: ListSchema;                    // Column definitions and options
  queryKey: string | unknown[];          // React Query key
  queryFn: () => Promise<any[]>;         // Data fetching function
  
  // Optional configuration
  className?: string;                    // Custom CSS class
  theme?: Partial<ListTheme>;           // Theme overrides
}
````

Key Features:

1. Data Management
   - Use react-query for data fetching and caching
   - Automatic loading and error states handling
   - Built-in data refetching capabilities

2. Table Rendering
   - Use react-table for table rendering and features
   - Column definitions mapped from schema to react-table format
   - Built-in virtualization for large datasets

3. Example Usage:
````typescript
const MyList = () => {
  const fetchData = async () => {
    const response = await fetch('/api/items');
    return response.json();
  };

  return (
    <DynamicList
      schema={listSchema}
      queryKey={['items']}
      queryFn={fetchData}
      className="my-list"
    />
  );
};
````

4. Implementation Guidelines:
   - Integrate react-table for all table rendering
   - Use react-query for data fetching and state management
   - Follow existing patterns from schema-to-ui
   - Keep initial implementation focused on core features

5. File Structure:
````
schema-to-ui/
  src/
    components/
      DynamicList/
        DynamicList.tsx          # Main component with react-query and react-table integration
        tableUtils.ts           # Helper functions for react-table configuration
        queryUtils.ts          # Helper functions for react-query setup
````

6. Dependencies:
   - React 18+
   - TypeScript 4.5+
   - @tanstack/react-table
   - @tanstack/react-query
   - Tailwind CSS (for default styling)

## Requirement 1.3. Row Grouping
### Core Feature: Row Grouping via Columns

The DynamicList component will support grouping rows by column values using the following schema configuration:

```typescript
interface ListSchema {
  // ... existing code ...
  
  options?: {
    // ... existing options ...

    // Row Grouping Configuration
    groupBy?: {
      field: string;           // Column field to group by
      expanded?: boolean;      // Default expand/collapse state
      showCounts?: boolean;    // Show row counts in group headers
    };
  };
}
```

Key Features:

1. Basic Grouping
   - Group rows by any column field value
   - Collapsible group sections
   - Default expanded/collapsed state control
   - Optional row count display per group

2. Example Usage:
```typescript
const listSchema: ListSchema = {
  columns: {
    status: {
      label: "Status",
      field: "status",
      type: "text"
    },
    name: {
      label: "Name", 
      field: "name",
      type: "text"
    }
  },
  options: {
    groupBy: {
      field: "status",
      expanded: true,
      showCounts: true
    }
  }
};
```

3. Implementation Guidelines:
   - Use react-table's built-in grouping functionality
   - Keep initial implementation focused on single-level grouping
   - Support expand/collapse all groups
   - Maintain existing sorting and filtering capabilities when grouped

4. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        GroupRow.tsx       # Group header row component
        groupUtils.ts      # Helper functions for grouping
```

## Requirement 1.4. Row Selection and Actions
### Core Feature: Row Selection with Custom Actions

The DynamicList component will support row selection and custom actions on selected rows through the following schema configuration:

```typescript
interface ListSchema {
  // ... existing code ...
  
  options?: {
    // ... existing options ...

    // Row Selection Configuration
    selection?: {
      enabled: boolean;           // Enable/disable row selection
      type: "single" | "multi";   // Single or multi-row selection
      onSelect?: (selectedRows: any[]) => void;  // Selection change callback
    };

    // Selected Row Actions
    selectedActions?: {
      label: string;             // Action button label
      onClick: (selectedRows: any[]) => void;  // Action callback
      disabled?: boolean;        // Disable action button
    }[];
  };
}
```

Key Features:

1. Row Selection
   - Support for single and multi-row selection
   - Selection state management
   - Selection change callback
   - Visual indication of selected rows

2. Selected Row Actions
   - Multiple action buttons for selected rows
   - Action buttons only visible when rows are selected
   - Disable actions based on selection state

3. Example Usage:
```typescript
const listSchema: ListSchema = {
  columns: {
    name: {
      label: "Name",
      field: "name",
      type: "text"
    },
    status: {
      label: "Status",
      field: "status",
      type: "text"
    }
  },
  options: {
    selection: {
      enabled: true,
      type: "multi",
      onSelect: (selectedRows) => console.log("Selected:", selectedRows)
    },
    selectedActions: [
      {
        label: "Delete Selected",
        onClick: (selectedRows) => handleDelete(selectedRows)
      },
      {
        label: "Export Selected",
        onClick: (selectedRows) => handleExport(selectedRows)
      }
    ]
  }
};
```

4. Implementation Guidelines:
   - Use react-table's built-in row selection features
   - Keep selection state in the DynamicList component
   - Render action buttons above the table when rows are selected
   - Support keyboard navigation for selection (Space/Enter)

5. File Structure:
```
schema-to-ui/
  src/
    components/
      DynamicList/
        SelectionToolbar.tsx    # Selected row actions toolbar
        selectionUtils.ts       # Selection helper functions
```
