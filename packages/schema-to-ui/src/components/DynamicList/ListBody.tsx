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
      {table.getRowModel().rows.map(row => {
        // Handle grouped rows
        if (row.getIsGrouped()) {
          const groupingColumnId = table.getState().grouping[0];
          const groupingColumn = groupingColumnId ? table.getColumn(groupingColumnId) : null;
          const value = groupingColumn ? row.getValue(groupingColumnId) : null;
          
          // Format the group value display
          const groupDisplay = isReferenceValue(value) 
            ? String(value.name || JSON.stringify(value))
            : String(value);
          
          return (
            <React.Fragment key={row.id}>
              <tr className={theme.table.row}>
                <td 
                  colSpan={row.getVisibleCells().length}
                  className={theme.table.groupRow.cell}
                  onClick={row.getToggleExpandedHandler()}
                  style={{ cursor: 'pointer' }}
                >
                  {groupDisplay}
                  {showGroupCounts && (
                    <span className={theme.table.groupRow.count}>
                      {` (${row.subRows.length})`}
                    </span>
                  )}
                  <span className={theme.table.groupRow.expandIcon}>
                    {row.getIsExpanded() ? ' ↓' : ' →'}
                  </span>
                </td>
              </tr>
              {row.getIsExpanded() && row.subRows.map(subRow => (
                <tr key={subRow.id} className={theme.table.row}>
                  {subRow.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className={theme.table.cell}
                      {...(cell.getIsGrouped() && { colSpan: row.getVisibleCells().length })}
                    >
                      {cell.getIsGrouped() ? (
                        // Group cell content
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ) : cell.getIsAggregated() ? (
                        // Aggregated cell content
                        flexRender(
                          cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      ) : (
                        // Regular cell content
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          );
        }

        return (
        <tr key={row.id} className={theme.table.row}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id} className={theme.table.cell}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
        );
      })}
    </tbody>
  );
};