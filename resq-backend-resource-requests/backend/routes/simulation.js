const express = require('express');
const router = express.Router();
const {
  simulateDisasterChange,
  simulateWeather,
  simulateEmergency
} = require('../controllers/simulationController');

router.post('/disaster-change', simulateDisasterChange);
router.post('/weather', simulateWeather);
router.post('/emergency', simulateEmergency);

module.exports = router;
