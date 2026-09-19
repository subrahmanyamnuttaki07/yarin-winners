const express = require('express');
const router = express.Router();
const {
  getEmergencies,
  getEmergencyById,
  createEmergency,
  updateEmergency
} = require('../controllers/emergencyController');

router.get('/', getEmergencies);
router.get('/:id', getEmergencyById);
router.post('/', createEmergency);
router.patch('/:id', updateEmergency);

module.exports = router;
