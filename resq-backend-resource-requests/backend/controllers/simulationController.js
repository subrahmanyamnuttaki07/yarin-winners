const mockData = require('../data/mockData');
const { runAllocationEngine } = require('../services/allocationEngine');
const { generateAllocationExplanation } = require('../services/aiService');

/**
 * Simulates a meaningful disaster-condition change (Acceptance Test Scenario)
 * - Assigned resource becomes Unavailable
 * - New Critical Emergency D arrives
 * - Triggers dynamic replanning -> PLAN V2
 */
const simulateDisasterChange = async (req, res) => {
  try {
    const historyBefore = mockData.getPlanHistory();
    let oldPlanVersion = historyBefore.length > 0 ? historyBefore[historyBefore.length - 1] : null;

    if (!oldPlanVersion) {
      // Run initial allocation to get PLAN V1
      const initResult = runAllocationEngine(null, null, null, 'Initial Disaster Response Baseline');
      oldPlanVersion = initResult.planVersion;
    }

    const resources = mockData.getResources();
    const emergencies = mockData.getEmergencies();

    // 1. Mark an assigned resource as Unavailable (Simulating breakdown/unavailability)
    const assignedResource = resources.find(r => r.status === 'Assigned' || r.status === 'Available');
    let unavailableResourceId = null;
    let unavailableResourceName = null;

    if (assignedResource) {
      assignedResource.status = 'Unavailable';
      assignedResource.availability = false;
      assignedResource.currentEmergencyId = null;
      unavailableResourceId = assignedResource.id;
      unavailableResourceName = assignedResource.name;
    }

    // 2. Add New Critical Emergency D
    const emergencyD = {
      id: `E${100 + emergencies.length + 1}`,
      title: "Critical Flash Flood & Evacuation — Sector D",
      latitude: 12.9780,
      longitude: 77.6080,
      severity: "CRITICAL",
      urgency: "CRITICAL",
      peopleAffected: 55,
      medicalRequirement: true,
      vulnerablePeople: 18,
      status: "Pending",
      requiredResource: "Rescue Boat",
      accessibility: "PARTIAL",
      createdAt: new Date().toISOString()
    };

    emergencies.unshift(emergencyD);
    mockData.setEmergencies(emergencies);
    mockData.setResources(resources);

    // 3. Trigger Dynamic Replanning Engine -> PLAN V2
    const replanResult = runAllocationEngine(
      null,
      null,
      null,
      `Disaster Change Simulated: ${unavailableResourceName || 'Resource'} became Unavailable + New Critical Emergency ${emergencyD.id} arrived`
    );

    const aiExplanation = await generateAllocationExplanation(replanResult.allocations, replanResult.changesFromPrevious);

    res.status(200).json({
      message: 'Dynamic replanning disaster change simulation completed',
      simulationEvent: {
        unavailableResource: { id: unavailableResourceId, name: unavailableResourceName, status: 'Unavailable' },
        newEmergency: emergencyD
      },
      oldPlan: oldPlanVersion,
      newPlan: replanResult.planVersion,
      allocations: replanResult.allocations,
      unassignedEmergencies: replanResult.unassignedEmergencies,
      changes: replanResult.changesFromPrevious,
      aiExplanation
    });
  } catch (err) {
    res.status(500).json({ error: 'Disaster change simulation failed', details: err.message });
  }
};

const simulateWeather = async (req, res) => {
  try {
    const oldWeather = { ...mockData.getWeather() };

    const newWeather = {
      temperature: 21,
      rainfall: 85,
      windSpeed: 62,
      precipitationProbability: 95,
      conditions: "Torrential Downpour & Severe Flash Flooding",
      riskLevel: "SEVERE"
    };

    mockData.setWeather(newWeather);

    const emergencies = mockData.getEmergencies();
    emergencies.forEach(e => {
      if (e.severity === 'CRITICAL' || e.title.includes('Area A')) {
        e.accessibility = 'BLOCKED';
      }
    });
    mockData.setEmergencies(emergencies);

    const replanResult = runAllocationEngine(null, null, null, 'Weather Surge Simulation');
    const aiExplanation = await generateAllocationExplanation(replanResult.allocations, replanResult.changesFromPrevious);

    res.status(200).json({
      message: 'Weather simulation completed',
      oldWeather,
      newWeather,
      newPlan: replanResult.planVersion,
      allocations: replanResult.allocations,
      unassignedEmergencies: replanResult.unassignedEmergencies,
      changes: replanResult.changesFromPrevious,
      aiExplanation
    });
  } catch (err) {
    res.status(500).json({ error: 'Weather simulation failed', details: err.message });
  }
};

const simulateEmergency = async (req, res) => {
  try {
    const emergencies = mockData.getEmergencies();

    const newEmergency = {
      id: `E${100 + emergencies.length + 1}`,
      title: req.body.title || "Critical Collapse & Trap — Sector East",
      latitude: req.body.latitude || 12.9680,
      longitude: req.body.longitude || 77.6120,
      severity: req.body.severity || "CRITICAL",
      urgency: req.body.urgency || "CRITICAL",
      peopleAffected: Number(req.body.peopleAffected) || 45,
      medicalRequirement: req.body.medicalRequirement !== undefined ? req.body.medicalRequirement : true,
      vulnerablePeople: Number(req.body.vulnerablePeople) || 10,
      status: "Pending",
      requiredResource: req.body.requiredResource || "Rescue Boat",
      accessibility: req.body.accessibility || "ACCESSIBLE",
      createdAt: new Date().toISOString()
    };

    emergencies.unshift(newEmergency);
    mockData.setEmergencies(emergencies);

    const replanResult = runAllocationEngine(null, null, null, `New Critical Emergency ${newEmergency.id} Simulated`);
    const aiExplanation = await generateAllocationExplanation(replanResult.allocations, replanResult.changesFromPrevious);

    res.status(200).json({
      message: 'Emergency simulation completed',
      simulatedEmergency: newEmergency,
      newPlan: replanResult.planVersion,
      allocations: replanResult.allocations,
      unassignedEmergencies: replanResult.unassignedEmergencies,
      changes: replanResult.changesFromPrevious,
      aiExplanation
    });
  } catch (err) {
    res.status(500).json({ error: 'Emergency simulation failed', details: err.message });
  }
};

module.exports = {
  simulateDisasterChange,
  simulateWeather,
  simulateEmergency
};
