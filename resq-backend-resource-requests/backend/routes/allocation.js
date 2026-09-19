const express = require('express');
const router = express.Router();
const {
  allocateResources,
  replanResources,
  getLatestPlan,
  getPlanHistory,
  approveAllocation,
  manualAllocation
} = require('../controllers/allocationController');

router.post('/allocate', allocateResources);
router.post('/allocate-resource', allocateResources);

router.post('/reallocate', replanResources);
router.post('/replan', replanResources);

router.get('/allocation-plan', getLatestPlan);
router.get('/allocation-history', getPlanHistory);

router.post('/allocation/approve', approveAllocation);
router.post('/allocation/manual', manualAllocation);

module.exports = router;
