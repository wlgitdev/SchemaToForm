import React, { JSX } from "react";
import { QueryClient } from "@tanstack/react-query";
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
  useFormReferenceResolver,
} from "../..";
import ValidationSummary from "./ValidationSummary";

const FieldRenderer: React.FC<{
  name: string;
  field: UIFieldDefinition;
  disabled?: boolean;
}> = ({ name, field, disabled }) => {
  const theme = useFormTheme();
  const { state } = useForm();

  if (field.hidden) {
    return null;
  }

  const commonProps = {
    name,
    label: field.label,
    disabled: disabled || field.readOnly,
    error: state.touched[name] ? state.errors[name] : undefined,
    required: field.validation?.required,
    field,
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
      return <CheckboxField {...commonProps} text={field.placeholder} />;

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
          Unsupported field type: {field.label} / {field.type}
        </div>
      );
  }
};

const FormFields: React.FC<{
  schema: UISchema;
  disabled?: boolean;
  queryClient?: QueryClient;
}> = ({ schema, disabled, queryClient }) => {
  const { state } = useForm();
  const [effectsCache, setEffectsCache] = React.useState<
    Map<string, FieldEffect>
  >(new Map());

  // Resolve reference field options using cached query data
  const resolvedSchema = useFormReferenceResolver(schema, queryClient);

  // Initialize dependency handler with resolved schema
  const dependencyHandler = React.useMemo(
    () => new DependencyHandler(resolvedSchema.fields),
    [resolvedSchema]
  );

  // Evaluate all field dependencies and cache the results
  React.useEffect(() => {
    const newEffects = new Map<string, FieldEffect>();

    // Evaluate dependencies for all fields
    Object.keys(resolvedSchema.fields).forEach((fieldName) => {
      const fieldEffects = dependencyHandler.evaluateDependencies(
        fieldName,
        state.values
      );
      fieldEffects.forEach((effect, targetField) => {
        newEffects.set(targetField, effect);
      });
    });

    setEffectsCache(newEffects);
  }, [resolvedSchema, state.values, dependencyHandler]);

  const renderFields = (fields: string[]) => {
    return fields.map((fieldName) => {
      const field = resolvedSchema.fields[fieldName];
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
  if (resolvedSchema.layout?.groups) {
    return (
      <>
        {resolvedSchema.layout.groups.map((group, index) => (
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
      {renderFields(Object.keys(resolvedSchema.fields))}
    </GridContainer>
  );
};

interface FormContentProps {
  schema: UISchema;
  submitLabel: string;
  loading: boolean;
  className?: string;
  onSubmit?: (values: FormData) => Promise<void>;
  validateBeforeSubmit?: boolean;
  queryClient?: QueryClient;
}

const FormContent: React.FC<FormContentProps> = ({
  schema,
  submitLabel,
  loading,
  className,
  onSubmit,
  validateBeforeSubmit = true,
  queryClient,
}) => {
  const [submitAttempted, setSubmitAttempted] = React.useState(false);
  const {
    handleSubmit: originalHandleSubmit,
    isSubmitting,
    isDirty,
    isValid,
  } = useFormSubmit(onSubmit, validateBeforeSubmit);
  const theme = useFormTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    setSubmitAttempted(true);
    await originalHandleSubmit(e);
  };

  const formDisabled = loading || isSubmitting;
  const submitDisabled =
    formDisabled || !isDirty || (validateBeforeSubmit && !isValid);

  return (
    <form
      onSubmit={handleSubmit}
      className={`${theme.form?.container || ""} ${className || ""}`}
      noValidate
    >
      <div className={theme.form?.fieldsContainer || ""}>
        <FormFields
          schema={schema}
          disabled={formDisabled}
          queryClient={queryClient}
        />
      </div>

      <div className={theme.form?.submitContainer || ""}>
        <button
          type="submit"
          disabled={submitDisabled}
          className={`${theme.button?.base || ""} ${
            submitDisabled
              ? theme.button?.disabled || ""
              : theme.button?.primary || ""
          }`}
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
      {validateBeforeSubmit && (
        <ValidationSummary submitAttempted={submitAttempted} />
      )}
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
  theme?: Partial<FormTheme>;
  validateBeforeSubmit?: boolean;
  queryClient?: QueryClient;
}

export const DynamicForm = ({
  schema,
  initialValues,
  onSubmit,
  submitLabel = "Submit",
  loading = false,
  className = "",
  theme,
  validateBeforeSubmit = true,
  queryClient,
}: DynamicFormProps): JSX.Element => {
  return (
    <ThemeProvider theme={theme}>
      <FormProvider
        schema={schema}
        initialValues={initialValues}
        onSubmit={onSubmit}
        validateBeforeSubmit={validateBeforeSubmit}
      >
        <FormContent
          schema={schema}
          submitLabel={submitLabel}
          loading={loading}
          className={className}
          onSubmit={onSubmit}
          validateBeforeSubmit={validateBeforeSubmit}
          queryClient={queryClient}
        />
      </FormProvider>
    </ThemeProvider>
  );
};
