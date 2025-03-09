import { flexRender, Table } from '@tanstack/react-table';
import { useListTheme } from '../contexts/ListThemeContext';
import { ReactNode } from 'react';

interface ListBodyProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
}

export const ListBody = <T extends object>({
  table,
  showGroupCounts
}: ListBodyProps<T>) => {
  const theme = useListTheme();

  const renderCell = (content: unknown): ReactNode => {
    return content as ReactNode;
  };

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className={theme.table.row}>
          {row.getVisibleCells().map(cell => {
            const isGrouped = cell.getIsGrouped();
            const isAggregated = cell.getIsAggregated();
            const isPlaceholder = cell.getIsPlaceholder();

            return (
              <td
                key={cell.id}
                className={theme.table.cell}
                {...(isGrouped && { colSpan: row.getVisibleCells().length })}
              >
                {isGrouped ? (
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={row.getToggleExpandedHandler()}
                  >
                    {renderCell(flexRender(cell.column.columnDef.cell, cell.getContext()))}
                    {showGroupCounts && (
                      <span className={theme.table.groupRow.count}>
                        {` (${row.subRows.length})`}
                      </span>
                    )}
                    <span className={theme.table.groupRow.expandIcon}>
                      {row.getIsExpanded() ? ' ↓' : ' →'}
                    </span>
                  </div>
                ) : isAggregated ? (
                  renderCell(flexRender(
                    cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                    cell.getContext()
                  ))
                ) : isPlaceholder ? null : (
                  renderCell(flexRender(cell.column.columnDef.cell, cell.getContext()))
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
};