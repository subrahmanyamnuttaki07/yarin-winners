const express = require('express');
const router = express.Router();
const {
  getResourceRequests,
  createResourceRequest,
  reviewResourceRequest
} = require('../controllers/resourceRequestController');

router.get('/', getResourceRequests);
router.post('/', createResourceRequest);
router.patch('/:id', reviewResourceRequest);

module.exports = router;
