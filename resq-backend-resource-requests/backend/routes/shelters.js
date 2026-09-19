const express = require('express');
const router = express.Router();
const { getShelters } = require('../controllers/resourceController');

router.get('/', getShelters);

module.exports = router;
