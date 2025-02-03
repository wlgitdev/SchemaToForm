import React, { FC, JSX, ReactElement } from 'react';
import { FormProvider, useFormSubmit } from './FormContext';
import { UISchema, UIFieldDefinition } from '../types';
import { FormData } from '../FormStore';
import {
  InputField,
  SelectField,
  CheckboxField,
  MultiSelectField
} from './FormFields';
import { FormSection, GridContainer } from './FormLayout';

interface DynamicFormProps {
  schema: UISchema;
  initialValues?: FormData;
  onSubmit?: (values: FormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

const FieldRenderer: React.FC<{
  name: string;
  field: UIFieldDefinition;
  disabled?: boolean;
}> = ({ name, field, disabled }) => {
  const commonProps = {
    name,
    label: field.label,
    disabled: disabled || field.readOnly,
    className: field.hidden ? 'hidden' : undefined
  };

  switch (field.type) {
    case 'text':
      return (
        <InputField
          {...commonProps}
          type="text"
          placeholder={field.placeholder}
        />
      );

    case 'number':
      return (
        <InputField
          {...commonProps}
          type="number"
          placeholder={field.placeholder}
        />
      );

    case 'date':
      return (
        <InputField
          {...commonProps}
          type="date"
          placeholder={field.placeholder}
        />
      );

    case 'select':
      return (
        <SelectField
          {...commonProps}
          options={field.options || []}
          placeholder={field.placeholder}
        />
      );

    case 'checkbox':
      return <CheckboxField {...commonProps} text={field.placeholder} />;

    case 'multiselect':
      return (
        <MultiSelectField
          {...commonProps}
          options={field.options || []}
          placeholder={field.placeholder}
        />
      );

    default:
      return (
        <div className="text-red-600">Unsupported field type: {field.type}</div>
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
            columns={2} // Default to 2 columns for groups
          >
              {renderFields(group.fields)}
          </FormSection>
        ))}
      </>
    );
  }

  // If no groups are defined, use a single responsive grid
  return (
    <GridContainer columns={2}>
      {renderFields(Object.keys(schema.fields))}
    </GridContainer>
  );
};

export const DynamicForm = ({
  schema,
  initialValues,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  className = "",
}: DynamicFormProps): JSX.Element => {
  const FormContent = (): JSX.Element => {
    const { handleSubmit, isValid, isSubmitting, isDirty } =
      useFormSubmit(onSubmit);

    const disabled = loading || isSubmitting;

    return (
      <form onSubmit={handleSubmit} className={className}>
        <FormFields schema={schema} disabled={disabled} />

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={disabled || !isValid || !isDirty}
            className={`
              px-4 py-2 rounded-md text-white font-medium
              ${
                disabled || !isValid || !isDirty
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
              transition-colors duration-200
            `}
          >
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </form>
    );
  };

  return (
    <FormProvider
      schema={schema}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <FormContent />
    </FormProvider>
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
