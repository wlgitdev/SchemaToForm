import React, { JSX } from "react";
import {
  FormProvider,
  useForm,
  useFormSubmit,
  UISchema,
  UIFieldDefinition,
  FormTheme,
  FieldEffect,
  FormData,
  InputField,
  SelectField,
  CheckboxField,
  MultiSelectField,
  FormSection,
  GridContainer,
  useFormTheme,
  DependencyHandler,
  ThemeProvider,
} from "../";

const FieldRenderer: React.FC<{
  name: string;
  field: UIFieldDefinition;
  disabled?: boolean;
}> = ({ name, field, disabled }) => {
  const theme = useFormTheme();

  if (field.hidden) {
    return null;
  }

  const commonProps = {
    name,
    label: field.label,
    disabled: disabled || field.readOnly,
    className: theme.field.container,
    labelClassName: theme.field.label,
    inputClassName: theme.field.input,
    field:  field,
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
        />
      );

    case "checkbox":
      return (
        <CheckboxField
          {...commonProps}
          text={field.placeholder}
        />
      );

    case "multiselect":
      return (
        <MultiSelectField
          {...commonProps}
          options={field.options || []}
          placeholder={field.placeholder}
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
  const { state } = useForm();
  const [effectsCache, setEffectsCache] = React.useState<
    Map<string, FieldEffect>
  >(new Map());

  // Initialize dependency handler
  const dependencyHandler = React.useMemo(
    () => new DependencyHandler(schema.fields),
    [schema]
  );

  // Evaluate all field dependencies and cache the results
  React.useEffect(() => {
    const newEffects = new Map<string, FieldEffect>();

    // Evaluate dependencies for all fields
    Object.keys(schema.fields).forEach((fieldName) => {
      const fieldEffects = dependencyHandler.evaluateDependencies(
        fieldName,
        state.values
      );
      fieldEffects.forEach((effect, targetField) => {
        newEffects.set(targetField, effect);
      });
    });

    setEffectsCache(newEffects);
  }, [schema, state.values, dependencyHandler]);

  const renderFields = (fields: string[]) => {
    return fields.map((fieldName) => {
      const field = schema.fields[fieldName];
      if (!field) return null;

      // Get any effects that apply to this field
      const fieldEffect = effectsCache.get(fieldName);

      // Check if field should be hidden based on dependency effects
      if (fieldEffect?.hide) {
        return null;
      }

      // Handle options and optionGroups separately
      let fieldOptions = field.options;
      if (fieldEffect?.setOptions) {
        fieldOptions = fieldEffect.setOptions;
      } else if (fieldEffect?.setOptionGroups) {
        fieldOptions = fieldEffect.setOptionGroups.flatMap(
          (group) => group.options
        );
      }

      const modifiedField: UIFieldDefinition = {
        ...field,
        readOnly: fieldEffect?.disable || field.readOnly,
        options: fieldOptions,
        optionGroups: fieldEffect?.setOptionGroups || field.optionGroups,
      };

      return (
        <div key={fieldName} className="w-full">
          <FieldRenderer
            name={fieldName}
            field={modifiedField}
            disabled={disabled || modifiedField.readOnly}
          />
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
    <GridContainer>{renderFields(Object.keys(schema.fields))}</GridContainer>
  );
};

interface FormContentProps {
  schema: UISchema;
  submitLabel: string;
  loading: boolean;
  className?: string;
  onSubmit?: (values: FormData) => Promise<void>;
}

const FormContent: React.FC<FormContentProps> = ({
  schema,
  submitLabel,
  loading,
  className,
  onSubmit,
}) => {
  const { handleSubmit, isSubmitting, isDirty } =
    useFormSubmit(onSubmit);
  const theme = useFormTheme();

  const formDisabled = loading || isSubmitting;
  const buttonClassName = `
    ${theme.button?.base || ""}
    ${
      formDisabled || !isDirty
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
        <FormFields schema={schema} disabled={formDisabled} />
      </div>

      <div className={theme.form?.submitContainer || ""}>
        <button
          type="submit"
          disabled={formDisabled || !isDirty}
          className={buttonClassName}
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
};



interface DynamicFormProps {
  schema: UISchema;
  initialValues?: FormData;
  onSubmit?: (values: FormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

export const DynamicForm = ({
  schema,
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
  className = "",
  theme,
}: DynamicFormProps & { theme?: Partial<FormTheme> }): JSX.Element => {
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
