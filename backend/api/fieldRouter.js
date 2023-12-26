
const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController')
const { validateFieldOperation, validateRemoveField, validateData , trimDataMiddleware } = require('../middlewares/fieldMiddleware');

router.use(trimDataMiddleware);

router.get('/getForm', fieldController.getForm);

router.post('/addfield', (req, res, next) => validateFieldOperation(req, res, next, false), fieldController.addField);

router.post('/editfield', (req, res, next) => validateFieldOperation(req, res, next, true), fieldController.editField);

router.post('/removeField', validateRemoveField, fieldController.removeField);

router.post('/submit', validateData, fieldController.submit);

module.exports = router;
