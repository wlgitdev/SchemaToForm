import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicForm, createForm } from '../components/DynamicForm';
import { UISchema } from '../types';

describe('DynamicForm', () => {
  const testSchema: UISchema = {
    fields: {
      name: {
        type: 'text',
        label: 'Name',
        validation: {
          required: true,
          minLength: 2
        }
      },
      age: {
        type: 'number',
        label: 'Age',
        validation: {
          min: 0,
          max: 120
        }
      },
      role: {
        type: 'select',
        label: 'Role',
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'user', label: 'User' }
        ]
      },
      skills: {
        type: 'multiselect',
        label: 'Skills',
        options: [
          { value: 'js', label: 'JavaScript' },
          { value: 'ts', label: 'TypeScript' },
          { value: 'react', label: 'React' }
        ]
      },
      active: {
        type: 'checkbox',
        label: 'Active'
      }
    },
    layout: {
      groups: [
        {
          name: 'basic',
          label: 'Basic Information',
          fields: ['name', 'age']
        },
        {
          name: 'role',
          label: 'Role Information',
          fields: ['role', 'skills', 'active']
        }
      ]
    }
  };

  it('renders all fields from schema', () => {
    render(<DynamicForm schema={testSchema} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Skills')).toBeInTheDocument();
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
  });

  it('renders with initial values', () => {
    const initialValues = {
      name: 'John Doe',
      age: 30,
      role: 'admin',
      skills: ['js', 'react'],
      active: true
    };

    render(<DynamicForm schema={testSchema} initialValues={initialValues} />);

    expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Age')).toHaveValue(30);
    expect(screen.getByLabelText('Role')).toHaveValue('admin');
    expect(screen.getByLabelText('Active')).toBeChecked();
  });

  it('validates required fields', async () => {
    const onSubmit = jest.fn();
    render(<DynamicForm schema={testSchema} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates field constraints', async () => {
    render(<DynamicForm schema={testSchema} />);

    // Test name minimum length
    await userEvent.type(screen.getByLabelText('Name'), 'a');
    fireEvent.blur(screen.getByLabelText('Name'));

    await waitFor(() => {
      expect(
        screen.getByText('Name must be at least 2 characters')
      ).toBeInTheDocument();
    });

    // Test age range
    await userEvent.type(screen.getByLabelText('Age'), '150');
    fireEvent.blur(screen.getByLabelText('Age'));

    await waitFor(() => {
      expect(screen.getByText('Age must be at most 120')).toBeInTheDocument();
    });
  });

  it('handles form submission', async () => {
    const onSubmit = jest.fn();
    render(<DynamicForm schema={testSchema} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Age'), '30');
    await userEvent.selectOptions(screen.getByLabelText('Role'), 'admin');
    fireEvent.click(screen.getByLabelText('Active'));

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        age: 30,
        role: 'admin',
        skills: [],
        active: true
      });
    });
  });

  it('disables form when loading', () => {
    render(<DynamicForm schema={testSchema} loading={true} />);

    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Age')).toBeDisabled();
    expect(screen.getByLabelText('Role')).toBeDisabled();
    expect(screen.getByLabelText('Skills')).toBeDisabled();
    expect(screen.getByLabelText('Active')).toBeDisabled();
    expect(screen.getByText('Submit')).toBeDisabled();
  });

  it('creates form with predefined configuration', () => {
    const UserForm = createForm(testSchema, {
      submitLabel: 'Save User',
      className: 'user-form'
    });

    render(<UserForm />);

    expect(screen.getByText('Save User')).toBeInTheDocument();
    expect(document.querySelector('.user-form')).toBeInTheDocument();
  });

  it('renders groups correctly', () => {
    render(<DynamicForm schema={testSchema} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Role Information')).toBeInTheDocument();

    const basicGroup = screen
      .getByText('Basic Information')
      .closest('fieldset');
    const roleGroup = screen.getByText('Role Information').closest('fieldset');

    expect(basicGroup).toContainElement(screen.getByLabelText('Name'));
    expect(basicGroup).toContainElement(screen.getByLabelText('Age'));
    expect(roleGroup).toContainElement(screen.getByLabelText('Role'));
    expect(roleGroup).toContainElement(screen.getByLabelText('Skills'));
    expect(roleGroup).toContainElement(screen.getByLabelText('Active'));
  });
});
