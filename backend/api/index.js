
const express = require('express');
const fieldRouter = require('./fieldRouter');

const router = express.Router();

router.use('/task', fieldRouter);

module.exports = router;
