import { flexRender, Table } from "@tanstack/react-table";
import { useListTheme } from "../contexts/ListThemeContext";
import { ColumnDefinition, ListSchema } from "../types";

interface ListHeaderProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
  schema: ListSchema<T>;
}

const FilterControl = <T extends object>({
  column,
  columnDef,
}: {
  column: any; // Using any here as the column type is complex
  columnDef: ColumnDefinition<T>;
}) => {
  const theme = useListTheme();

  if (!columnDef.filterable) return null;

  switch (columnDef.type) {
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
