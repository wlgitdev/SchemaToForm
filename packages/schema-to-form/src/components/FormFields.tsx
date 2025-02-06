import React, { useCallback } from 'react';
import { useField, useForm, useFormTheme } from '../';

interface FieldWrapperProps extends BaseFieldProps {
  error?: string | null;
  touched?: boolean;
  children: React.ReactNode;
  required?: boolean;
}

interface FieldLabelProps {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
}

const FieldLabel: React.FC<FieldLabelProps> = ({
  name,
  label,
  required,
  className,
}) => {
  const theme = useFormTheme();

  return (
    <div className={theme.field.labelGroup}>
      <label htmlFor={name} className={className || theme.field.label}>
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


interface BaseFieldProps {
  name: string;
  label: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  required?: boolean;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({
  name,
  label,
  error,
  touched,
  children,
  className = "",
  required,
}) => {
  const theme = useFormTheme();
    return (
      <div className={`field-wrapper ${className}`}>
      <FieldLabel
        name={name}
        label={label}
        required={required}
        className={theme.field.label}
      />
      {children}
      {touched && error && (
        <p className={theme.field.error} id={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
    )
};

// Input Field
export interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'number' | 'email' | 'password' | 'date';
  placeholder?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  className = '',
  disabled = false,
  required,
  inputClassName
}) => {
  const { value, error, touched, setValue } = useField(name);
  const theme = useFormTheme();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue =
        type === 'number' ? Number(e.target.value) : e.target.value;
      setValue(newValue);
    },
    [setValue, type]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      error={error}
      touched={touched}
      className={className}
      required={required}
    >
      <input
        id={name}
        name={name}
        type={type}
        value={value as string}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName || theme.field.input}
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

export interface SelectFieldProps extends BaseFieldProps {
  options: SelectOption[];
  placeholder?: string;
  selectClassName?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  options,
  placeholder,
  className = '',
  disabled = false,
  required,
  selectClassName
}) => {
  const { value, error, touched, setValue } = useField(name);
  const { getReferenceData, isReferenceLoading } = useForm();
  const theme = useFormTheme();

  const referenceData = getReferenceData(name);
  const loading = isReferenceLoading(name);
  const fieldOptions = referenceData || options;

  if (loading) {
    return (
      <FieldWrapper name={name} label={label} className={className}>
        <select disabled className="loading-select">
          <option>Loading...</option>
        </select>
      </FieldWrapper>
    );
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(e.target.value);
    },
    [setValue]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      error={error}
      touched={touched}
      className={className}
      required={required}
    >
      <select
        id={name}
        name={name}
        value={value as string}
        onChange={handleChange}
        disabled={disabled}
        className={selectClassName || theme.field.select}
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
  checkboxClassName?: string;
  containerClassName?: string;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  text,
  className = '',
  disabled = false
}) => {
  const { value, error, touched, setValue } = useField(name);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.checked);
    },
    [setValue]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      error={error}
      touched={touched}
      className={className}
    >
      <div className="flex items-center">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={value as boolean}
          onChange={handleChange}
          disabled={disabled}
          className={`h-4 w-4 rounded border-gray-300 text-blue-600
            focus:ring-blue-500 ${disabled ? 'bg-gray-100' : ''}`}
        />
        {text && (
          <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
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
  className = '',
  disabled = false
}) => {
  const { value, error, touched, setValue } = useField(name);

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
      error={error}
      touched={touched}
      className={className}
    >
      <div className="space-y-2">
        {options.map(option => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${name}-${option.value}`}
              name={name}
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled}
              className={`h-4 w-4 border-gray-300 text-blue-600
                focus:ring-blue-500 ${disabled ? 'bg-gray-100' : ''}`}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className="ml-2 block text-sm text-gray-900"
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
  options: SelectOption[];
  placeholder?: string;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  name,
  label,
  options,
  placeholder,
  className = '',
  disabled = false
}) => {
  const { value, error, touched, setValue } = useField(name);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        option => option.value
      );
      setValue(selectedOptions);
    },
    [setValue]
  );

  return (
    <FieldWrapper
      name={name}
      label={label}
      error={error}
      touched={touched}
      className={className}
    >
      <select
        id={name}
        name={name}
        multiple
        value={value as string[]}
        onChange={handleChange}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm
          focus:border-blue-500 focus:ring-blue-500 sm:text-sm
          ${error ? "border-red-300" : "border-gray-300"}
          ${disabled ? "bg-gray-100" : ""}`}
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
