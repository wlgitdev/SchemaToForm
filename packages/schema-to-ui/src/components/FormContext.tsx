import React, { createContext, JSX, useContext, useEffect, useMemo } from 'react';
import { FormStore, FormState, FieldValue, FormData, UISchema } from '..';

interface FormContextValue {
  state: FormState;
  setFieldValue: (field: string, value: FieldValue) => Promise<void>;
  setValues: (values: Partial<FormData>) => void;
  reset: (values?: FormData) => void;
  getReferenceData: (
    field: string
  ) => Array<{ value: string; label: string }> | undefined;
  isReferenceLoading: (field: string) => boolean;
  submitForm?: (values: FormData) => Promise<void>;
  validateForm: () => boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

interface FormProviderProps {
  schema: UISchema;
  initialValues?: FormData;
  children: React.ReactNode;
  onSubmit?: (values: FormData) => Promise<void>;
  validateBeforeSubmit?: boolean;
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
      getReferenceData: store.getReferenceData.bind(store),
      isReferenceLoading: store.isReferenceLoading.bind(store),
      submitForm: onSubmit,
      validateForm: store.validateForm.bind(store),
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
  const touched = state.touched[name];
  const error = state.errors[name];

  const setValue = async (newValue: FieldValue) => {
    await setFieldValue(name, newValue);
  };

  return {
    value,
    touched,
    error,
    setValue,
  };
};

export const useFormSubmit = (
  onSubmit?: (values: FormData) => Promise<void>,
  validateBeforeSubmit: boolean = true
) => {
  const { state, validateForm } = useForm();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onSubmit) {
      console.warn("No onSubmit handler provided");
      return;
    }

    if (validateBeforeSubmit && !validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);    
      await onSubmit(state.values);
  } catch (error) {
      console.error("Error submitting form:", error);
  } finally {
      setIsSubmitting(false);
  }
  };

  return {
    handleSubmit,
    isSubmitting,
    isDirty: state.dirty,
    isValid: state.isValid,
  };
};

// Type guard for checking field existence in schema
export const hasField = (schema: UISchema, field: string): boolean => {
  return field in schema.fields;
};
