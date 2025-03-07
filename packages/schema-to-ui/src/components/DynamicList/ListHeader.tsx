import { flexRender, Table } from '@tanstack/react-table';
import { useListTheme } from '../../contexts/ListThemeContext';

interface ListHeaderProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
}

export const ListHeader = <T extends object>({ 
  table, 
  showGroupCounts 
}: ListHeaderProps<T>) => {
  const theme = useListTheme();

  return (
    <thead className={theme.table.header.container}>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th 
              key={header.id}
              className={theme.table.header.cell}
              onClick={header.column.getToggleSortingHandler()}
            >
              {header.isPlaceholder ? null : (
                <>
                  {flexRender(header.column.columnDef.header, header.getContext())}
              {header.column.getIsSorted() && (
                <span className={theme.table.header.sortIcon}>
                  {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
                </span>
                  )}
                </>
              )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};