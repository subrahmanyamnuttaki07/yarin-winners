import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getDashboard = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getEmergencies = async () => {
  const response = await api.get('/emergencies');
  return response.data;
};

export const getEmergencyById = async (id) => {
  const response = await api.get(`/emergencies/${id}`);
  return response.data;
};

export const createEmergency = async (data) => {
  const response = await api.post('/emergencies', data);
  return response.data;
};

export const updateEmergency = async (id, data) => {
  const response = await api.patch(`/emergencies/${id}`, data);
  return response.data;
};

export const getResources = async () => {
  const response = await api.get('/resources');
  return response.data;
};

export const getAvailableResources = async () => {
  const response = await api.get('/resources/available');
  return response.data;
};

export const updateResource = async (id, data) => {
  const response = await api.put(`/resources/${id}`, data);
  return response.data;
};

export const getHospitals = async () => {
  const response = await api.get('/hospitals');
  return response.data;
};

export const getShelters = async () => {
  const response = await api.get('/shelters');
  return response.data;
};

export const getWeather = async () => {
  const response = await api.get('/weather');
  return response.data;
};

export const allocateResources = async () => {
  const response = await api.post('/allocate-resource');
  return response.data;
};

export const replanResources = async () => {
  const response = await api.post('/replan');
  return response.data;
};

export const getLatestPlan = async () => {
  const response = await api.get('/allocation-plan');
  return response.data;
};

export const getPlanHistory = async () => {
  const response = await api.get('/allocation-history');
  return response.data;
};

export const approveAllocation = async (data) => {
  const response = await api.post('/allocation/approve', data);
  return response.data;
};

export const manualAllocation = async (data) => {
  const response = await api.post('/allocation/manual', data);
  return response.data;
};

export const simulateDisasterChange = async () => {
  const response = await api.post('/simulate/disaster-change');
  return response.data;
};

export const simulateEmergency = async (data = {}) => {
  const response = await api.post('/simulate/emergency', data);
  return response.data;
};

export const simulateWeather = async () => {
  const response = await api.post('/simulate/weather');
  return response.data;
};

export const getGovernmentActions = async () => {
  const response = await api.get('/government/actions');
  return response.data;
};

export const createGovernmentAction = async (data) => {
  const response = await api.post('/government/actions', data);
  return response.data;
};

export const getGovernmentSummary = async () => {
  const response = await api.get('/government/summary');
  return response.data;
};

export const completeEmergency = async (id) => {
  const response = await api.patch(`/emergencies/${id}`, { status: 'Completed' });
  return response.data;
};
export const getResourceRequests = async () => {
  const response = await api.get('/resource-requests');
  return response.data;
};

export const createResourceRequest = async (data) => {
  const response = await api.post('/resource-requests', data);
  return response.data;
};

export const updateResourceRequest = async (id, status) => {
  const action = status === 'ACCEPTED' ? 'ACCEPT' : 'REJECT';

  const response = await api.patch(`/resource-requests/${id}`, {
    action,
    reviewedBy: 'Government'
  });

  return response.data;
};
export default api;
