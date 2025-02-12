export interface FormTheme {
  form: {
    container: string;
    fieldsContainer: string;
    submitContainer: string;
  };
  field: {
    container: string;
    label: string;
    required: string;
    labelGroup: string;
    input: string;
    select: string;
    checkbox: {
      container: string;
      input: string;
      label: string;
    };
    radio: {
      group: string;
      container: string;
      input: string;
      label: string;
    };
    multiselect: string;
    error: string;
  };
  section: {
    container: string;
    header: string;
    title: string;
    content: string;
    collapsible: {
      container: string;
      button: string;
      icon: string;
      iconOpen: string;
      content: string;
    };
  };
  button: {
    base: string;
    primary: string;
    disabled: string;
  };
  grid: {
    container: string;
    item: string;
  };
}
