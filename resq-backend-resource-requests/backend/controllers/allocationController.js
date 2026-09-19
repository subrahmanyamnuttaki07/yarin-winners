const mockData = require('../data/mockData');
const { runAllocationEngine } = require('../services/allocationEngine');
const { generateAllocationExplanation } = require('../services/aiService');

const allocateResources = async (req, res) => {
  try {
    const result = runAllocationEngine(null, null, null, 'Resource Allocation Requested');
    const aiExplanation = await generateAllocationExplanation(result.allocations, []);

    res.status(200).json({
      message: 'Resource allocation completed',
      planVersion: result.planVersion,
      allocations: result.allocations,
      unassignedEmergencies: result.unassignedEmergencies,
      aiExplanation
    });
  } catch (err) {
    res.status(500).json({ error: 'Allocation calculation failed', details: err.message });
  }
};

const replanResources = async (req, res) => {
  try {
    const result = runAllocationEngine(null, null, null, 'Dynamic Replanning Requested');
    const aiExplanation = await generateAllocationExplanation(result.allocations, result.changesFromPrevious);

    res.status(200).json({
      message: 'Dynamic replanning completed successfully',
      planVersion: result.planVersion,
      allocations: result.allocations,
      unassignedEmergencies: result.unassignedEmergencies,
      changes: result.changesFromPrevious,
      aiExplanation
    });
  } catch (err) {
    res.status(500).json({ error: 'Replanning calculation failed', details: err.message });
  }
};

const getLatestPlan = (req, res) => {
  const history = mockData.getPlanHistory();
  if (history.length === 0) {
    // Generate initial plan
    const result = runAllocationEngine(null, null, null, 'Initial System Plan');
    return res.status(200).json(result.planVersion);
  }
  res.status(200).json(history[history.length - 1]);
};

const getPlanHistory = (req, res) => {
  const history = mockData.getPlanHistory();
  if (history.length === 0) {
    runAllocationEngine(null, null, null, 'Initial System Plan');
    return res.status(200).json(mockData.getPlanHistory());
  }
  res.status(200).json(history);
};

const approveAllocation = (req, res) => {
  const { emergencyId, resourceId, action } = req.body;

  if (!emergencyId || !action) {
    return res.status(400).json({ error: 'Emergency ID and Action (ACCEPT/REJECT) are required' });
  }

  const history = mockData.getPlanHistory();
  const currentPlan = history.length > 0 ? history[history.length - 1] : null;

  if (!currentPlan) {
    return res.status(404).json({ error: 'No active allocation plan found' });
  }

  const alloc = currentPlan.allocations.find(a => a.emergencyId === emergencyId);
  if (!alloc) {
    return res.status(404).json({ error: 'Allocation for given emergency not found' });
  }

  if (action.toUpperCase() === 'ACCEPT') {
    alloc.approvalStatus = 'ACCEPTED';
    
    // Update resource and emergency statuses
    const resources = mockData.getResources();
    const resObj = resources.find(r => r.id === (resourceId || alloc.resourceId));
    if (resObj) {
      resObj.status = 'Assigned';
      resObj.currentEmergencyId = emergencyId;
    }

    const emergencies = mockData.getEmergencies();
    const emObj = emergencies.find(e => e.id === emergencyId);
    if (emObj) {
      emObj.status = 'Assigned';
    }
  } else if (action.toUpperCase() === 'REJECT') {
    alloc.approvalStatus = 'REJECTED';
    
    // Revert resource assignment
    const resources = mockData.getResources();
    const resObj = resources.find(r => r.id === alloc.resourceId);
    if (resObj) {
      resObj.status = 'Available';
      resObj.currentEmergencyId = null;
    }

    const emergencies = mockData.getEmergencies();
    const emObj = emergencies.find(e => e.id === emergencyId);
    if (emObj) {
      emObj.status = 'Waiting';
    }
  }

  res.status(200).json({
    message: `Allocation recommendation ${action.toUpperCase()}ED successfully`,
    allocation: alloc,
    currentPlan
  });
};

const manualAllocation = (req, res) => {
  const { emergencyId, resourceId } = req.body;

  if (!emergencyId || !resourceId) {
    return res.status(400).json({ error: 'emergencyId and resourceId are required for manual allocation' });
  }

  const emergencies = mockData.getEmergencies();
  const resources = mockData.getResources();

  const emergency = emergencies.find(e => e.id === emergencyId);
  const resource = resources.find(r => r.id === resourceId);

  if (!emergency || !resource) {
    return res.status(404).json({ error: 'Emergency or Resource not found' });
  }

  // Set resource & emergency statuses
  resource.status = 'Assigned';
  resource.currentEmergencyId = emergency.id;
  emergency.status = 'Assigned';

  // Trigger allocation engine to record plan version update
  const result = runAllocationEngine(null, null, null, `Manual Override: Assigned ${resource.name} to ${emergency.title}`);

  res.status(200).json({
    message: `Manually assigned ${resource.name} to ${emergency.title}`,
    manualAssignment: { emergencyId, resourceId },
    planVersion: result.planVersion
  });
};

module.exports = {
  allocateResources,
  replanResources,
  getLatestPlan,
  getPlanHistory,
  approveAllocation,
  manualAllocation
};
