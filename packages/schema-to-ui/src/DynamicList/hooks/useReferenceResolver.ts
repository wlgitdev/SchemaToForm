import { QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { ColumnDefinition, ListSchema, ReferenceConfig } from "../types";

export const useReferenceResolver = <T extends Record<string, any>>(
  data: T[],
  schema: ListSchema<T>,
  queryClient: QueryClient
) => {
  return useMemo(() => {
    if (!data?.length) return data;

    // Extract reference columns from schema
    const referenceColumns = Object.entries(schema.columns)
      .filter(([_, col]) => (col as ColumnDefinition<T>).type === "reference")
      .map(([key, col]) => ({
        key,
        field: (col as ColumnDefinition<T>).field,
        config: (col as ColumnDefinition<T>).reference as ReferenceConfig,
      }));

    if (!referenceColumns.length) return data;

    // Build reference lookup maps
    const referenceMaps = new Map<string, Map<any, any>>();

    referenceColumns.forEach(({ config }) => {
      const referenceData = queryClient.getQueryData(config.queryKey) as any[];
      if (referenceData) {
        const lookupMap = new Map();
        referenceData.forEach((item) => {
          const key = item[config.valueField];
          lookupMap.set(key, item);
        });
        referenceMaps.set(config.collection, lookupMap);
      }
    });

    // Enhance data with resolved references
    return data.map((row) => {
      const enhancedRow = { ...row };

      referenceColumns.forEach(({ field, config }) => {
        const referenceId = row[field];
        if (referenceId != null) {
          const lookupMap = referenceMaps.get(config.collection);
          const referencedEntity = lookupMap?.get(referenceId);

          if (referencedEntity) {
            enhancedRow[field] = referencedEntity;
          }
        }
      });

      return enhancedRow;
    });
  }, [data, schema, queryClient]);
};
