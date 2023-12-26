const { handleFieldOperation, handleRemoveField } = require('../handler/fieldHandler');
const fs = require('fs').promises;
const {schema , uischema } = require('../handler/fieldHandler')

module.exports = {
  getForm: (req, res) => {
    res.json({ schema, uischema });
  },

  addField: (req, res) => {
    handleFieldOperation(req, res, false);
  },

  editField: (req, res) => {
    handleFieldOperation(req, res, true);
  },

  removeField: (req, res) => {
    handleRemoveField(req, res);
  },

  submit: async (req, res) => {
    try {
      const { data, schema, uischema } = req.body;
      const jsonData = JSON.stringify({ data, schema, uischema }, null, 2);
      await fs.writeFile('./data.json', jsonData, 'utf-8');
      res.status(200).json({ success: true, message: 'Data saved successfully' });
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).json({ success: false, message: 'Failed to save data' });
    }
  }
};

