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
    Object.entries(schema.columns).map(([key, col]) => ({
        id: key,
        accessorKey: (col as ColumnDefinition<TData>).field as keyof TData,
        header: (col as ColumnDefinition<TData>).label,
        cell: ({ getValue, row }: CellContext<TData, unknown>) => {
          const value = getValue() as DataType;
          const typedCol = col as ColumnDefinition<TData>;
          return formatCellValue(value, row.original, typedCol);
        },
        enableSorting: (col as ColumnDefinition<TData>).sortable,
      })),
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
