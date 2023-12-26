const { EventEmitter } = require('events');
const eventEmitter = new EventEmitter();
const { validateVisibilityOptions } = require('../middlewares/fieldMiddleware')
let schema = require('../schemas/schema.json');
let uischema = require('../schemas/uischema.json');

const handleFieldOperation = (req, res, isEdit) => {
  const { newField, fieldType, options, isRequired, editField, isReadOnly, visibilityOptions } = req.body;

  try {
    if (visibilityOptions) {
      validateVisibilityOptions(visibilityOptions, schema, res);
      
    }

    if ((isEdit && (!editField || !schema.properties[editField])) || (!isEdit && (!newField || !fieldType))) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    if (isEdit) {
      if (editField !== newField) {
        schema.properties[newField] = { ...schema.properties[editField] };
        delete schema.properties[editField];

        const uiSchemaIndex = uischema.elements.findIndex((element) => element.scope === `#/properties/${editField}`);
        if (uiSchemaIndex !== -1) {
          uischema.elements[uiSchemaIndex].scope = `#/properties/${newField}`;
        }
      }

      schema.properties[newField] = createFieldProperties(newField, fieldType, options, isRequired, visibilityOptions);

      const uiSchemaIndex = uischema.elements.findIndex((element) => element.scope === `#/properties/${newField}`);
      if (uiSchemaIndex !== -1) {
        uischema.elements[uiSchemaIndex] = createUiSchemaElement(newField, fieldType, options, isRequired, isReadOnly, visibilityOptions);
      }

      if (isRequired) {
        if (!schema.required.includes(newField)) {
          schema.required.push(newField);
        }
      } else {
        schema.required = schema.required.filter((field) => field !== newField);
      }
    } else {
      if (schema.properties[newField]) {
        return res.status(400).json({ success: false, error: 'Field name already exists' });
      }

      schema.properties[newField] = createFieldProperties(newField, fieldType, options, isRequired, visibilityOptions);

      const uiSchemaElement = createUiSchemaElement(newField, fieldType, options, isRequired, isReadOnly, visibilityOptions);
      uischema.elements.push(uiSchemaElement);

      if (isRequired && !schema.required.includes(newField)) {
        schema.required.push(newField);
      } else if (!isRequired) {
        schema.required = schema.required.filter((field) => field !== newField);
      }
    }

    eventEmitter.emit('formUpdated');
    res.json({ success: true, updatedSchema: schema, updatedUischema: uischema });
  } catch (error) {
    console.error(`Error ${isEdit ? 'editing' : 'adding'} field:`, error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const handleRemoveField = async (req, res) => {
  const { removeField } = req.body;
  try {
    if (schema.properties[removeField]) {
      delete schema.properties[removeField];
      schema.required = schema.required.filter(field => field !== removeField);
      uischema.elements = uischema.elements.filter((element) => element.scope !== `#/properties/${removeField}`);
      eventEmitter.emit('formUpdated');
      res.json({ success: true, updatedSchema: schema, updatedUischema: uischema });
    } else {
      res.status(400).json({ success: false, error: 'Field not found' });
    }
  } catch (error) {
    console.error('Error removing field:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createFieldProperties = (newField, fieldType, options, isRequired, visibilityOptions) => {
  const baseProperties = {
    type: fieldType,
  };

  if (isRequired && !schema.required.includes(newField)) {
    schema.required = [...schema.required, newField];
  }

  if (visibilityOptions) {
    baseProperties.visibilityOptions = visibilityOptions;
  } else {
    delete baseProperties.visibilityOptions;
  }

  switch (fieldType) {
    case 'string':
    case 'number':
    case 'boolean':
      return baseProperties;
    case 'date':
      return { ...baseProperties, type: 'string', format: 'date' };
    case 'textarea':
      return { ...baseProperties, type: 'string', format: 'textarea' };
    case 'dropdown':
      return { ...baseProperties, type: 'string', enum: options };
    case 'url':
      return { ...baseProperties, type: 'string', format: 'uri' };
    case 'email':
      return { ...baseProperties, type: 'string', format: 'email' };
    case 'radio':
      return { ...baseProperties, type: 'string', enum: options };
    default:
      return baseProperties;
  }
};

const createUiSchemaElement = (newField, fieldType, options, isRequired, isReadOnly, visibilityOptions) => {
  const baseUiSchema = {
    type: 'Control',
    label: newField,
    scope: `#/properties/${newField}`,
    options: {
      isRequired: isRequired,
      readonly: isReadOnly,
    },
  };

  if (visibilityOptions) {
    baseUiSchema['rule'] = createVisibilityRule(visibilityOptions);
  }

  switch (fieldType) {
    case 'textarea':
      return {
        ...baseUiSchema,
        options: {
          ...baseUiSchema.options,
          multi: true,
          required: isRequired,
          readonly: isReadOnly,
        },
      };
    case 'dropdown':
      return {
        ...baseUiSchema,
        options: {
          ...baseUiSchema.options,
          enumOptions: options.map(option => ({ value: option, label: option })),
          required: isRequired,
          readonly: isReadOnly,
        },
      };
    case 'radio':
      return {
        ...baseUiSchema,
        options: {
          ...baseUiSchema.options,
          enumOptions: options.map(option => ({ value: option, label: option })),
          format: 'radio',
          required: isRequired,
          readonly: isReadOnly,
        },
      };
    default:
      return baseUiSchema;
  }
};

const createVisibilityRule = (visibilityOptions) => {
  const { field, operator, value } = visibilityOptions;
  const visibilityDataType = schema.properties[field]?.type || 'string';

  const rule = {
    "effect": "SHOW",
    "condition": {
      "scope": `#/properties/${field}`,
      "schema": { type: visibilityDataType }
    }
  };

  if (visibilityDataType === 'date') {
    Object.assign(condition.schema, { type: 'string', format: 'date-time' });
  }

  switch (operator) {
    case '==':
      rule.condition.schema.const = value;
      break;
    case '!=':
      rule.condition.schema.not = { const: value };
      break;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }


  return rule;
};

module.exports = {
  handleFieldOperation,
  handleRemoveField,
  createFieldProperties,
  createUiSchemaElement,
  schema,
  uischema
};

