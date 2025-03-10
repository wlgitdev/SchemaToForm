# Schema Adapter Examples

```typescript
import { Schema } from "mongoose";
import { MongooseSchemaAdapter } from "./MongooseSchemaAdapter";

// Sample Mongoose schema for a User model
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  isActive: { type: Boolean, default: true },
  hireDate: { type: Date },
  salary: { type: Number }
});

// Add a virtual property
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Add a boolean virtual property
userSchema.virtual('isVeteran').get(function() {
  return this.yearsOfService > 10;
});

// Create an adapter instance
const adapter = new MongooseSchemaAdapter();

// Generate form schema
const formSchema = adapter.toUISchema(userSchema, {
  excludeFields: ['__v', 'password'],
  readOnlyFields: ['email'],
  groups: [
    { name: 'basic', label: 'Basic Information', fields: ['name', 'email', 'role'] },
    { name: 'work', label: 'Work Details', fields: ['department', 'skills', 'hireDate', 'salary'] },
    { name: 'account', label: 'Account Status', fields: ['isActive'] }
  ]
});

// Generate list schema
const listSchema = adapter.toListSchema(userSchema, {
  excludeFields: ['__v', 'password'],
  sortableFields: ['name', 'hireDate', 'salary', 'role'],
  visibleFields: ['name', 'email', 'role', 'department', 'isActive', 'hireDate', 'salary'],
  defaultGroupBy: 'department',
  enableSelection: true,
  selectionType: 'multi',
  pageSize: 15
});

// Example usage in a component
const UserForm = () => {
  return (
    <DynamicForm 
      schema={formSchema}
      initialValues={{}}
      onSubmit={async (values) => {
        // Handle form submission
        console.log(values);
      }}
      submitLabel="Save User"
    />
  );
};

const UserList = () => {
  return (
    <DynamicList
      schema={listSchema}
      queryKey={['users']}
      queryFn={async () => {
        // Fetch users from API
        const response = await fetch('/api/users');
        return response.json();
      }}
      className="w-full"
    />
  );
};
```