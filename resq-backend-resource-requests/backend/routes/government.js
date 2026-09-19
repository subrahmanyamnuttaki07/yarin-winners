const express = require('express');
const router = express.Router();
const {
  getGovernmentActions,
  createGovernmentAction,
  getGovernmentSummary
} = require('../controllers/governmentController');

router.get('/actions', getGovernmentActions);
router.post('/actions', createGovernmentAction);
router.get('/summary', getGovernmentSummary);

module.exports = router;
