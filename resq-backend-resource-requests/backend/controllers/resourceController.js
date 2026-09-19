const mockData = require('../data/mockData');
const { runAllocationEngine } = require('../services/allocationEngine');

const getResources = (req, res) => {
  const resources = mockData.getResources();
  res.status(200).json(resources);
};

const getAvailableResources = (req, res) => {
  const resources = mockData.getResources();
  const available = resources.filter(r => (r.status || '').toUpperCase() === 'AVAILABLE');
  res.status(200).json(available);
};

const createResource = (req, res) => {
  const { name, type, latitude, longitude, capacity, speed, capabilities } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and Type are required for resource creation' });
  }

  const resources = mockData.getResources();
  const newResource = {
    id: `R${100 + resources.length + 1}`,
    name,
    type,
    latitude: Number(latitude) || 12.9600,
    longitude: Number(longitude) || 77.5900,
    status: 'Available',
    capacity: Number(capacity) || 10,
    capabilities: Array.isArray(capabilities) ? capabilities : [type.toLowerCase().replace(' ', '_')],
    availability: true,
    speed: Number(speed) || 45,
    currentEmergencyId: null
  };

  resources.push(newResource);
  mockData.setResources(resources);

  res.status(201).json({
    message: 'Resource created successfully',
    resource: newResource
  });
};

const updateResource = (req, res) => {
  const { id } = req.params;
  const resources = mockData.getResources();
  const index = resources.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  const allowedUpdates = ['name', 'type', 'latitude', 'longitude', 'status', 'capacity', 'speed', 'capabilities', 'currentEmergencyId'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      resources[index][field] = req.body[field];
    }
  });

  // Keep availability flag synchronized
  const st = (resources[index].status || '').toUpperCase();
  resources[index].availability = (st === 'AVAILABLE');

  mockData.setResources(resources);

  // If status changed to Unavailable or Busy, trigger dynamic replanning
  let replanResult = null;
  if (st === 'UNAVAILABLE' || st === 'BUSY' || st === 'COMPLETED') {
    replanResult = runAllocationEngine(null, null, null, `Resource ${id} status changed to ${resources[index].status}`);
  }

  res.status(200).json({
    message: 'Resource updated successfully',
    resource: resources[index],
    replanResult
  });
};

const getHospitals = (req, res) => {
  const hospitals = mockData.getHospitals();
  res.status(200).json(hospitals);
};

const getShelters = (req, res) => {
  const shelters = mockData.getShelters();
  res.status(200).json(shelters);
};

module.exports = {
  getResources,
  getAvailableResources,
  createResource,
  updateResource,
  getHospitals,
  getShelters
};
