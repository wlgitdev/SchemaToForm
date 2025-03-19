import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  RowSelectionState,
  getSortedRowModel,
  CellContext,
  ColumnDef,
  createColumnHelper,
  SortingState,
  GroupingState,
  getGroupedRowModel,
  getExpandedRowModel,
  ExpandedState,
  FilterFn,
  Row,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ActionItem,
  ColumnDefinition,
  ColumnFilterOptions,
  ColumnType,
  DataType,
  ListSchema,
  PrimitiveType,
} from "../types/ListSchema";
import { ListHeader } from "./ListHeader";
import { ListBody } from "./ListBody";
import { SelectionToolbar } from "./SelectionToolbar";
import { useListTheme } from "../contexts/ListThemeContext";

const isReferenceValue = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatCellValue = <T extends object>(
  value: DataType,
  row: T,
  col: ColumnDefinition<T>
): React.ReactNode => {
  if (value === null || value === undefined) {
    return "-";
  }

  const format = col.format;
  if (!format) {
    return String(value);
  }

  // Add handling for action type
  if (col.type === "action" && Array.isArray(value)) {
    const actions = value as ActionItem[]; // Type assertion here is safe because we've verified the column type
    return (
      <div className="flex gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`px-2 py-1 text-sm rounded ${
              action.variant === "primary"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  // Handle reference type separately
  if (col.type === "reference" && isReferenceValue(value)) {
    const labelField = format.reference?.labelField;
    return labelField && value[labelField]
      ? String(value[labelField]) // Ensure string conversion
      : format.reference?.fallback ?? "-";
  }

  // Handle other types
  const typedValue = value as DataType;
  switch (col.type) {
    case "text": {
      const textValue = typedValue as string;
      if (format.text?.transform) {
        switch (format.text.transform) {
          case "uppercase":
            return textValue.toUpperCase();
          case "lowercase":
            return textValue.toLowerCase();
          case "capitalize":
            return textValue.charAt(0).toUpperCase() + textValue.slice(1);
        }
      }
      if (format.text?.truncate && textValue.length > format.text.truncate) {
        return `${textValue.slice(0, format.text.truncate)}...`;
      }
      return textValue;
    }

    case "number": {
      const numValue = typedValue as number;
      if (format.number) {
        return new Intl.NumberFormat(undefined, {
          minimumFractionDigits: format.number.precision,
          notation: format.number.notation,
          style: format.number.currency ? "currency" : "decimal",
          currency: format.number.currency,
        }).format(numValue);
      }
      return numValue.toString();
    }

    case "date": {
      const dateValue = typedValue as Date;
      if (format.date) {
        if (format.date.relative) {
          // Implement relative time formatting
          return new Intl.RelativeTimeFormat().format(
            Math.floor((dateValue.getTime() - Date.now()) / 86400000),
            "days"
          );
        }
        return new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeZone: format.date.timezone,
        }).format(dateValue);
      }
      return dateValue.toLocaleDateString();
    }

    case "boolean": {
      const boolValue = typedValue as boolean;
      if (format.boolean) {
        return boolValue
          ? format.boolean.trueText ?? "Yes"
          : format.boolean.falseText ?? "No";
      }
      return boolValue ? "Yes" : "No";
    }

    case "array": {
      const arrayValue = typedValue as PrimitiveType[];
      if (format.array) {
        const items = format.array.maxItems
          ? arrayValue.slice(0, format.array.maxItems)
          : arrayValue;
        const formatted = items.map(
          (item) => format.array?.itemFormatter?.(item) ?? String(item)
        );
        if (
          format.array.maxItems &&
          arrayValue.length > format.array.maxItems
        ) {
          formatted.push(
            format.array.more ??
              `+${arrayValue.length - format.array.maxItems} more`
          );
        }
        return formatted.join(format.array.separator ?? ", ");
      }
      return arrayValue.join(", ");
    }

    default:
      return String(value);
  }
};

