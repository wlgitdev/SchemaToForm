import { QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { UISchema, UIFieldReference } from "../types";

export const useFormReferenceResolver = (
  schema: UISchema,
  queryClient?: QueryClient
): UISchema => {
  return useMemo(() => {
    if (!queryClient) return schema;

    // Find all reference fields in the schema
    const referenceFields = Object.entries(schema.fields).filter(
      ([_, field]) =>
        field.reference &&
        (field.type === "select" || field.type === "multiselect")
    );

    if (!referenceFields.length) return schema;

    // Create a new schema with resolved reference options
    const resolvedFields = { ...schema.fields };

    referenceFields.forEach(([fieldName, field]) => {
      const reference = field.reference as UIFieldReference;

      // Generate query key based on model name
      const queryKey = [`${reference.modelName.toLowerCase()}`];

      // Try to get cached data for this reference
      const referenceData = queryClient.getQueryData(queryKey) as any[];

      if (referenceData && Array.isArray(referenceData)) {
        // Convert reference data to options format
        const options = referenceData.map((item) => ({
          value: item._id || item.id, // Assuming _id for MongoDB or id for other DBs
          label:
            item[reference.displayField] ||
            item.name ||
            String(item._id || item.id),
        }));

        // Update the field with resolved options
        resolvedFields[fieldName] = {
          ...field,
          options,
        };
      }
    });

    return {
      ...schema,
      fields: resolvedFields,
    };
  }, [schema, queryClient]);
};
