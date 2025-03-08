import { CellContext, flexRender, Table } from '@tanstack/react-table';
import { useListTheme } from '../../contexts/ListThemeContext';
import React, { ReactNode } from 'react';

const isReferenceValue = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

// Helper function to safely convert unknown to ReactNode
const toReactNode = (value: unknown): ReactNode => {
  if (value === null || value === undefined) {
    return '-';
  }
  return String(value);
};

interface ListBodyProps<T> {
  table: Table<T>;
  showGroupCounts?: boolean;
}

export const ListBody = <T extends object>({
  table,
  showGroupCounts
}: ListBodyProps<T>) => {
  const theme = useListTheme();

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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                  flexRender(
                    cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                    cell.getContext()
                  )
                ) : isPlaceholder ? null : (
                  flexRender(cell.column.columnDef.cell, cell.getContext())
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
};