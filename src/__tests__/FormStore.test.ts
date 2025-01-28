/**
 * @jest-environment jsdom
 */

import { FormData, FormErrors, FormStore } from "../FormStore";
import { waitFor } from "@testing-library/react";
import { UISchema } from "../types";

describe("FormStore", () => {
  let store: FormStore;

  const testSchema: UISchema = {
    fields: {
      name: {
        type: "text",
        label: "Name",
        validation: {
          required: true,
          minLength: 2,
        },
      },
      age: {
        type: "number",
        label: "Age",
        validation: {
          min: 0,
          max: 120,
        },
      },
      email: {
        type: "text",
        label: "Email",
        validation: {
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          patternMessage: "Invalid email format",
        },
      },
      skills: {
        type: "multiselect",
        label: "Skills",
        options: [
          { value: "js", label: "JavaScript" },
          { value: "ts", label: "TypeScript" },
          { value: "py", label: "Python" },
        ],
      },
    },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    store = new FormStore(testSchema);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("Subscription Management", () => {
    it("should unsubscribe form subscriber", () => {
      const subscriber = jest.fn();
      const unsubscribe = store.subscribe(subscriber);

      // Initial call
      expect(subscriber).toHaveBeenCalledTimes(1);

      store.setFieldValue("name", "John");
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
      store.setFieldValue("name", "Jane");
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it("should unsubscribe field subscriber", () => {
      const subscriber = jest.fn();
      const unsubscribe = store.subscribeToField("name", subscriber);

      // Initial call
      expect(subscriber).toHaveBeenCalledTimes(1);

      store.setFieldValue("name", "John");
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
      store.setFieldValue("name", "Jane");
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });

  describe("Form Reset", () => {
    it("should reset form to initial state", () => {
      store.setFieldValue("name", "John");
      store.setFieldValue("age", 30);

      store.reset();
      const state = store.getState();

      expect(state.values).toEqual({
        name: null,
        age: null,
        email: null,
        skills: null,
      });
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toBe(false);
    });

    it("should reset form to provided values", () => {
      const resetValues = {
        name: "Jane",
        age: 25,
        email: "jane@example.com",
        skills: ["js", "ts"],
      };

      store.reset(resetValues);
      const state = store.getState();

      expect(state.values).toEqual(resetValues);
      expect(state.errors).toEqual({});
      expect(state.touched).toEqual({});
      expect(state.dirty).toBe(false);
    });
  });

  describe("Custom Validation", () => {
    // it('should handle custom field validation', async () => {
    //   expect.assertions(1);

    //   // Create a promise that resolves when validation is complete
    //   let validationDone = false;
    //   const validationComplete = new Promise<void>(resolve => {
    //     store.subscribe(state => {
    //       if (
    //         state.errors.name === 'Custom validation failed' &&
    //         !validationDone
    //       ) {
    //         validationDone = true;
    //         resolve();
    //       }
    //     });
    //   });

    //   // Create validator
    //   const customValidator = async (value: FieldValue) => {
    //     if (value === 'invalid') return 'Custom validation failed';
    //     return null;
    //   };

    //   // Set up validator and trigger validation
    //   await store.setFieldValidator('name', customValidator);
    //   await store.setFieldValue('name', 'invalid');

    //   // Advance timers and wait for validation
    //   jest.advanceTimersByTime(200);
    //   await validationComplete;

    //   // Check the result
    //   const state = store.getState();
    //   expect(state.errors.name).toBe('Custom validation failed');
    // });

    it("should handle form-level validation", async () => {
      expect.assertions(1);

      // Create a promise that resolves when validation is complete
      let validationDone = false;
      const validationComplete = new Promise<void>((resolve) => {
        store.subscribe((state) => {
          if (
            state.errors.email === "Email required for users under 18" &&
            !validationDone
          ) {
            validationDone = true;
            resolve();
          }
        });
      });

      const formValidator = async (values: FormData): Promise<FormErrors> => {
        const errors: FormErrors = {};
        if (values.age && (values.age as number) < 18 && !values.email) {
          errors.email = "Email required for users under 18";
        }
        return errors;
      };

      // Set up validator and trigger validation
      await store.setFormValidator(formValidator);
      await store.setValues({
        age: 16,
        email: "",
      });

      // Advance timers and wait for validation
      jest.advanceTimersByTime(200);
      await validationComplete;

      // Check the result
      const state = store.getState();
      expect(state.errors.email).toBe("Email required for users under 18");
    });
  });

  describe("Subscription Management", () => {
    it("should unsubscribe field subscriber", async () => {
      const subscriber = jest.fn();
      const unsubscribe = store.subscribeToField("name", subscriber);

      // Initial call
      expect(subscriber).toHaveBeenCalledTimes(1);

      store.setFieldValue("name", "John");
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
      store.setFieldValue("name", "Jane");
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should debounce validation calls", async () => {
      const validationSpy = jest.spyOn(store as any, "validateField");

      store.setFieldValue("name", "J");
      store.setFieldValue("name", "Jo");
      store.setFieldValue("name", "John");

      expect(validationSpy).toHaveBeenCalledTimes(3);

      // Wait for debounced validation
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve(); // Additional tick for validation promise

      const state = store.getState();
      expect(state.errors.name).toBeNull();
    });
  });

  describe("FormStore Reference Data", () => {
    const mockReferenceLoader = jest.fn();
    const mockSchema: UISchema = {
      fields: {
        category: {
          type: "select",
          label: "Category",
          reference: {
            modelName: "Category",
            displayField: "name",
          },
        },
      },
    };

    beforeEach(() => {
      mockReferenceLoader.mockReset();
    });

    it("loads reference data on initialization", async () => {
      mockReferenceLoader.mockResolvedValueOnce([
        { _id: "1", name: "Category 1" },
        { _id: "2", name: "Category 2" },
      ]);

      const store = new FormStore(mockSchema, {}, mockReferenceLoader);

      await waitFor(() => {
        expect(mockReferenceLoader).toHaveBeenCalledWith("Category");
        expect(store.getReferenceData("category")).toEqual([
          { value: "1", label: "Category 1" },
          { value: "2", label: "Category 2" },
        ]);
      });
    });

    it("handles reference loading states correctly", async () => {
      mockReferenceLoader.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const store = new FormStore(mockSchema, {}, mockReferenceLoader);

      expect(store.isReferenceLoading("category")).toBe(true);

      await waitFor(() => {
        expect(store.isReferenceLoading("category")).toBe(false);
      });
    });

    it("handles reference loading errors gracefully", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();
      mockReferenceLoader.mockRejectedValueOnce(new Error("Failed to load"));

      const store = new FormStore(mockSchema, {}, mockReferenceLoader);

      await waitFor(() => {
        expect(store.isReferenceLoading("category")).toBe(false);
        expect(store.getReferenceData("category")).toBeUndefined();
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
