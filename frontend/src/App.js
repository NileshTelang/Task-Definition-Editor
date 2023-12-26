import React, { useState, useEffect } from 'react';
import { JsonForms } from '@jsonforms/react';
import axios from 'axios';
import { materialRenderers, materialCells } from '@jsonforms/material-renderers';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

function App() {
  const [schema, setSchema] = useState({});
  const [uischema, setUischema] = useState({});
  const [data, setData] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [addFieldError, setAddFieldError] = useState('');
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [addedFields, setAddedFields] = useState([]);
  const [selectedFieldType, setSelectedFieldType] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [isRequired, setIsRequired] = useState(false);
  const [isReadOnly, setisReadOnly] = useState(false);
  const [submitClicked, setSubmitClicked] = useState(false);
  const [isVisibilityChecked, setIsVisibilityChecked] = useState(false);
  const [visibilityFields, setVisibilityFields] = useState([]);
  const [selectedVisibilityFields, setSelectedVisibilityFields] = useState([]);
  const [visibilityOperator, setVisibilityOperator] = useState('');
  const [visibilityValue, setVisibilityValue] = useState('');

  const operatorOptions = ['==', '!='];

  const fetchData = async () => {
    try {
      const formResponse = await axios.get('/api/task/getForm');
      const { schema: updatedSchema, uischema: updatedUischema } = formResponse.data;
      setSchema(updatedSchema);
      setUischema(updatedUischema);
      setVisibilityFields(Object.keys(updatedSchema.properties));
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  const renderVisibilityValueInput = () => {
    const inputProps = {
      style: { marginTop: '16px', width: '50%' },
      label: 'Value',
      variant: 'outlined',
      value: visibilityValue,
      onChange: (e) => setVisibilityValue(e.target.value),
    };
    const selectedVisibilityFieldType = schema.properties[selectedVisibilityFields]?.format || schema.properties[selectedVisibilityFields]?.type;
    switch (selectedVisibilityFieldType) {
      case 'number':
        return (
          <TextField
            type="number"
            placeholder="Enter a number"
            {...inputProps}
            onChange={(e) => setVisibilityValue(parseFloat(e.target.value))}
          />
        );
      case 'boolean':
        return (
          <TextField
            select
            placeholder="Select a boolean value"
            {...inputProps}
            onChange={(e) => setVisibilityValue(e.target.value === 'true')}
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </TextField>
        );
      case 'string':
        return <TextField placeholder="Enter a string" {...inputProps} />;
      case 'date':
        return (
          <TextField
            type="date"
            placeholder="YYYY-MM-DD"
            {...inputProps}
            onChange={(e) => {
              const inputValue = e.target.value;
              setVisibilityValue(inputValue);
            }}
          />
        );

      case 'textarea':
        return <TextField multiline placeholder="Enter a value" {...inputProps} />;
      case 'dropdown':
        return (
          <TextField
            select
            placeholder="Select a value"
            {...inputProps}
          >
            {dropdownOptions.split(',').map((option, index) => (
              <MenuItem key={index} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        );
      case 'url':
        return (
          <TextField
            type="url"
            placeholder="Enter a URL"
            {...inputProps}
            onChange={(e) => setVisibilityValue(e.target.value)}
          />
        );
      case 'email':
        return (
          <TextField
            type="email"
            placeholder="Enter an email"
            {...inputProps}
            onChange={(e) => setVisibilityValue(e.target.value)}
          />
        );
      default:
        return <TextField placeholder="Enter a value" {...inputProps} />;
    }
  };

  const handleFieldOperation = async () => {
    if (newFieldName.trim() !== '' && selectedFieldType !== '') {
      const visibilityField = isVisibilityChecked ? selectedVisibilityFields : undefined;

      const visibilityOptions = isVisibilityChecked
        ? {
          field: visibilityField,
          operator: visibilityOperator,
          value: visibilityValue,
        }
        : undefined;

      try {
        const endpoint = editingField ? '/api/task/editfield' : '/api/task/addfield';
        const response = await axios.post(endpoint, {
          editField: editingField,
          newField: newFieldName,
          fieldType: selectedFieldType,
          options: selectedFieldType === 'dropdown' || selectedFieldType === 'radio' ? dropdownOptions.split(',') : undefined,
          isRequired: isRequired,
          isReadOnly: isReadOnly,
          isVisibilityChecked : isVisibilityChecked,
          visibilityOptions: visibilityOptions,
        });

        if (response.data.success) {
          setAddFieldError('');
          fetchData();
          setAddedFields(editingField ? addedFields.map((field) => (field === editingField ? newFieldName : field)) : [...addedFields, newFieldName]);
          clearFieldInputs();
        } else {
          console.error(`Failed to ${editingField ? 'edit' : 'add'} field`);
        }
      } catch (error) {
        console.error(`Error ${editingField ? 'editing' : 'adding'} field:`, error);
      }
    } else {
      setAddFieldError('Field Name and Field Type are required');
    }
  };

  const removeField = async (fieldToRemove) => {
    try {
      const response = await axios.post('/api/task/removeField', {
        removeField: fieldToRemove,
      });

      if (response.data.success) {
        fetchData();
        setAddedFields(addedFields.filter(field => field !== fieldToRemove));
        alert(`Field "${fieldToRemove}" has been deleted.`);
      } else {
        console.error('Failed to remove field');
      }
    } catch (error) {
      console.error('Error removing field:', error);
    }
  };

  const editField = (field) => {
    setEditingField(field);
    setNewFieldName(field);
    setSelectedFieldType(schema.properties[field]?.type || '');

    if (schema.properties[field]) {
      if (schema.properties[field]?.enum) {
        setDropdownOptions(schema.properties[field].enum.join(','));
      }

      setIsRequired(schema.required.includes(field));
      setisReadOnly(
        uischema.elements.find((element) => element.scope === `#/properties/${field}`)?.options?.readonly || false
      );

      const visibilityOptions = schema.properties[field]?.visibilityOptions;
      if (visibilityOptions) {
        setIsVisibilityChecked(true);
        setSelectedVisibilityFields(visibilityOptions.field);
        setVisibilityOperator(visibilityOptions.operator);
        setVisibilityValue(visibilityOptions.value);
      } else {
        setIsVisibilityChecked(false);
        setSelectedVisibilityFields([]);
        setVisibilityOperator('');
        setVisibilityValue('');
      }

    }
  };


  const clearFieldInputs = () => {
    setEditingField(null);
    setNewFieldName('');
    setSelectedFieldType('');
    setDropdownOptions('');
    setIsRequired(false);
    setisReadOnly(false);
    setIsVisibilityChecked(false);
    setSelectedVisibilityFields([]);
    setVisibilityOperator('');
    setVisibilityValue('');
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (submitClicked) {
      axios.post('/api/task/submit', { data, schema, uischema })
        .then((response) => {
          if (response.data.success) {
            console.log('Submit successful');
          } else {
            console.error('Submit failed');
          }
        })
        .catch((error) => {
          console.error('Error submitting data:', error);
        })
        .finally(() => {
          setSubmitClicked(false);
        });
    }
  }, [submitClicked, data, schema, uischema]);

  return (
    <Grid container spacing={2} className='App'>
      <Grid item xs={6} className='left-section'>
        <div>
          <TextField
            label='Field Name'
            variant='outlined'
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            style={{ width: '50%' }}
          />
        </div>
        <div style={{ marginTop: '16px' }}>
          <TextField
            select
            label='Field Type'
            variant='outlined'
            value={selectedFieldType}
            onChange={(e) => setSelectedFieldType(e.target.value)}
            placeholder='Select Field Type'
            style={{ width: '50%' }}
          >
            <MenuItem value='string'>String</MenuItem>
            <MenuItem value='number'>Number</MenuItem>
            <MenuItem value='boolean'>Boolean</MenuItem>
            <MenuItem value='date'>Date</MenuItem>
            <MenuItem value='textarea'>Textarea</MenuItem>
            <MenuItem value='dropdown'>Dropdown</MenuItem>
            <MenuItem value='url'>URL</MenuItem>
            <MenuItem value='email'>Email</MenuItem>
            <MenuItem value='radio'>Radio</MenuItem>
          </TextField>
          {(selectedFieldType === 'dropdown' || selectedFieldType === 'radio') && (
            <TextField
              label={selectedFieldType === 'dropdown' ? 'Dropdown Options (comma-separated)' : 'Radio Options (comma-separated)'}
              variant='outlined'
              value={dropdownOptions}
              onChange={(e) => setDropdownOptions(e.target.value)}
              style={{ marginTop: '16px', width: '100%' }}
            />
          )}

          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '8px' }}>
              Required ? :
              <input
                type="checkbox"
                checked={isRequired}
                onChange={() => setIsRequired(!isRequired)}
                style={{ marginLeft: '8px' }}
              />
            </label>

            <label style={{ marginBottom: '8px' }}>
              Read Only ? :
              <input
                type="checkbox"
                checked={isReadOnly}
                onChange={() => setisReadOnly(!isReadOnly)}
                style={{ marginLeft: '8px' }}
              />
            </label>

            {addedFields.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ marginBottom: '8px' }}>
                  Visibility:
                  <input
                    type="checkbox"
                    checked={isVisibilityChecked}
                    onChange={() => setIsVisibilityChecked(!isVisibilityChecked)}
                    style={{ marginLeft: '8px' }}
                  />
                </label>
                {isVisibilityChecked && (
                  <>
                    <TextField
                      select
                      label='Select Fields'
                      variant='outlined'
                      value={selectedVisibilityFields}
                      onChange={(e) => setSelectedVisibilityFields(e.target.value)}
                      placeholder='Select Fields'
                      style={{ width: '50%' }}
                      multiple
                    >
                      {visibilityFields
                        .filter((field) => field !== editingField)
                        .map((field, index) => (
                          <MenuItem key={index} value={field}>
                            {selectedVisibilityFields.includes(field) ? (
                              <span style={{ color: 'green' }}>{field}</span>
                            ) : (
                              <span style={{ color: 'red' }}>{field}</span>
                            )}
                          </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                      select
                      label='Operator'
                      variant='outlined'
                      value={visibilityOperator}
                      onChange={(e) => setVisibilityOperator(e.target.value)}
                      placeholder='Select Operator'
                      style={{ marginTop: '16px', width: '50%' }}
                    >
                      {operatorOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))
                      }
                    </TextField>
                    {renderVisibilityValueInput()}
                  </>
                )}
              </div>
            )}

          </div>


          <Button variant='contained' color='primary' onClick={handleFieldOperation} style={{ marginTop: '16px' }}>
            {editingField ? 'Update Field' : 'Add Field'}
          </Button>

          <p style={{ color: 'red' }}>{addFieldError}</p>

        </div>

        <div style={{ marginTop: '32px', border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ color: '#007BFF', marginBottom: '16px' }}>Created Fields</h2>
          {addedFields.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#007BFF', color: 'white', fontWeight: 'bold' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px', fontFamily: 'cursive' }}>Field Name</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontFamily: 'cursive' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addedFields.map((field, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold', color: '#333', padding: '12px', fontFamily: 'cursive' }}>{field}</td>
                    <td style={{ textAlign: 'right', padding: '12px' }}>
                      <Button
                        variant='contained'
                        color='secondary'
                        onClick={() => removeField(field)}
                      >
                        Remove
                      </Button>
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => editField(field)}
                        style={{ marginLeft: '8px' }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#777' }}>No fields created yet.</p>
          )}
        </div>
      </Grid>
      <Grid item xs={6} className='right-section'>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '50px', marginTop: '20px' }}>
          <Button variant='contained' color='primary' onClick={() => setSubmitClicked(true)}>
            Submit
          </Button>
        </div>
        <JsonForms
          schema={schema}
          uischema={uischema}
          data={data}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ data, errors }) => setData(data)}
        />
      </Grid>
    </Grid>
  );
}

export default App;
