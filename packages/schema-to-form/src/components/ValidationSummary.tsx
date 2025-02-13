import React from "react";
import { useForm, useFormTheme } from "../";

interface ValidationSummaryProps {
  submitAttempted?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  submitAttempted = false,
}) => {
  const { state } = useForm();
  const theme = useFormTheme();
  const invalidFields = Object.entries(state.errors)
    .filter(
      ([fieldName, error]) =>
        error && (state.touched[fieldName] || submitAttempted)
    )
    .map(([fieldName, error]) => ({
      fieldName,
      error,
    }));

  if (invalidFields.length === 0) {
    return null;
  }

  return (
    <div
      className={`${theme.banner.container} ${theme.banner.error.container}`}
    >
      <div className={`${theme.banner.title} ${theme.banner.error.title}`}>
        Please fix the following validation errors:
      </div>
      <ul className={`${theme.banner.list} ${theme.banner.error.list}`}>
        {invalidFields.map(({ fieldName, error }) => (
          <li
            key={fieldName}
            className={`${theme.banner.item} ${theme.banner.error.item}`}
          >
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;
