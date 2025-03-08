import { z } from 'zod';
import { ReactNode } from 'react';

export interface ListTheme {
    table: {
      container: string;
      header: {
        container: string;
        cell: string;
        sortIcon: string;
      };
      row: string;
      cell: string;
    groupRow: {
      cell: string;
      count: string;
      expandIcon: string;
    };
    };
    pagination: {
      container: string;
      button: string;
      text: string;
    };
    loading: string;
    error: string;
}

// Base types for type-safety
export type PrimitiveType = string | number | boolean | Date;
export type DataType = PrimitiveType | PrimitiveType[];

// Unified format configurations
export interface BaseFormat<T> {
  formatter?: (value: T, row: unknown) => ReactNode;
}

export interface ColumnFormat<T = unknown> {
  text?: {
    truncate?: number;
    transform?: "uppercase" | "lowercase" | "capitalize";
  };
  number?: {
    precision?: number;
    notation?: "standard" | "scientific" | "engineering" | "compact";
    currency?: string;
  };
  date?: {
    format?: string;
    relative?: boolean;
    timezone?: string;
  };
  boolean?: {
    trueText?: string;
    falseText?: string;
    trueIcon?: string;
    falseIcon?: string;
  };
  array?: {
    separator?: string;
    maxItems?: number;
    more?: string;
    itemFormatter?: (item: unknown) => ReactNode;
  };
  reference?: {
    labelField: string;
    fallback?: ReactNode;
  };
  action?: {
    label?: string;
    variant?: "primary" | "secondary" | "text" | "link";
    icon?: string;
    disabled?: boolean | ((row: T) => boolean);
    hidden?: boolean | ((row: T) => boolean);
  };
}

// Column definition with proper typing
export interface ColumnDefinition<T = unknown> {
  label: string;
  field: keyof T;
  type: "text" | "number" | "date" | "boolean" | "array" | "reference" | "action";
  width?: number | string;
  sortable: boolean;
  filterable?: boolean;
  visible?: boolean | ((row: T) => boolean);
  className?: string | ((row: T) => string);
  format?: ColumnFormat<T>;
  enableGrouping?: boolean; 
  
  // Reference configuration
  reference?: {
    queryKey: readonly unknown[];
    collection: string;
    valueField?: string;
  };
}

// Main schema interface
export interface ListSchema<T = unknown> {
  columns: {
    [K in keyof T]?: ColumnDefinition<T>;
  };
  
  options?: {
    pagination?: {
      enabled: boolean;
      pageSize?: number;
      pageSizeOptions?: number[];
    };
    selection?: {
      enabled: boolean;
      type: "single" | "multi";
      onSelect?: (selectedRows: T[]) => void;
    };
    groupBy?: {
      field: keyof T;
      expanded?: boolean;
      showCounts?: boolean;
    };
    defaultSort?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
    rowActions?: {
      onClick?: (row: T) => void;
      onDoubleClick?: (row: T) => void;
    };
    selectedActions?: Array<{
      label: string;
      onClick: (selectedRows: T[]) => void;
      disabled?: boolean | ((selectedRows: T[]) => boolean);
    }>;
  };
}

// Schema validation
export const listSchemaValidator = z.object({
  columns: z.record(z.string(), z.object({
    label: z.string(),
    field: z.string(),
    type: z.enum(["text", "number", "date", "boolean", "array", "reference", "action"]),
    width: z.union([z.number(), z.string()]).optional(),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    visible: z.union([z.boolean(), z.function()]).optional(),
    className: z.union([z.string(), z.function()]).optional(),
    format: z.object({}).optional(),
  })),
  options: z.object({
    pagination: z.object({
      enabled: z.boolean(),
      pageSize: z.number().optional(),
      pageSizeOptions: z.array(z.number()).optional()
    }).optional(),
    selection: z.object({
      enabled: z.boolean(),
      type: z.enum(["single", "multi"]),
      onSelect: z.function().optional()
    }).optional(),
    groupBy: z.object({
      field: z.string(),
      expanded: z.boolean().optional(),
      showCounts: z.boolean().optional()
    }).optional(),
  }).optional()
});