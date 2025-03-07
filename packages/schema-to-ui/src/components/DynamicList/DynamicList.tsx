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
    return value as React.ReactNode;
  }

  // Handle reference type separately
  if (col.type === 'reference') {
    if (!isReferenceValue(value)) {
      return format.reference?.fallback ?? '-';
    }
    const labelField = format.reference?.labelField;
    if (!labelField) {
      return format.reference?.fallback ?? '-';
    }
    return (value[labelField] as React.ReactNode) ?? format.reference?.fallback ?? '-';
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
        const a = rowA.getValue(columnId) as Date;
        const b = rowB.getValue(columnId) as Date;
        return (a?.getTime() ?? 0) - (b?.getTime() ?? 0);
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

  // Data fetching with react-query
  const {
    data = [],
    isLoading,
    error 
  } = useQuery<TData[], Error>({
    queryKey,
    queryFn,
  }) as QueryState<TData>;

  // Configure table columns from schema
  const columns = React.useMemo<ColumnDef<TData>[]>(() => 
  Object.entries(schema.columns).map(([key, col]) => {
    const typedCol = col as ColumnDefinition<TData>;
    return {
        id: key,
      accessorKey: typedCol.field as keyof TData,
      header: typedCol.label,
        cell: ({ getValue, row }: CellContext<TData, unknown>) => {
          const value = getValue() as DataType;
          return formatCellValue(value, row.original, typedCol);
        },
      enableSorting: typedCol.sortable,
      sortingFn: typedCol.sortable ? getTypeSortingFn(typedCol) : undefined,
        };
  }),
    [schema.columns]
  );

  // Initialize react-table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: schema.options?.pagination?.pageSize ?? 10,
      },
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
        <ListHeader table={table} />
        <ListBody table={table} />
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
