import React, { ReactElement, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  CellContext,
  ColumnDef,
  createColumnHelper,
  SortingState,
  GroupingState,
  getGroupedRowModel,
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
import { ColumnDefinition, DataType, ListSchema, PrimitiveType } from "../../types/ListSchema";
import { ListHeader } from "./ListHeader";
import { ListBody } from "./ListBody";
import { useListTheme } from "../../contexts/ListThemeContext";

const isReferenceValue = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const formatCellValue = <T extends object>(
  value: DataType,
  row: T,
  col: ColumnDefinition<T>
): React.ReactNode => {
  if (value === null || value === undefined) {
    return '-';
  }

  const format = col.format;
  if (!format) {
    return String(value);  
  }

  // Handle reference type separately
  if (col.type === 'reference' && isReferenceValue(value)) {
    const labelField = format.reference?.labelField;
    return labelField && value[labelField] 
      ? String(value[labelField])  // Ensure string conversion
      : (format.reference?.fallback ?? '-');
  }

  // Handle other types
  const typedValue = value as DataType;
  switch (col.type) {
    case 'text': {
      const textValue = typedValue as string;
      if (format.text?.transform) {
        switch (format.text.transform) {
          case 'uppercase': return textValue.toUpperCase();
          case 'lowercase': return textValue.toLowerCase();
          case 'capitalize': return textValue.charAt(0).toUpperCase() + textValue.slice(1);
        }
      }
      if (format.text?.truncate && textValue.length > format.text.truncate) {
        return `${textValue.slice(0, format.text.truncate)}...`;
      }
      return textValue;
    }

    case 'number': {
      const numValue = typedValue as number;
      if (format.number) {
        return new Intl.NumberFormat(undefined, {
          minimumFractionDigits: format.number.precision,
          notation: format.number.notation,
          style: format.number.currency ? 'currency' : 'decimal',
          currency: format.number.currency,
        }).format(numValue);
      }
      return numValue.toString();
    }

    case 'date': {
      const dateValue = typedValue as Date;
      if (format.date) {
        if (format.date.relative) {
          // Implement relative time formatting
          return new Intl.RelativeTimeFormat().format(
            Math.floor((dateValue.getTime() - Date.now()) / 86400000),
            'days'
          );
        }
        return new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeZone: format.date.timezone,
        }).format(dateValue);
      }
      return dateValue.toLocaleDateString();
    }

    case 'boolean': {
      const boolValue = typedValue as boolean;
      if (format.boolean) {
        return boolValue 
          ? (format.boolean.trueText ?? 'Yes')
          : (format.boolean.falseText ?? 'No');
      }
      return boolValue ? 'Yes' : 'No';
    }

    case 'array': {
      const arrayValue = typedValue as PrimitiveType[];
      if (format.array) {
        const items = format.array.maxItems 
          ? arrayValue.slice(0, format.array.maxItems) 
          : arrayValue;
        const formatted = items.map(item => 
          format.array?.itemFormatter?.(item) ?? String(item)
        );
        if (format.array.maxItems && arrayValue.length > format.array.maxItems) {
          formatted.push(format.array.more ?? `+${arrayValue.length - format.array.maxItems} more`);
        }
        return formatted.join(format.array.separator ?? ', ');
      }
      return arrayValue.join(', ');
    }

    default:
      return String(value);
  }
};

type DynamicListProps<TData extends object> = {
  schema: ListSchema<TData>;
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData[]>;
  className?: string;
};

type QueryState<TData> = {
  data: TData[];
  isLoading: boolean;
  error: unknown;
};
const getTypeSortingFn = <TData extends object>(
  col: ColumnDefinition<TData>
) => {
  switch (col.type) {
    case 'reference':
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as Record<string, unknown>;
        const b = rowB.getValue(columnId) as Record<string, unknown>;
        const labelField = col.format?.reference?.labelField;
        const aValue = (a?.[labelField as string] as string) ?? '';
        const bValue = (b?.[labelField as string] as string) ?? '';
        return aValue.localeCompare(bValue);
      };

      case 'date':
        return (rowA: any, rowB: any, columnId: string) => {
          const aValue = rowA.getValue(columnId);
          const bValue = rowB.getValue(columnId);
          
          // Convert to Date objects if they're strings
          const a = aValue instanceof Date ? aValue : new Date(aValue);
          const b = bValue instanceof Date ? bValue : new Date(bValue);
          
          // Handle invalid dates
          const aTime = isNaN(a.getTime()) ? 0 : a.getTime();
          const bTime = isNaN(b.getTime()) ? 0 : b.getTime();
          
          return aTime - bTime;
        };
        
    case 'number':
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as number;
        const b = rowB.getValue(columnId) as number;
        return (a ?? 0) - (b ?? 0);
      };

    case 'boolean':
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as boolean;
        const b = rowB.getValue(columnId) as boolean;
        return (a === b) ? 0 : a ? -1 : 1;
      };

    case 'array':
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as unknown[];
        const b = rowB.getValue(columnId) as unknown[];
        const format = col.format?.array;
        
        // If there's a custom item formatter, use it for sorting
        if (format?.itemFormatter) {
          const aStr = (a ?? []).map(item => format.itemFormatter!(item)).join(',');
          const bStr = (b ?? []).map(item => format.itemFormatter!(item)).join(',');
          return aStr.localeCompare(bStr);
        }
        
        // Default array sorting
        return (a ?? []).join(',').localeCompare((b ?? []).join(','));
      };

    case 'text':
    default:
      return (rowA: any, rowB: any, columnId: string) => {
        const a = String(rowA.getValue(columnId) ?? '');
        const b = String(rowB.getValue(columnId) ?? '');
        
        // Apply text transformations if specified
        const transform = col.format?.text?.transform;
        if (transform) {
          switch (transform) {
            case 'uppercase':
              return a.toUpperCase().localeCompare(b.toUpperCase());
            case 'lowercase':
              return a.toLowerCase().localeCompare(b.toLowerCase());
            case 'capitalize':
              return a.charAt(0).toUpperCase().localeCompare(b.charAt(0).toUpperCase());
          }
        }
        
        return a.localeCompare(b);
      };
  }
};

