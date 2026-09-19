const express = require('express');
const router = express.Router();
const {
  getResources,
  getAvailableResources,
  createResource,
  updateResource
} = require('../controllers/resourceController');

router.get('/', getResources);
router.get('/available', getAvailableResources);
router.post('/', createResource);
router.put('/:id', updateResource);
router.patch('/:id', updateResource);

module.exports = router;
