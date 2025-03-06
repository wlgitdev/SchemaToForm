import { flexRender, Table } from '@tanstack/react-table';
import { useListTheme } from '../../contexts/ListThemeContext';

interface ListBodyProps<T> {
  table: Table<T>;
}

export const ListBody = <T extends object>({ table }: ListBodyProps<T>) => {
  const theme = useListTheme();

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className={theme.table.row}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id} className={theme.table.cell}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};