export const DynamicList = <TData extends object>({
  schema,
  queryKey,
  queryFn,
  className,
}: DynamicListProps<TData>) => {
  const theme = useListTheme();
  const columnHelper = createColumnHelper<TData>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [grouping, setGrouping] = useState<GroupingState>(
    schema.options?.groupBy ? [schema.options.groupBy.field as string] : []
  );

  // Data fetching with react-query
  const {
    data = [],
    isLoading,
    error 
  } = useQuery<TData[], Error>({
    queryKey,
    queryFn,
  }) as QueryState<TData>;

  const initialExpanded = React.useMemo(() => {
    if (!schema.options?.groupBy?.expanded || !data.length) return {};
    
    const newExpanded: ExpandedState = {};
    data.forEach(row => {
      const field = schema.options!.groupBy!.field as keyof TData;
      const groupValue = row[field];
      const key = isReferenceValue(groupValue) ? `${groupValue.id}` : String(groupValue);
      newExpanded[key] = true;
    });
    return newExpanded;
  }, [data, schema.options?.groupBy]);

  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  // Configure table columns from schema
  const columns = React.useMemo(() => 
  Object.entries(schema.columns).map(([key, col]) => {
    const typedCol = col as ColumnDefinition<TData>;
      return columnHelper.accessor((row: TData) => {
        const field = typedCol.field as keyof TData;
        const value = row[field];
        
        // For reference types, return the entire reference object for proper grouping
        if (typedCol.type === 'reference' && isReferenceValue(value)) {
          return value;
        }
        return value;
      }, {
        id: key,
      header: typedCol.label,
        cell: ({ getValue, row }) => {
          const value = getValue() as DataType;
          return formatCellValue(value, row.original, typedCol);
        },
      enableSorting: typedCol.sortable,
      sortingFn: typedCol.sortable ? getTypeSortingFn(typedCol) : undefined,
      // Only enable grouping for the column specified in schema.options.groupBy
      enableGrouping: schema.options?.groupBy?.field === typedCol.field,
      // Disable aggregation for non-grouped columns by setting to undefined
      aggregationFn: undefined,
      getGroupingValue: schema.options?.groupBy?.field === typedCol.field 
        ? (row: TData) => {
          const field = typedCol.field as keyof TData;
          const value = row[field];
          if (typedCol.type === 'reference' && isReferenceValue(value)) {
              return value.name;
            }
            return value;
          }
        : undefined,
      });
  }),
  [schema.columns, schema.options?.groupBy]
  );

  React.useEffect(() => {
    if (schema.options?.groupBy?.expanded && data.length > 0) {
      const newExpanded: ExpandedState = {};
      data.forEach(row => {
        const field = schema.options!.groupBy!.field as keyof TData;
        const groupValue = row[field];
        if (isReferenceValue(groupValue)) {
          newExpanded[`${groupValue.id}`] = true;
        } else {
          newExpanded[String(groupValue)] = true;
        }
      });
      setExpanded(newExpanded);
    }
  }, [data, schema.options?.groupBy]);
  
  // Initialize react-table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      grouping,
      expanded,
    },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    enableGrouping: true,
    enableExpanding: true,
  groupedColumnMode: 'reorder',
    initialState: {
      pagination: {
        pageSize: schema.options?.pagination?.pageSize ?? 10,
      },
      grouping: schema.options?.groupBy ? [schema.options.groupBy.field as string] : [],
      expanded: schema.options?.groupBy?.expanded ? true : {},
    },
  });

  if (isLoading) {
    return <div className={theme.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={theme.error}>{(error as Error).message}</div>;
  }

  return (
    <div className={className}>
      <table className={theme.table.container}>
        <ListHeader table={table} showGroupCounts={schema.options?.groupBy?.showCounts} />
        <ListBody table={table} showGroupCounts={schema.options?.groupBy?.showCounts} />
      </table>
      {schema.options?.pagination?.enabled && (
        <div className={theme.pagination.container}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className={theme.pagination.button}
          >
            Previous
          </button>
          <span className={theme.pagination.text}>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className={theme.pagination.button}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