type DynamicListProps<T extends object> = {
  schema: ListSchema<T>;
  queryKey: readonly unknown[];
  queryFn: () => Promise<T[]>;
  className?: string;
};

type QueryState<T> = {
  data: T[];
  isLoading: boolean;
  error: unknown;
};
const getTypeSortingFn = <T extends object>(col: ColumnDefinition<T>) => {
  switch (col.type) {
    case "reference":
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as Record<string, unknown>;
        const b = rowB.getValue(columnId) as Record<string, unknown>;
        const labelField = col.format?.reference?.labelField;
        const aValue = (a?.[labelField as string] as string) ?? "";
        const bValue = (b?.[labelField as string] as string) ?? "";
        return aValue.localeCompare(bValue);
      };

    case "date":
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

    case "number":
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as number;
        const b = rowB.getValue(columnId) as number;
        return (a ?? 0) - (b ?? 0);
      };

    case "boolean":
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as boolean;
        const b = rowB.getValue(columnId) as boolean;
        return a === b ? 0 : a ? -1 : 1;
      };

    case "array":
      return (rowA: any, rowB: any, columnId: string) => {
        const a = rowA.getValue(columnId) as unknown[];
        const b = rowB.getValue(columnId) as unknown[];
        const format = col.format?.array;

        // If there's a custom item formatter, use it for sorting
        if (format?.itemFormatter) {
          const aStr = (a ?? [])
            .map((item) => format.itemFormatter!(item))
            .join(",");
          const bStr = (b ?? [])
            .map((item) => format.itemFormatter!(item))
            .join(",");
          return aStr.localeCompare(bStr);
        }

        // Default array sorting
        return (a ?? []).join(",").localeCompare((b ?? []).join(","));
      };

    case "text":
    default:
      return (rowA: any, rowB: any, columnId: string) => {
        const a = String(rowA.getValue(columnId) ?? "");
        const b = String(rowB.getValue(columnId) ?? "");

        // Apply text transformations if specified
        const transform = col.format?.text?.transform;
        if (transform) {
          switch (transform) {
            case "uppercase":
              return a.toUpperCase().localeCompare(b.toUpperCase());
            case "lowercase":
              return a.toLowerCase().localeCompare(b.toLowerCase());
            case "capitalize":
              return a
                .charAt(0)
                .toUpperCase()
                .localeCompare(b.charAt(0).toUpperCase());
          }
        }

        return a.localeCompare(b);
      };
  }
};

