// Mutable in-memory prototype data store for the RESQ hackathon demo.

let emergencies = [
  {
    id: 'E101',
    userId: 'DEMO-001',
    title: 'Flood — Vijayawada River Zone',
    location: 'Vijayawada',
    resolvedLocation: 'Vijayawada',
    locationSource: 'demo-seed',
    latitude: 16.5062,
    longitude: 80.6480,
    disasterType: 'Flood / Water Inundation',
    severity: 'HIGH',
    urgency: 'HIGH',
    peopleAffected: 120,
    vulnerablePeople: 32,
    medicalRequirement: false,
    status: 'Pending',
    requiredResource: 'Rescue Boat',
    accessibility: 'PARTIAL',
    description: 'Flood water reported around residential streets.',
    priorityScore: 0,
    priorityReason: '',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'E102',
    userId: 'DEMO-002',
    title: 'Building Collapse — Guntur',
    location: 'Guntur',
    resolvedLocation: 'Guntur',
    locationSource: 'demo-seed',
    latitude: 16.3067,
    longitude: 80.4365,
    disasterType: 'Earthquake / Building Collapse',
    severity: 'CRITICAL',
    urgency: 'CRITICAL',
    peopleAffected: 35,
    vulnerablePeople: 12,
    medicalRequirement: true,
    status: 'Pending',
    requiredResource: 'Rescue Team',
    accessibility: 'PARTIAL',
    description: 'People may be trapped inside a damaged structure.',
    priorityScore: 0,
    priorityReason: '',
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    id: 'E103',
    userId: 'DEMO-003',
    title: 'Medical Shortage — Kakinada',
    location: 'Kakinada',
    resolvedLocation: 'Kakinada',
    locationSource: 'demo-seed',
    latitude: 16.9891,
    longitude: 82.2475,
    disasterType: 'Medical Emergency',
    severity: 'MEDIUM',
    urgency: 'MEDIUM',
    peopleAffected: 80,
    vulnerablePeople: 25,
    medicalRequirement: true,
    status: 'Pending',
    requiredResource: 'Medical Team',
    accessibility: 'ACCESSIBLE',
    description: 'Field medical support requested.',
    priorityScore: 0,
    priorityReason: '',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

let resources = [
  {
    id: 'R01',
    name: 'Rescue Team Alpha',
    type: 'Rescue Team',
    latitude: 16.5200,
    longitude: 80.6200,
    status: 'Available',
    capacity: 30,
    capabilities: ['debris_search', 'heavy_lifting', 'water_rescue'],
    availability: true,
    speed: 45,
    currentEmergencyId: null
  },
  {
    id: 'R02',
    name: 'Ambulance Unit 03',
    type: 'Ambulance',
    latitude: 16.5000,
    longitude: 80.6500,
    status: 'Available',
    capacity: 4,
    capabilities: ['medical_evacuation', 'triage'],
    availability: true,
    speed: 60,
    currentEmergencyId: null
  },
  {
    id: 'R03',
    name: 'Fire Truck 05',
    type: 'Fire Truck',
    latitude: 16.5400,
    longitude: 80.6400,
    status: 'Available',
    capacity: 6,
    capabilities: ['firefighting', 'hazard_containment'],
    availability: true,
    speed: 50,
    currentEmergencyId: null
  },
  {
    id: 'R04',
    name: 'Rescue Team Beta',
    type: 'Rescue Team',
    latitude: 16.3000,
    longitude: 80.4400,
    status: 'Available',
    capacity: 25,
    capabilities: ['debris_search', 'heavy_lifting', 'water_rescue'],
    availability: true,
    speed: 45,
    currentEmergencyId: null
  },
  {
    id: 'R05',
    name: 'Medical Team Delta',
    type: 'Medical Team',
    latitude: 17.0000,
    longitude: 82.2400,
    status: 'Available',
    capacity: 12,
    capabilities: ['first_aid', 'field_medicine', 'triage'],
    availability: true,
    speed: 55,
    currentEmergencyId: null
  },
  {
    id: 'R06',
    name: 'Rescue Boat Bravo',
    type: 'Rescue Boat',
    latitude: 16.9900,
    longitude: 82.2500,
    status: 'Available',
    capacity: 30,
    capabilities: ['water_rescue', 'flood_evacuation'],
    availability: true,
    speed: 32,
    currentEmergencyId: null
  },
  {
    id: 'R07',
    name: 'Rescue Team Charlie',
    type: 'Rescue Team',
    latitude: 17.6868,
    longitude: 83.2185,
    status: 'Available',
    capacity: 35,
    capabilities: ['debris_search', 'heavy_lifting', 'water_rescue'],
    availability: true,
    speed: 45,
    currentEmergencyId: null
  }
];

let hospitals = [
  { id: 'H01', name: 'Vijayawada General Hospital', latitude: 16.5150, longitude: 80.6400, capacity: 300, availableBeds: 75, contact: '108', status: 'OPERATIONAL' },
  { id: 'H02', name: 'Kakinada Trauma Center', latitude: 16.9900, longitude: 82.2450, capacity: 220, availableBeds: 48, contact: '108', status: 'OPERATIONAL' }
];

let shelters = [
  { id: 'S01', name: 'Vijayawada Relief Shelter A', latitude: 16.5200, longitude: 80.6000, capacity: 500, currentOccupancy: 180, status: 'OPEN' },
  { id: 'S02', name: 'Guntur Community Shelter', latitude: 16.3100, longitude: 80.4300, capacity: 350, currentOccupancy: 95, status: 'OPEN' }
];

let weather = {
  temperature: 28,
  rainfall: 15,
  windSpeed: 22,
  precipitationProbability: 40,
  conditions: 'Moderate Rain',
  riskLevel: 'MODERATE'
};

let routes = [];
let allocations = [];
let planHistory = [];
let governmentActions = [];
let resourceRequests = [];

module.exports = {
  getEmergencies: () => emergencies,
  setEmergencies: (data) => { emergencies = data; },
  getResources: () => resources,
  setResources: (data) => { resources = data; },
  getHospitals: () => hospitals,
  setHospitals: (data) => { hospitals = data; },
  getShelters: () => shelters,
  setShelters: (data) => { shelters = data; },
  getWeather: () => weather,
  setWeather: (data) => { weather = data; },
  getRoutes: () => routes,
  setRoutes: (data) => { routes = data; },
  getAllocations: () => allocations,
  setAllocations: (data) => { allocations = data; },
  getPlanHistory: () => planHistory,
  setPlanHistory: (data) => { planHistory = data; },
  getGovernmentActions: () => governmentActions,
  setGovernmentActions: (data) => { governmentActions = data; },
  getResourceRequests: () => resourceRequests,
  setResourceRequests: (data) => { resourceRequests = data; }
};
