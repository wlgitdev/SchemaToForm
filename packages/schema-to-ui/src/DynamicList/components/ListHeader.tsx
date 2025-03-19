import { flexRender, Table } from "@tanstack/react-table";
import { useListTheme } from "../contexts/ListThemeContext";
import { ColumnDefinition, ColumnFilterOptions, ListSchema } from "../types";

interface ListHeaderProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
  schema: ListSchema<T>;
  columnFilterOptions: Map<string, ColumnFilterOptions>;
}

const FilterControl = <T extends object>({
  column,
  columnDef,
  filterOptions,
}: {
  column: any;
  columnDef: ColumnDefinition<T>;
  filterOptions?: ColumnFilterOptions;
}) => {
  const theme = useListTheme();

  if (!columnDef.filterable) return null;

  switch (columnDef.type) {
    case "array": {
      if (!filterOptions) return null;

      // Get the current filter value from the column
      const currentValue = (column.getFilterValue() as string[]) || [];

      return (
        <div className="relative">
          <select
            multiple
            value={currentValue}
            onChange={(e) => {
              const values = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              column.setFilterValue(values.length ? values : undefined);
            }}
            size={Math.min(10, filterOptions.uniqueValues.length)}
            className={`${theme.table.header.filterInput} min-h-[6rem] max-h-[12rem] overflow-y-auto`}
          >
            {filterOptions.uniqueValues.map((item) => (
              <option 
                key={item} 
                value={item}
                // Add selected attribute for explicit control
                selected={currentValue.includes(item)}
                className="p-1 hover:bg-gray-100"
              >
                {item}
              </option>
            ))}
          </select>
          {currentValue.length > 0 && (
            <div className="absolute right-2 top-2">
              <button
                onClick={() => column.setFilterValue(undefined)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      );
    }

    case "text":
      return (
        <input
          type="text"
          value={(column.getFilterValue() ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={`Filter ${columnDef.label}...`}
          className={theme.table.header.filterInput}
        />
      );

    case "number":
      return (
        <div className="flex gap-1">
          <input
            type="number"
            value={(column.getFilterValue()?.[0] ?? "") as string}
            onChange={(e) => {
              const value =
                e.target.value === "" ? undefined : Number(e.target.value);
              column.setFilterValue((prev: [number?, number?]) => [
                value,
                prev?.[1],
              ]);
            }}
            placeholder="Min"
            className={theme.table.header.filterInput}
          />
          <input
            type="number"
            value={(column.getFilterValue()?.[1] ?? "") as string}
            onChange={(e) => {
              const value =
                e.target.value === "" ? undefined : Number(e.target.value);
              column.setFilterValue((prev: [number?, number?]) => [
                prev?.[0],
                value,
              ]);
            }}
            placeholder="Max"
            className={theme.table.header.filterInput}
          />
        </div>
      );

    case "boolean":
      return (
        <select
          value={(column.getFilterValue() ?? "").toString()}
          onChange={(e) => {
            const value = e.target.value;
            // Clear filter if "All" is selected, otherwise convert to boolean
            column.setFilterValue(value === "" ? undefined : value === "true");
          }}
          className={theme.table.header.filterInput}
        >
          <option value="">All</option>
          <option value="true">
            {columnDef.format?.boolean?.trueText ?? "Yes"}
          </option>
          <option value="false">
            {columnDef.format?.boolean?.falseText ?? "No"}
          </option>
        </select>
      );

    case "date":
      return (
        <div className="flex gap-1">
          <input
            type="date"
            value={(column.getFilterValue()?.[0] ?? "") as string}
            onChange={(e) =>
              column.setFilterValue((prev: [string?, string?]) => [
                e.target.value,
                prev?.[1],
              ])
            }
            className={theme.table.header.filterInput}
          />
          <input
            type="date"
            value={(column.getFilterValue()?.[1] ?? "") as string}
            onChange={(e) =>
              column.setFilterValue((prev: [string?, string?]) => [
                prev?.[0],
                e.target.value,
              ])
            }
            className={theme.table.header.filterInput}
          />
        </div>
      );

    default:
      return null;
  }
};

export const ListHeader = <T extends object>({
  table,
  showGroupCounts,
  schema,
  columnFilterOptions,
}: ListHeaderProps<T>) => {
  const theme = useListTheme();

  return (
    <thead className={theme.table.header.container}>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const columnDef = schema.columns[header.id as keyof T];
            return (
              <th key={header.id} className={theme.table.header.cell}>
                {header.isPlaceholder ? null : (
                  <div>
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className={theme.table.header.sortIcon}>
                          {header.column.getIsSorted() === "asc" ? " ↑" : " ↓"}
                        </span>
                      )}
                    </div>
                    {columnDef && (
                      <FilterControl
                        column={header.column}
                        columnDef={columnDef}
                        filterOptions={columnFilterOptions.get(header.id)}
                      />
                    )}
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
};
