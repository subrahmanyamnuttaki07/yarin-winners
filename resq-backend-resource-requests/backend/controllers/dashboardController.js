const mockData = require('../data/mockData');
const { runAllocationEngine } = require('../services/allocationEngine');

const getDashboardData = (req, res) => {
  const emergencies = mockData.getEmergencies();
  const resources = mockData.getResources();
  const hospitals = mockData.getHospitals();
  const shelters = mockData.getShelters();
  const weather = mockData.getWeather();
  const routes = mockData.getRoutes();
  const resourceRequests = mockData.getResourceRequests();

  let history = mockData.getPlanHistory();
  if (history.length === 0) {
    runAllocationEngine(null, null, null, 'Initial System Load');
    history = mockData.getPlanHistory();
  }

  const latestPlan = history.length > 0 ? history[history.length - 1] : null;
  const allocations = latestPlan ? latestPlan.allocations : mockData.getAllocations();
  const unassignedEmergencies = latestPlan ? latestPlan.unassignedEmergencies : [];

  // Resource status counters
  const totalResources = resources.length;
  const availableResources = resources.filter(r => (r.status || '').toUpperCase() === 'AVAILABLE').length;
  const assignedResources = resources.filter(r => (r.status || '').toUpperCase() === 'ASSIGNED').length;
  const busyResources = resources.filter(r => (r.status || '').toUpperCase() === 'BUSY' || (r.status || '').toUpperCase() === 'TRAVELLING').length;
  const unavailableResources = resources.filter(r => (r.status || '').toUpperCase() === 'UNAVAILABLE').length;

  // Emergency status counters
  const activeEmergencies = emergencies.filter(e => e.status !== 'Completed' && e.status !== 'RESOLVED').length;
  const critical = emergencies.filter(e => (e.severity === 'CRITICAL' || e.urgency === 'CRITICAL') && e.status !== 'Completed').length;
  const pending = emergencies.filter(e => e.status === 'Pending').length;
  const waitingEmergencies = emergencies.filter(e => e.status === 'Waiting').length;

  res.status(200).json({
    emergencies,
    resources,
    hospitals,
    shelters,
    weather,
    routes,
    resourceRequests,
    allocations,
    unassignedEmergencies,
    latestPlan,
    planHistory: history,
    stats: {
      totalResources,
      availableResources,
      assignedResources,
      busyResources,
      unavailableResources,
      activeEmergencies,
      critical,
      pending,
      waitingEmergencies
    }
  });
};

module.exports = {
  getDashboardData
};
