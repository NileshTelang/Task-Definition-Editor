const Joi = require('joi');
const { generateError } = require('./customErrorMessage');
const { sanitizeData } = require('../utils/sanitizeData')

const allowedFieldtypes = ['string', 'number', 'boolean', 'date', 'textarea', 'dropdown', 'url', 'email', 'radio']

const fieldOperationSchema = Joi.object({
  newField: Joi.string().required(),
  fieldType: Joi.string().valid(...allowedFieldtypes).required(),
  options: Joi.when('fieldType', {
    is: 'dropdown',
    then: Joi.array()
      .items(Joi.string().trim().min(1))
      .min(1)
      .required(),
    otherwise: Joi.array()
      .items(Joi.string().trim().min(1))
      .min(2)
      .when('fieldType', {
        is: 'radio',
        then: Joi.array().min(2).required(),
      })
      .optional(),
  }),
  isRequired: Joi.boolean().required(),
  editField: Joi.boolean().required(),
}).unknown(false);

const removeFieldSchema = Joi.object({
  removeField: Joi.string().required()
});

const dataSchema = Joi.object({
  data: Joi.object().required(),
  schema: Joi.object().required(),
  uischema: Joi.object().required(),
});

const fieldValidationFunctions = {
  string: Joi.string().trim().min(1).max(255),
  number: Joi.number().integer().min(0),
  boolean: Joi.boolean(),
  date: Joi.string().isoDate(),
  textarea: Joi.string().trim().min(1).max(1000),
  dropdown: (options) => Joi.string().valid(...options),
  uri: Joi.string().uri({
    scheme: ['https'],
  }),
  email: Joi.string().email(),
  radio: (options) => Joi.string().valid(...options),
};

const validateFieldOperation = (req, res, next, isEdit) => {
  const { error } = fieldOperationSchema.validate({
    newField: req.body.newField,
    fieldType: req.body.fieldType,
    options: req.body.fieldType === 'dropdown' || req.body.fieldType === 'radio' ? req.body.options : undefined,
    isRequired: req.body.isRequired,
    editField: isEdit,
  });

  if (error) {
    return res.status(400).json(generateError(error, false));
  }

  next();
};

const validateRemoveField = (req, res, next) => {
  const { error } = removeFieldSchema.validate(req.body);
  if (error) {
    return res.status(400).json(generateError(error, false));
  }

  next();
};

const validateField = async (fieldName, fieldType, value, fieldOptions) => {
  const validationFunction = fieldValidationFunctions[fieldType];

  if (!validationFunction) {
    throw new Error(`Unsupported field type: ${fieldType}`);
  }

  const { error } = validationFunction.validate(value, { convert: false });
  return error ? generateError(error) : null;
};

const validateAllFields = async (data, schema) => {
  const fieldNames = Object.keys(schema.properties);
  const validationErrors = [];

  for (const fieldName of fieldNames) {
    const { format, type, enum: fieldOptions } = schema.properties[fieldName];
    const value = data[fieldName];
    const validationError = await validateField(fieldName, format || type, value, fieldOptions);

    if (validationError) {
      validationErrors.push(validationError);
    }
  }

  return validationErrors.length > 0 ? validationErrors : null;
};

const handleValidationErrors = (res, validationErrors) => {
  if (validationErrors) {
    const firstError = validationErrors[0];
    res.status(400).json({
      success: false,
      value: firstError.errorField,
      message: firstError.message,
    });
    return true;
  }
  return false;
};

const validateData = async (req, res, next) => {
  try {
    req.body = sanitizeData(req.body);
    const { data, schema } = await dataSchema.validateAsync(req.body);

    const validationErrors = await validateAllFields(data, schema);

    if (handleValidationErrors(res, validationErrors)) {
      return;
    }

    next();
  } catch (error) {
    res.status(400).json(generateError(error, false));
  }
};

const trimDataMiddleware = (req, res, next) => {
  trimStringValues(req.body);
  next();
};

const trimStringValues = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object') {
      trimStringValues(obj[key]);
    }
  }
};

const validateVisibilityOptions = (visibilityOptions, schema, res) => {

  if (visibilityOptions.field && !schema.properties[visibilityOptions.field]) {
    return res.status(400).json({ success: false, error: 'Invalid visibility field' });
  }

  const { field } = visibilityOptions;
  const fieldType = schema.properties[field]?.type;

  let valueValidation;
  if (fieldType === 'number') {
    valueValidation = Joi.number().required();
  } else if (fieldType === 'boolean') {
    valueValidation = Joi.boolean().required();
  } else {
    valueValidation = Joi.string().required();
  }

  const visibilityOptionsSchema = Joi.object({
    field: Joi.string().required(),
    operator: Joi.string().valid('==', '!=').required(),
    value: valueValidation,
  });

  const { error } = visibilityOptionsSchema.validate(visibilityOptions, {
    context: { fieldType },
  });

  if (error) {
    return res.status(400).json(generateError(error, false));
  }
};

module.exports = {
  validateFieldOperation,
  validateRemoveField,
  validateData,
  trimDataMiddleware,
  validateVisibilityOptions
};




