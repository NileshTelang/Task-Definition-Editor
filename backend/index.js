
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { EventEmitter } = require('events');
const indexRouter = require('./api');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

const eventEmitter = new EventEmitter();

app.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is up !' });
});

app.use('/api', indexRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

eventEmitter.on('formUpdated', () => {
  console.log('Form Updated');
});