// Strictly typed filter function generator
const getColumnFilterFn = <T extends object>(
  col: ColumnDefinition<T>
): FilterFn<T> => {
  switch (col.type) {
    case "text": {
      const filterFn: FilterFn<T> = (
        row: Row<T>,
        columnId: string,
        filterValue: string
      ) => {
        const value = row.getValue(columnId);
        return String(value)
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      };
      return filterFn;
    }

    case "number": {
      const filterFn: FilterFn<T> = (
        row: Row<T>,
        columnId: string,
        filterValue: [number?, number?]
      ) => {
        const value = row.getValue(columnId) as number;
        const [min, max] = filterValue || [];

        // If both bounds are empty/invalid, show all records
        if (min === undefined && max === undefined) return true;
        if (min === undefined) return value <= max!;
        if (max === undefined) return value >= min;
        return value >= min && value <= max;
      };
      return filterFn;
    }

    case "date": {
      const filterFn: FilterFn<T> = (
        row: Row<T>,
        columnId: string,
        filterValue: [string?, string?]
      ) => {
        try {
          const value = row.getValue(columnId);
          const [start, end] = filterValue || [];

          // Early return if no filter
          if (!start && !end) return true;

          // Safely convert to Date, handling both Date objects and strings
          const dateValue =
            value instanceof Date ? value : new Date(value as string);

          // Validate the date value
          if (isNaN(dateValue.getTime())) return false;

          // Handle start date
          if (start) {
            const startDate = new Date(start);
            if (isNaN(startDate.getTime())) return false;

            // Set to start of day in UTC
            startDate.setUTCHours(0, 0, 0, 0);

            if (dateValue < startDate) return false;
          }

          // Handle end date
          if (end) {
            const endDate = new Date(end);
            if (isNaN(endDate.getTime())) return false;

            // Set to end of day in UTC
            endDate.setUTCHours(23, 59, 59, 999);

            if (dateValue > endDate) return false;
          }

          return true;
        } catch (error) {
          console.error("Date filtering error:", error);
          return false;
        }
      };
      return filterFn;
    }

    case "action":
      // Action columns typically don't need filtering
      return () => true;

    case "array": {
      const filterFn: FilterFn<T> = (
        row: Row<T>,
        columnId: string,
        filterValue: string[]
      ) => {
        if (!filterValue?.length) return true;

        const value = row.getValue(columnId) as unknown[];
        if (!Array.isArray(value)) return false;

        // Format array items using the column's formatter if available
        const format = col.format?.array;
        const formatItem = (item: unknown) =>
          format?.itemFormatter ? format.itemFormatter(item) : String(item);

        const rowValues = value.map(formatItem);

        // Check if any of the filter values match any of the row values
        return filterValue.some((filter) =>
          rowValues.some((val) => val === filter)
        );
      };
      return filterFn;
    }

    default: {
      const filterFn: FilterFn<T> = (
        row: Row<T>,
        columnId: string,
        filterValue: string
      ) => {
        const value = row.getValue(columnId);
        return String(value)
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      };
      return filterFn;
    }
  }
};

