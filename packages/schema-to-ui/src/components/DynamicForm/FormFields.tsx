import React, { useCallback, useMemo } from 'react';
import { FieldTransformer, UIFieldDefinition, useField, useForm, useFormTheme } from '../..';

interface BaseFieldProps {
  name: string;
  label: string;
  disabled?: boolean;
  required?: boolean;
  field: UIFieldDefinition;
}

const FieldLabel: React.FC<BaseFieldProps> = ({ name, label, required }) => {
  const theme = useFormTheme();

  return (
    <div className={theme.field.labelGroup}>
      <label htmlFor={name} className={theme.field.label}>
      {label}
      </label>
      {required && (
        <span className={theme.field.required} aria-hidden="true">
          *
        </span>
      )}
    </div>
  );
};

interface FieldWrapperProps extends BaseFieldProps {
  error?: string | null;
  touched?: boolean;
  children: React.ReactNode;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  name,
  label,
  error,
  touched,
  children,
  required,
  field
}) => {
  const theme = useFormTheme();

    return (
    <div className={theme.field.container}>
      <FieldLabel name={name} label={label} required={required} field={field}/>
      {children}
      {touched && error && (
        <p className={theme.field.error} id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "number" | "email" | "password" | "date";
  placeholder?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  disabled = false,
  required,
  field,
}) => {
  const { value, touched, setValue } = useField(name);
  const theme = useFormTheme();

  const transformer = useMemo(() => new FieldTransformer(field), [field]);
  const displayValue = useMemo(
    () => transformer.toDisplay(value),
    [transformer, value]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(transformer.fromDisplay(e.target.value));
    },
    [setValue, transformer]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      touched={touched}
      required={required}
      field={field}
    >
      <input
        id={name}
        name={name}
        type={type}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={theme.field.input}
        aria-required={required}
      />
    </FieldWrapper>
  );
};

// Select Field
interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  options,
  placeholder,
  disabled = false,
  required,
  field,
}) => {
  const { value, touched, setValue } = useField(name);
  const { getReferenceData, isReferenceLoading } = useForm();
  const theme = useFormTheme();

  const transformer = useMemo(() => new FieldTransformer(field), [field]);
  const displayValue = useMemo(
    () => transformer.toDisplay(value),
    [transformer, value]
  );

  const referenceData = getReferenceData(name);
  const loading = isReferenceLoading(name);
  const fieldOptions = referenceData || options;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(transformer.fromDisplay(e.target.value));
    },
    [setValue, transformer]
  );

  if (loading) {
    return (
      <FieldWrapper name={name} label={label} required={required} field={field}>
        <select disabled className={theme.field.select}>
          <option>Loading...</option>
        </select>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper
      name={name}
      label={label}
      touched={touched}
      required={required}
      field={field}
    >
      <select
        id={name}
        name={name}
        value={value as string}
        onChange={handleChange}
        disabled={disabled}
        className={theme.field.select}
        aria-required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {fieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};

// Checkbox Field
interface CheckboxFieldProps extends BaseFieldProps {
  text?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  text,
  disabled = false,
  required,
  field,
}) => {
  const { value, touched, setValue } = useField(name);
  const theme = useFormTheme();

  const transformer = useMemo(() => new FieldTransformer(field), [field]);
  const displayValue = useMemo(
    () => transformer.toDisplay(value),
    [transformer, value]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(transformer.fromDisplay(e.target.checked));
    },
    [setValue, transformer]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      touched={touched}
      required={required}
      field={field}
    >
      <div className={theme.field.checkbox.container}>
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className={theme.field.checkbox.input}
          aria-required={required}
        />
        {text && (
          <label htmlFor={name} className={theme.field.checkbox.label}>
            {text}
          </label>
        )}
      </div>
    </FieldWrapper>
  );
};

// Radio Group Field
interface RadioGroupFieldProps extends BaseFieldProps {
  options: SelectOption[];
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  name,
  label,
  options,
  disabled = false,
  required,
  field
}) => {
  const { value, touched, setValue } = useField(name);
  const theme = useFormTheme();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [setValue]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      touched={touched}
      required={required}
      field={field}
    >
      <div className={theme.field.radio.group}>
        {options.map((option) => (
          <div key={option.value} className={theme.field.radio.container}>
            <input
              id={`${name}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled}
              className={theme.field.radio.input}
              aria-required={required}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className={theme.field.radio.label}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </FieldWrapper>
  );
};

// Multi-select Field
interface MultiSelectFieldProps extends SelectFieldProps {
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  name,
  label,
  options,
  placeholder,
  disabled = false,
  required,
  field,
}) => {
  const { value, touched, setValue } = useField(name);
  const theme = useFormTheme();

  const transformer = useMemo(() => new FieldTransformer(field), [field]);
  const displayValue = useMemo(
    () => transformer.toDisplay(value),
    [transformer, value]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );
      setValue(transformer.fromDisplay(selectedOptions));
    },
    [setValue, transformer]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      touched={touched}
      required={required}
      field={field}
    >
      <select
        id={name}
        name={name}
        multiple
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        className={theme.field.multiselect}
        aria-required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
};
