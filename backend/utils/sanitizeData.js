
const { DOMPurify, sanitizeConfig } = require('../configs/sanitizeConfig');

const sanitizeData = (dirtyData) => {
  const jsonString = JSON.stringify(dirtyData);
  const cleanString = DOMPurify.sanitize(jsonString, sanitizeConfig);
  const cleanData = JSON.parse(cleanString);

  return cleanData;
};

module.exports = {
  sanitizeData,
};
