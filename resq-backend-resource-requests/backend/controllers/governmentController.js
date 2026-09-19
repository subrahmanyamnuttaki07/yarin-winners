const mockData = require('../data/mockData');
const { generateAllocationExplanation } = require('../services/aiService');

const getGovernmentActions = (req, res) => {
  const actions = mockData.getGovernmentActions();
  res.status(200).json(actions);
};

const createGovernmentAction = (req, res) => {
  const { type, area, emergencyId, description, status } = req.body;

  if (!type || !area) {
    return res.status(400).json({ error: 'Action type and area are required.' });
  }

  const actions = mockData.getGovernmentActions();
  const newAction = {
    id: `ACT-${100 + actions.length + 1}`,
    type: type || 'COORDINATION_ACTION',
    area: area || 'General Zone',
    emergencyId: emergencyId || null,
    description: description || `Action ${type} initiated for ${area}`,
    status: status || 'Pending',
    createdAt: new Date().toISOString()
  };

  actions.unshift(newAction);
  mockData.setGovernmentActions(actions);

  res.status(201).json({
    message: 'Government action recorded successfully',
    action: newAction,
    actions
  });
};

const getGovernmentSummary = async (req, res) => {
  try {
    const emergencies = mockData.getEmergencies();
    const resources = mockData.getResources();
    const weather = mockData.getWeather();
    const hospitals = mockData.getHospitals();
    const shelters = mockData.getShelters();
    const resourceRequests = mockData.getResourceRequests();

    const criticalCount = emergencies.filter(e => (e.severity || e.urgency) === 'CRITICAL').length;
    const totalAffected = emergencies.reduce((sum, e) => sum + (Number(e.peopleAffected) || 0), 0);
    const deployedResources = resources.filter(r => (r.status || '').toLowerCase() !== 'available').length;
    
    let summaryText = `SITUATION EXECUTIVE SUMMARY: Responding to ${emergencies.length} active incidents (${criticalCount} CRITICAL) affecting ${totalAffected} citizens across sectors. ${deployedResources} of ${resources.length} response units currently deployed. Route conditions under ${weather.conditions || 'adverse weather'} (${weather.riskLevel || 'MODERATE'} risk level).`;

    // Attempt AI summary if possible
    try {
      const aiRes = await generateAllocationExplanation(
        { emergenciesCount: emergencies.length, criticalCount, totalAffected, deployedResources, weatherRisk: weather.riskLevel },
        []
      );
      if (aiRes && !aiRes.includes('Reallocation Triggered')) {
        summaryText = `AI EXECUTIVE SITUATION REPORT: ${aiRes}`;
      }
    } catch (e) {
      // Use fallback summary text
    }

    res.status(200).json({
      summary: summaryText,
      resourceRequests,
      stats: {
        activeEmergencies: emergencies.length,
        criticalEmergencies: criticalCount,
        totalPeopleAffected: totalAffected,
        resourcesDeployed: deployedResources,
        resourcesAvailable: resources.length - deployedResources,
        hospitalsCount: hospitals.length,
        sheltersCount: shelters.length,
        weatherRisk: weather.riskLevel || 'MODERATE',
        pendingResourceRequests: resourceRequests.filter(r => r.status === 'PENDING').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate government summary', details: err.message });
  }
};

module.exports = {
  getGovernmentActions,
  createGovernmentAction,
  getGovernmentSummary
};
