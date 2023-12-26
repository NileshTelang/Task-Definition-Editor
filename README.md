# Task Definition Editor

The Task Definition Editor is a web-based tool that allows users to create, edit, and manage task definitions with a user-friendly interface. It provides functionalities to customize and visualize task-related information dynamically.

## Features

- **Dynamic Form Generation:** Create task definitions by dynamically generating forms based on a JSON schema.
- **Field Operations:** Add, edit, or remove fields in the task definition, including options for data type, validation, and visibility rules.
- **Real-time Updates:** Any changes made to the task definition are instantly reflected in the UI.
- **Customization:** Customize the task definition layout and appearance according to your requirements.
- **Visibility Rules:** Define visibility rules for fields based on the values of other fields.

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/task-definition-editor.git
   ```

2. Navigate to the project directory:
   
   A : 
   ```bash
   cd task-definition-editor
   cd frontend
   ```
   B : 
   ```bash
   cd task-definition-editor
   cd backend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run the application:

   ```bash
   npm start
   ```

5. Open your web browser and access the application at [http://localhost:3000](http://localhost:3000).

## Usage

1. **Creating a Task Definition:**
   - Click on the "Add Field" button to add a new field to the task definition.
   - Fill in the details such as field name, data type, validation rules, etc.
   - Save the changes.

2. **Editing a Task Definition:**
   - Select a field from the list to edit its properties.
   - Modify the required details and save the changes.

3. **Removing a Field:**
   - Select a field from the list and click on the "Remove Field" button.

4. **Visibility Rules:**
   - Define visibility rules for fields based on other field values.
   - Specify the field, operator, and value for the visibility condition.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
- [Joi](https://joi.dev/) - Object schema validation for JavaScript.
```
