import React, { createContext, JSX, useContext, useEffect, useMemo } from 'react';
import { FormStore, FormState, FieldValue, FormData } from '../FormStore';
import { UISchema } from '../types';

interface FormContextValue {
  state: FormState;
  setFieldValue: (field: string, value: FieldValue) => Promise<void>;
  setValues: (values: Partial<FormData>) => void;
  reset: (values?: FormData) => void;
  validate: () => Promise<boolean>;
  getReferenceData: (
    field: string
  ) => Array<{ value: string; label: string }> | undefined;
  isReferenceLoading: (field: string) => boolean;
  submitForm?: (values: FormData) => Promise<void>;
}

const FormContext = createContext<FormContextValue | null>(null);

interface FormProviderProps {
  schema: UISchema;
  initialValues?: FormData;
  children: React.ReactNode;
  onSubmit?: (values: FormData) => Promise<void>;
}

export const FormProvider = ({
  schema,
  initialValues,
  children,
  onSubmit
}: FormProviderProps): JSX.Element => {
  const store = useMemo(() => new FormStore(schema, initialValues), [schema]);
  const [state, setState] = React.useState<FormState>(store.getState());

  useEffect(() => {
    return store.subscribe(newState => {
      setState(newState);
    });
  }, [store]);

  const contextValue = useMemo(
    () => ({
      state,
      setFieldValue: store.setFieldValue.bind(store),
      setValues: store.setValues.bind(store),
      reset: store.reset.bind(store),
      validate: store.validate.bind(store),
      getReferenceData: store.getReferenceData.bind(store),
      isReferenceLoading: store.isReferenceLoading.bind(store),
      submitForm: onSubmit,
    }),
    [state, store, onSubmit]
  );

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
};

// Custom hooks for consuming form context
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

export const useField = (name: string) => {
  const { state, setFieldValue } = useForm();
  const value = state.values[name];
  const error = state.errors[name];
  const touched = state.touched[name];

  const setValue = async (newValue: FieldValue) => {
    await setFieldValue(name, newValue);
  };

  return {
    value,
    error,
    touched,
    setValue
  };
};

export const useFormSubmit = (
  onSubmit?: (values: FormData) => Promise<void>
) => {
  const { state, validate } = useForm();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onSubmit) {
      console.warn("No onSubmit handler provided");
      return;
    }

    try {
      setIsSubmitting(true);
    const isValid = await validate();
    if (isValid) {
      await onSubmit(state.values);
    }
  } catch (error) {
      console.error("Error submitting form:", error);
  } finally {
      setIsSubmitting(false);
  }
  };

  return {
    handleSubmit,
    isValid: state.valid,
    isSubmitting,
    isDirty: state.dirty,
  };
};

// Type guard for checking field existence in schema
export const hasField = (schema: UISchema, field: string): boolean => {
  return field in schema.fields;
};
