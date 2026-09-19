const mockData = require('../data/mockData');
const { runAllocationEngine } = require('../services/allocationEngine');
const { resolveLocation } = require('../utils/locationResolver');

const getEmergencies = (req, res) => {
  res.status(200).json(mockData.getEmergencies());
};

const getEmergencyById = (req, res) => {
  const { id } = req.params;
  const emergency = mockData.getEmergencies().find((item) => item.id === id);

  if (!emergency) return res.status(404).json({ error: 'Emergency not found' });
  res.status(200).json(emergency);
};

const createEmergency = (req, res) => {
  const {
    userId,
    title,
    location,
    latitude,
    longitude,
    severity,
    peopleAffected,
    vulnerablePeople,
    medicalRequirement,
    requiredResource,
    accessibility,
    disasterType,
    description
  } = req.body;

  if (!userId || !String(userId).trim()) {
    return res.status(400).json({ error: 'User ID is required for emergency reports' });
  }

  if (!title) {
    return res.status(400).json({ error: 'Emergency title is required' });
  }

  const emergencies = mockData.getEmergencies();
  const resolved = resolveLocation(location, latitude, longitude);

  const newEmergency = {
    id: `E${100 + emergencies.length + 1}`,
    userId: String(userId).trim(),
    title,
    location: location || resolved.resolvedLocation,
    resolvedLocation: resolved.resolvedLocation,
    locationSource: resolved.locationSource,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    disasterType: disasterType || 'Other Emergency',
    severity: (severity || 'HIGH').toUpperCase(),
    urgency: (severity || 'HIGH').toUpperCase(),
    peopleAffected: Math.max(1, Number(peopleAffected) || 1),
    vulnerablePeople: Math.max(0, Number(vulnerablePeople) || 0),
    medicalRequirement: Boolean(medicalRequirement),
    description: description || '',
    status: 'Pending',
    requiredResource: requiredResource || 'Rescue Team',
    accessibility: accessibility || 'ACCESSIBLE',
    priorityScore: 0,
    priorityReason: '',
    createdAt: new Date().toISOString()
  };

  emergencies.unshift(newEmergency);
  mockData.setEmergencies(emergencies);

  const engineResult = runAllocationEngine(
    null,
    null,
    null,
    `New Emergency Reported: ${newEmergency.id} by ${newEmergency.userId}`
  );

  const thisAllocation = (engineResult.allocations || []).find(
    (allocation) => allocation.emergencyId === newEmergency.id
  );

  res.status(201).json({
    message: thisAllocation
      ? 'Emergency received, prioritized and allocated'
      : 'Emergency received and placed in the waiting queue',
    emergency: newEmergency,
    allocation: thisAllocation || null,
    planVersion: engineResult.planVersion,
    changes: engineResult.changesFromPrevious || []
  });
};

const updateEmergency = (req, res) => {
  const { id } = req.params;
  const emergencies = mockData.getEmergencies();
  const resources = mockData.getResources();
  const index = emergencies.findIndex((item) => item.id === id);

  if (index === -1) return res.status(404).json({ error: 'Emergency not found' });

  const allowedUpdates = [
    'title', 'location', 'latitude', 'longitude', 'severity', 'urgency',
    'peopleAffected', 'vulnerablePeople', 'medicalRequirement', 'status',
    'requiredResource', 'accessibility', 'description'
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) emergencies[index][field] = req.body[field];
  });

  let freedResourceName = null;
  const requestedStatus = String(req.body.status || '').toUpperCase();

  if (requestedStatus === 'COMPLETED' || requestedStatus === 'RESOLVED') {
    emergencies[index].status = 'Completed';
    resources.forEach((resource) => {
      if (resource.currentEmergencyId === id) {
        resource.status = 'Available';
        resource.availability = true;
        resource.currentEmergencyId = null;
        freedResourceName = resource.name;
      }
    });
    mockData.setResources(resources);
  }

  mockData.setEmergencies(emergencies);

  const engineResult = runAllocationEngine(
    null,
    null,
    null,
    `Emergency Updated: ${emergencies[index].title}`
  );

  res.status(200).json({
    message: 'Emergency updated and allocation recalculated',
    emergency: emergencies[index],
    freedResource: freedResourceName,
    allocations: engineResult.allocations,
    changes: engineResult.changesFromPrevious,
    resources: mockData.getResources()
  });
};

module.exports = {
  getEmergencies,
  getEmergencyById,
  createEmergency,
  updateEmergency
};
