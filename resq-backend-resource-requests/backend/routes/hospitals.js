const express = require('express');
const router = express.Router();
const { getHospitals } = require('../controllers/resourceController');

router.get('/', getHospitals);

module.exports = router;
