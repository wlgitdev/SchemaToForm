import { flexRender, Table } from "@tanstack/react-table";
import { useListTheme } from "../contexts/ListThemeContext";
import { ColumnDefinition, ColumnFilterOptions, ListSchema } from "../types";
import Select, { MultiValue, SingleValue, StylesConfig } from "react-select";
import { ReactNode } from "react";

interface ListHeaderProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
  schema: ListSchema<T>;
  columnFilterOptions: Map<string, ColumnFilterOptions>;
}

type SelectOption = {
  value: string;
  label: string;
};

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
    case "array":
    case "reference": {
      // Handle both array and reference array filtering
      if (!filterOptions) return null;

      const filterConfig =
        columnDef.format?.array?.filter || columnDef.format?.reference?.filter;
      const isMulti = filterConfig?.isMulti ?? true;
      const currentValue = (column.getFilterValue() as string[]) || [];

      const options = filterOptions.uniqueValues.map((value) => ({
        value,
        label: value,
      }));

      const selectedOptions = options.filter((opt) =>
        currentValue.includes(opt.value)
      );

      const selectStyles: StylesConfig<SelectOption, boolean> = {
        container: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.container && {
            className: theme.table.header.select.container,
          }),
        }),
        control: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.control && {
            className: theme.table.header.select.control,
          }),
        }),
        menu: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.menu && {
            className: theme.table.header.select.menu,
          }),
        }),
        option: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.option && {
            className: theme.table.header.select.option,
          }),
        }),
        multiValue: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.multiValue && {
            className: theme.table.header.select.multiValue,
          }),
        }),
        placeholder: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.placeholder && {
            className: theme.table.header.select.placeholder,
          }),
        }),
        input: (provided) => ({
          ...provided,
          ...(theme.table.header.select?.input && {
            className: theme.table.header.select.input,
          }),
        }),
      };

      return (
        <Select<SelectOption, boolean>
          isMulti={isMulti}
          value={selectedOptions}
          options={options}
          onChange={(selected) => {
            const values = selected
              ? isMulti
                ? (selected as MultiValue<SelectOption>).map((opt) => opt.value)
                : [(selected as SingleValue<SelectOption>)?.value].filter(
                    Boolean
                  )
              : undefined;
            column.setFilterValue(values);
          }}
          placeholder={
            filterConfig?.placeholder ?? `Filter ${columnDef.label}...`
          }
          noOptionsMessage={() =>
            filterConfig?.noOptionsMessage ?? "No options available"
          }
          isClearable={filterConfig?.isClearable ?? true}
          isSearchable={filterConfig?.isSearchable ?? true}
          maxMenuHeight={filterConfig?.maxMenuHeight ?? 200}
          styles={selectStyles}
          classNamePrefix="react-select"
        />
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
                      <>
                        {
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          ) as ReactNode
                        }
                      </>
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
