import React, { FC, JSX, ReactElement } from 'react';
import { FormProvider, useFormSubmit } from './FormContext';
import { UISchema, UIFieldDefinition, FormTheme } from '../types';
import { FormData } from '../FormStore';
import {
  InputField,
  SelectField,
  CheckboxField,
  MultiSelectField
} from './FormFields';
import { FormSection, GridContainer } from './FormLayout';
import { ThemeProvider, useFormTheme } from '../contexts/ThemeContext';

interface DynamicFormProps {
  schema: UISchema;
  initialValues?: FormData;
  onSubmit?: (values: FormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

interface FormContentProps {
  schema: UISchema;
  submitLabel: string;
  loading: boolean;
  className?: string;
  onSubmit?: (values: FormData) => Promise<void>;
}

const FieldRenderer: React.FC<{
  name: string;
  field: UIFieldDefinition;
  disabled?: boolean;
}> = ({ name, field, disabled }) => {
  const theme = useFormTheme();

  const commonProps = {
    name,
    label: field.label,
    disabled: disabled || field.readOnly,
    className: field.hidden ? "hidden" : theme.field.container,
    labelClassName: theme.field.label,
    inputClassName: theme.field.input,
  };

  switch (field.type) {
    case "text":
    case "number":
    case "date":
      return (
        <InputField
          {...commonProps}
          type={field.type}
          placeholder={field.placeholder}
        />
      );

    case "select":
      return (
        <SelectField
          {...commonProps}
          options={field.options || []}
          placeholder={field.placeholder}
          selectClassName={theme.field.select}
        />
      );

    case "checkbox":
      return (
        <CheckboxField
          {...commonProps}
          text={field.placeholder}
          checkboxClassName={theme.field.checkbox.input}
          containerClassName={theme.field.checkbox.container}
          labelClassName={theme.field.checkbox.label}
        />
      );

    case "multiselect":
      return (
        <MultiSelectField
          {...commonProps}
          options={field.options || []}
          placeholder={field.placeholder}
          selectClassName={theme.field.multiselect}
        />
      );

    default:
      return (
        <div className={theme.field.error}>
          Unsupported field type: {field.type}
        </div>
      );
  }
};

const FormFields: React.FC<{
  schema: UISchema;
  disabled?: boolean;
}> = ({ schema, disabled }) => {
  const renderFields = (fields: string[]) => {
    return fields.map(fieldName => {
      const field = schema.fields[fieldName];
      if (!field) return null;

      return (
        <div key={fieldName} className="w-full">
          <FieldRenderer name={fieldName} field={field} disabled={disabled} />
        </div>
      );
    });
  };

  // If there are groups defined in the layout
  if (schema.layout?.groups) {
    return (
      <>
        {schema.layout.groups.map((group, index) => (
          <FormSection
            key={group.name || index}
            title={group.label}
            collapsible={group.collapsible}
            defaultOpen={true}
          >
              {renderFields(group.fields)}
          </FormSection>
        ))}
      </>
    );
  }

  // If no groups are defined, use a single responsive grid
  return (
    <GridContainer>
      {renderFields(Object.keys(schema.fields))}
    </GridContainer>
  );
};

export const DynamicForm = ({
  schema,
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
  className = "",
  theme,
}: DynamicFormProps & { theme?: Partial<FormTheme> }): JSX.Element => {
  const FormContent: React.FC<FormContentProps> = ({
    schema,
    submitLabel,
    loading,
    className,
    onSubmit,
  }) => {
    const { handleSubmit, isValid, isSubmitting, isDirty } =
      useFormSubmit(onSubmit);
    const theme = useFormTheme();

    const disabled = loading || isSubmitting;
    const buttonClassName = `
    ${theme.button?.base || ""}
    ${
      disabled || !isValid || !isDirty
        ? theme.button?.disabled || ""
        : theme.button?.primary || ""
    }
  `;

    return (
      <form
        onSubmit={handleSubmit}
        className={`${theme.form?.container || ""} ${className || ""}`}
      >
        <div className={theme.form?.fieldsContainer || ""}>
          <FormFields schema={schema} disabled={disabled} />
        </div>

        <div className={theme.form?.submitContainer || ""}>
          <button
            type="submit"
            disabled={disabled || !isValid || !isDirty}
            className={buttonClassName}
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      </form>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <FormProvider
        schema={schema}
        initialValues={initialValues}
        onSubmit={onSubmit}
      >
        <FormContent
          schema={schema}
          submitLabel={submitLabel}
          loading={loading}
          className={className}
          onSubmit={onSubmit}
        />
      </FormProvider>
    </ThemeProvider>
  );
};

// Export a helper to create forms with specific configurations
export const createForm = (
  schema: UISchema,
  config?: Omit<DynamicFormProps, 'schema'>
) => {
  return (props: Omit<DynamicFormProps, "schema">): JSX.Element => (
    <DynamicForm schema={schema} {...config} {...props} />
  );
};
