import { FieldStore } from '../FieldStore';
import { UIFieldDefinition } from '../types';

describe('FieldStore', () => {
  let store: FieldStore;

  const textFieldDef: UIFieldDefinition = {
    type: 'text',
    label: 'Text Field',
    validation: {
      required: true,
      minLength: 2
    }
  };

  const numberFieldDef: UIFieldDefinition = {
    type: 'number',
    label: 'Number Field',
    validation: {
      min: 0,
      max: 100
    }
  };

  const selectFieldDef: UIFieldDefinition = {
    type: 'select',
    label: 'Select Field',
    options: [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' }
    ]
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with default values based on field type', () => {
      const textStore = new FieldStore(textFieldDef);
      expect(textStore.getState().value).toBe('');

      const numberStore = new FieldStore(numberFieldDef);
      expect(numberStore.getState().value).toBe(0);

      const selectStore = new FieldStore(selectFieldDef);
      expect(selectStore.getState().value).toBe('');
    });

    it('should initialize with provided value', () => {
      store = new FieldStore(textFieldDef, 'initial');
      const state = store.getState();
      expect(state.value).toBe('initial');
      expect(state.touched).toBe(false);
      expect(state.dirty).toBe(false);
    });
  });

  describe('Value Management', () => {
    beforeEach(() => {
      store = new FieldStore(textFieldDef);
    });

    it('should update value and mark field as touched and dirty', () => {
      store.setValue('new value');
      const state = store.getState();
      expect(state.value).toBe('new value');
      expect(state.touched).toBe(true);
      expect(state.dirty).toBe(true);
    });

    it('should handle null values', () => {
      store.setValue(null);
      const state = store.getState();
      expect(state.value).toBe(null);
    });

    it('should reset field state', () => {
      store.setValue('value');
      store.reset();
      const state = store.getState();
      expect(state.value).toBe('');
      expect(state.touched).toBe(false);
      expect(state.dirty).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should reset to provided value', () => {
      store.setValue('value');
      store.reset('new value');
      expect(store.getState().value).toBe('new value');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      store = new FieldStore(textFieldDef);
    });

    it('should handle async validation', async () => {
      const validator = jest.fn().mockImplementation(async (value: string) => {
        if (!value) return 'Field is required';
        if (value.length < 2) return 'Minimum length is 2';
        return null;
      });

      store.setValidator(validator);
      store.setValue('');

      jest.advanceTimersByTime(250);
      await Promise.resolve();

      expect(store.getState().error).toBe('Field is required');
    });

    it('should debounce validation calls', () => {
      const validator = jest.fn().mockResolvedValue(null);
      store.setValidator(validator);

      store.setValue('a');
      store.setValue('ab');
      store.setValue('abc');

      expect(validator).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);

      expect(validator).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledWith('abc');
    });

    it('should handle validation errors', async () => {
      const validator = jest
        .fn()
        .mockRejectedValue(new Error('Validation failed'));
      store.setValidator(validator);

      store.setValue('test');

      jest.advanceTimersByTime(250);
      await Promise.resolve();

      expect(store.getState().error).toBe('Validation failed');
    });
  });

  describe('Dependencies', () => {
    const dependentFieldDef: UIFieldDefinition = {
      type: 'text',
      label: 'Dependent Field',
      dependencies: [
        {
          field: 'controlField',
          operator: 'equals',
          value: 'show',
          effect: {
            hide: false
          }
        },
        {
          field: 'valueField',
          operator: 'equals',
          value: 'set',
          effect: {
            setValue: 'predetermined'
          }
        }
      ]
    };

    beforeEach(() => {
      store = new FieldStore(dependentFieldDef);
    });

    it('should track dependency fields', () => {
      const dependencies = store.getDependencyFields();
      expect(dependencies.has('controlField')).toBe(true);
      expect(dependencies.has('valueField')).toBe(true);
    });

    it('should update based on dependencies', () => {
      store.updateFromDependencies({
        controlField: 'show',
        valueField: 'set'
      });

      const state = store.getState();
      expect(state.dependent).toBe(true);
      expect(state.value).toBe('predetermined');
    });

    it('should handle multiple dependency rules', () => {
      store.updateFromDependencies({
        controlField: 'hide',
        valueField: 'set'
      });

      expect(store.getState().value).toBe('predetermined');

      store.updateFromDependencies({
        controlField: 'show',
        valueField: 'other'
      });

      expect(store.getState().dependent).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      store = new FieldStore(textFieldDef);
    });

    it('should notify subscribers of state changes', () => {
      const subscriber = jest.fn();
      store.subscribe(subscriber);

      // Initial notification
      expect(subscriber).toHaveBeenCalledTimes(1);

      store.setValue('new value');
      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          value: 'new value',
          touched: true,
          dirty: true
        })
      );
    });

    it('should handle multiple subscribers', () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      store.subscribe(subscriber1);
      store.subscribe(subscriber2);

      store.setValue('test');

      expect(subscriber1).toHaveBeenCalledTimes(2);
      expect(subscriber2).toHaveBeenCalledTimes(2);
    });

    it('should allow unsubscribing', () => {
      const subscriber = jest.fn();
      const unsubscribe = store.subscribe(subscriber);

      store.setValue('first');
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubscribe();

      store.setValue('second');
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });
});
