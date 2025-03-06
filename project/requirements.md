# Schema-to-ui Package Requirements

## Schema-to-Form: Dynamic Form Generation Library

1. Dynamic Form Generation
   1.1. Define UI schemas in JSON format to specify form controls and layout
   1.2. Render forms using the DynamicForm React component
   1.3. Support for grouped fields and collapsible sections
   1.4. Built-in responsive grid layout system

2. Field Types
   2.1. Basic inputs: text, number, date
   2.2. Select fields: single-select, multi-select
   2.3. Checkbox fields
   2.4. Support for custom field types through extension

3. Form Validation & State Management
   3.1. Built-in validation system with customizable rules
   3.2. Form-level and field-level validation
   3.3. Centralized form state management
   3.4. Dirty state tracking and touch detection

4. Field Dependencies
   4.1. Define conditional field visibility
   4.2. Dynamic field values based on other fields
   4.3. Complex dependency rules using AND/OR conditions
   4.4. Support for dependency groups

5. Data Transformation
   5.1. Field-level value transformers
   5.2. Custom value mappers
   5.3. Support for bit flags and option groups
   5.4. Reference data loading and transformation

6. Schema Management
   6.1. Schema registry for centralized schema management
   6.2. Schema validation and transformation pipeline
   6.3. Schema adapters for different data sources
   6.4. Mongoose schema adapter for automatic form generation

7. Theming & Styling
   7.1. Customizable theme system
   7.2. Default styling with Tailwind CSS
   7.3. Component-level style overrides


## Schema-to-List: Dynamic List Generation Library

1. Dynamic Table Generation
   1.1. Define UI schemas in JSON format to specify columns
   1.2. Render lists using the DynamicList React component (which uses react-query for data and react-table for ui)
   1.3. Support for row grouping via columns
   1.4  Support for row selection and custom action on selected data

2. Field Type Specific display
   2.1. Basic: text, number, date
   2.2. Array fields
   2.3. Boolean fields
   2.4. Reference fields
   2.5. Action button fields with custom function
   
3. Theming & Styling
    3.1. Customizable theme system
    3.2. Default styling with Tailwind CSS
    3.3. Component-level style overrides