export const DynamicList = <T extends object>({
  schema,
  queryKey,
  queryFn,
  className,
}: DynamicListProps<T>) => {
  const theme = useListTheme();
  const columnHelper = createColumnHelper<T>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [grouping, setGrouping] = useState<GroupingState>(
    schema.options?.groupBy ? [schema.options.groupBy.field as string] : []
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Data fetching with react-query
  const {
    data = [],
    isLoading,
    error,
  } = useQuery<T[], Error>({
    queryKey,
    queryFn,
  }) as QueryState<T>;

  const initialExpanded = React.useMemo(() => {
    if (!schema.options?.groupBy?.expanded) return {};

    // Create a map of all unique group values
    const groupMap: Record<string, boolean> = {};
    const groupField = schema.options.groupBy.field as string;

    data.forEach((row) => {
      const value = row[schema.options!.groupBy!.field as keyof T];
      if (isReferenceValue(value)) {
        // For reference types, use the name field as the group value
        groupMap[`${groupField}:${value.name}`] = true;
      } else {
        groupMap[`${groupField}:${String(value)}`] = true;
      }
    });

    return groupMap;
  }, [data, schema.options?.groupBy]);

  const [expanded, setExpanded] = useState<ExpandedState>(initialExpanded);

  // Configure table columns from schema
  const columns = useMemo(() => {
    const cols: ColumnDef<T, any>[] = [];

    // Add selection column if enabled
    if (schema.options?.selection?.enabled) {
      cols.push(
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className={theme?.selection?.checkbox}
            />
          ),
          cell: ({ row }) => (
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className={theme?.selection?.checkbox}
            />
          ),
          enableSorting: false,
          enableGrouping: false,
        })
      );
    }

    // Add schema-defined columns
    Object.entries(schema.columns).forEach(([key, col]) => {
      const typedCol = col as ColumnDefinition<T>;
      cols.push(
        columnHelper.accessor(
          (row: T) => {
            const field = typedCol.field as keyof T;
            const value = row[field];

            // For reference types, return the entire reference object for proper grouping
            if (typedCol.type === "reference" && isReferenceValue(value)) {
              return value;
            }
            return value;
          },
          {
            id: key,
            header: typedCol.label,
            cell: ({ getValue, row }) => {
              const value = getValue() as DataType;
              return formatCellValue(value, row.original, typedCol);
            },
            enableSorting: typedCol.sortable,
            sortingFn: typedCol.sortable
              ? getTypeSortingFn(typedCol)
              : undefined,
            // Only enable grouping for the column specified in schema.options.groupBy
            enableGrouping: schema.options?.groupBy?.field === typedCol.field,
            // Disable aggregation for non-grouped columns by setting to undefined
            aggregationFn: undefined,
            getGroupingValue:
              schema.options?.groupBy?.field === typedCol.field
                ? (row: T) => {
                    const field = typedCol.field as keyof T;
                    const value = row[field];
                    if (
                      typedCol.type === "reference" &&
                      isReferenceValue(value)
                    ) {
                      return value.name;
                    }
                    return value;
                  }
                : undefined,
            enableColumnFilter: typedCol.filterable ?? false,
            filterFn: getColumnFilterFn(typedCol),
          }
        )
      );
    });

    return cols;
  }, [
    schema.columns,
    schema.options?.groupBy,
    columnHelper,
    theme?.selection?.checkbox,
  ]);

  useEffect(() => {
    if (schema.options?.groupBy?.expanded) {
      setExpanded(initialExpanded);
    }
  }, [initialExpanded, schema.options?.groupBy]);

  // Initialize react-table instance
  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      rowSelection,
      sorting,
      grouping,
      expanded,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: schema.options?.selection?.type === "multi",
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    enableGrouping: true,
    enableExpanding: true,
    groupedColumnMode: "reorder",
    initialState: {
      pagination: {
        pageSize: schema.options?.pagination?.pageSize ?? 10,
      },
      grouping: schema.options?.groupBy
        ? [schema.options.groupBy.field as string]
        : [],
      expanded: schema.options?.groupBy?.expanded ? true : {},
    },
  });

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows.map((row) => row.original as T),
    [table, rowSelection]
  );

  const columnFilterOptions = useMemo(() => {
    const options = new Map<string, ColumnFilterOptions>();

    Object.entries(schema.columns).forEach(([key, col]) => {
      const typedCol = col as ColumnDefinition<T>;
      if (typedCol.type === "array" && typedCol.filterable) {
        const column = table.getColumn(key);
        if (!column) return;

        // Get unique values across all rows for this column
        const uniqueItems = new Set<string>();
        data.forEach((row) => {
          const value = row[typedCol.field as keyof T];
          if (Array.isArray(value)) {
            value.forEach((item) => {
              // Safely convert items to strings using the formatter or a safe conversion
              const formatted = typedCol.format?.array?.itemFormatter
                ? String(typedCol.format.array.itemFormatter(item))
                : typeof item === "object"
                ? JSON.stringify(item)
                : String(item);
              uniqueItems.add(formatted);
            });
          }
        });

        options.set(key, {
          uniqueValues: Array.from(uniqueItems).sort(),
          selectedValues: (column.getFilterValue() as string[]) || [],
          onFilterChange: (values: string[]) => {
            column.setFilterValue(values.length ? values : undefined);
          },
        });
      }
    });

    return options;
  }, [data, schema.columns, table]);
  // Call the onSelect callback when selection changes
  useEffect(() => {
    schema.options?.selection?.onSelect?.(selectedRows);
  }, [selectedRows]);
  if (isLoading) {
    return <div className={theme.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={theme.error}>{(error as Error).message}</div>;
  }

  return (
    <div className={className}>
      <SelectionToolbar
        selectedRows={selectedRows}
        selectedActions={schema.options?.selectedActions}
        theme={theme?.selection?.toolbar}
      />
      <table className={theme.table.container}>
        <ListHeader
          table={table}
          showGroupCounts={schema.options?.groupBy?.showCounts}
          schema={schema}
          columnFilterOptions={columnFilterOptions}
        />
        <ListBody
          table={table}
          showGroupCounts={schema.options?.groupBy?.showCounts}
        />
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
