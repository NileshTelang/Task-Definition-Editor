
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeConfig = {
  ALLOWED_TAGS: [''],   
  ALLOWED_ATTR: []      
};

module.exports = {
  DOMPurify,
  sanitizeConfig,
};
