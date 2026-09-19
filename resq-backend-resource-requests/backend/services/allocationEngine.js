const { calculateDistance } = require('../utils/distance');
const {
  calculateDynamicPriority,
  getCompatibilityScore,
  getWeatherRiskPenalty,
  calculateETA,
  calculateScore
} = require('../utils/scoring');
const mockData = require('../data/mockData');

/**
 * RESQ Allocation Engine
 *
 * 1. Calculate a deterministic priority for every active emergency.
 * 2. Process emergencies from highest priority to lowest.
 * 3. For each emergency, choose the nearest AVAILABLE resource that is suitable.
 * 4. Return a direct response path from the resource to the affected location.
 * 5. Replanning releases previous automatic assignments and calculates a new plan.
 */
function runAllocationEngine(
  overrideEmergencies = null,
  overrideResources = null,
  overrideWeather = null,
  triggerEvent = 'Automatic Allocation'
) {
  const emergencies = overrideEmergencies || mockData.getEmergencies();
  const resources = overrideResources || mockData.getResources();
  const weather = overrideWeather || mockData.getWeather();

  // Replanning: clear previous automatic assignments so a newly submitted
  // high-priority emergency can take the nearest suitable unit and displace
  // a lower-priority assignment.
  resources.forEach((resource) => {
    if ((resource.status || '').toUpperCase() === 'ASSIGNED' && resource.currentEmergencyId) {
      resource.status = 'Available';
      resource.availability = true;
      resource.currentEmergencyId = null;
    }
  });

  emergencies.forEach((emergency) => {
    if (!['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(String(emergency.status || '').toUpperCase())) {
      emergency.status = 'Pending';
    }

    const { priorityScore, priorityReason } = calculateDynamicPriority(emergency);
    emergency.priorityScore = priorityScore;
    emergency.priorityReason = priorityReason;
  });

  const activeEmergencies = emergencies
    .filter((emergency) => !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(String(emergency.status || '').toUpperCase()))
    .sort((a, b) => b.priorityScore - a.priorityScore || new Date(a.createdAt) - new Date(b.createdAt));

  const assignedResourceIds = new Set();
  const newAllocations = [];
  const unassignedEmergencies = [];

  for (const emergency of activeEmergencies) {
    const candidates = [];

    for (const resource of resources) {
      if (assignedResourceIds.has(resource.id)) continue;
      if ((resource.status || '').toUpperCase() !== 'AVAILABLE') continue;

      const distanceKm = calculateDistance(
        emergency.latitude,
        emergency.longitude,
        resource.latitude,
        resource.longitude
      );

      const compatibility = getCompatibilityScore(
        emergency.requiredResource,
        resource.type,
        resource.capabilities || []
      );

      if (compatibility < 60) continue;

      const weatherPenalty = getWeatherRiskPenalty(
        weather,
        resource.type,
        emergency.accessibility
      );

      const etaMinutes = calculateETA(distanceKm, resource.speed);
      const score = calculateScore({
        priorityScore: emergency.priorityScore,
        compatibility,
        distanceKm,
        etaMinutes,
        weatherRiskPenalty: weatherPenalty
      });

      candidates.push({
        resource,
        distanceKm,
        etaMinutes,
        compatibility,
        weatherPenalty,
        score
      });
    }

    // Priority was already handled at the emergency level. For the selected
    // emergency, nearest suitable resource wins; score is only the tie-breaker.
    candidates.sort((a, b) =>
      a.distanceKm - b.distanceKm ||
      b.compatibility - a.compatibility ||
      b.score - a.score
    );

    const bestCandidate = candidates[0];

    if (!bestCandidate) {
      emergency.status = 'Waiting';
      unassignedEmergencies.push({
        emergencyId: emergency.id,
        emergencyTitle: emergency.title,
        userId: emergency.userId || null,
        priorityScore: emergency.priorityScore,
        priorityReason: emergency.priorityReason,
        requiredResource: emergency.requiredResource,
        peopleAffected: emergency.peopleAffected,
        status: 'Waiting',
        reason: 'NO SUITABLE RESOURCE AVAILABLE'
      });
      continue;
    }

    const { resource, distanceKm, etaMinutes, compatibility, weatherPenalty, score } = bestCandidate;
    assignedResourceIds.add(resource.id);

    resource.status = 'Assigned';
    resource.availability = false;
    resource.currentEmergencyId = emergency.id;
    emergency.status = 'Assigned';

    const route = [
      [Number(resource.latitude), Number(resource.longitude)],
      [Number(emergency.latitude), Number(emergency.longitude)]
    ];

    const reasons = [
      emergency.priorityReason,
      `Nearest suitable resource: ${resource.name}`,
      `Direct path distance: ${distanceKm} km`,
      `Estimated response time: ${etaMinutes} min`,
      `Compatibility: ${compatibility}/100`,
      `Accessibility: ${emergency.accessibility || 'UNKNOWN'}`
    ];

    if (weatherPenalty > 0) reasons.push(`Weather/access penalty: ${weatherPenalty}`);

    newAllocations.push({
      emergencyId: emergency.id,
      emergencyTitle: emergency.title,
      userId: emergency.userId || null,
      location: emergency.location || emergency.resolvedLocation || null,
      latitude: Number(emergency.latitude),
      longitude: Number(emergency.longitude),
      priorityScore: emergency.priorityScore,
      priorityReason: emergency.priorityReason,
      severity: emergency.severity || emergency.urgency,
      peopleAffected: emergency.peopleAffected,
      vulnerablePeople: emergency.vulnerablePeople || 0,
      resourceId: resource.id,
      resourceName: resource.name,
      resourceType: resource.type,
      resourceStatus: resource.status,
      resourceLatitude: Number(resource.latitude),
      resourceLongitude: Number(resource.longitude),
      distanceKm,
      eta: etaMinutes,
      score,
      pathType: 'DIRECT',
      route,
      reasons,
      approvalStatus: 'APPROVED'
    });
  }

  const history = mockData.getPlanHistory();
  const previousPlan = history.length > 0 ? history[history.length - 1] : null;
  const nextVersionNumber = history.length + 1;
  const versionTag = `PLAN V${nextVersionNumber}`;
  const changesFromPrevious = [];

  if (previousPlan) {
    const prevMap = {};
    (previousPlan.allocations || []).forEach((allocation) => {
      prevMap[allocation.emergencyId] = allocation;
    });

    newAllocations.forEach((allocation) => {
      const previous = prevMap[allocation.emergencyId];
      const previousResource = previous ? previous.resourceName : 'Unassigned / Waiting';

      if (previousResource !== allocation.resourceName) {
        changesFromPrevious.push({
          emergencyId: allocation.emergencyId,
          emergencyTitle: allocation.emergencyTitle,
          oldResource: previousResource,
          newResource: allocation.resourceName,
          priorityScore: allocation.priorityScore,
          reasons: allocation.reasons
        });
      }
    });

    unassignedEmergencies.forEach((waiting) => {
      const previous = prevMap[waiting.emergencyId];
      if (previous && previous.resourceName) {
        changesFromPrevious.push({
          emergencyId: waiting.emergencyId,
          emergencyTitle: waiting.emergencyTitle,
          oldResource: previous.resourceName,
          newResource: 'Waiting (NO SUITABLE RESOURCE AVAILABLE)',
          priorityScore: waiting.priorityScore,
          reasons: [waiting.reason]
        });
      }
    });
  }

  const newPlanVersion = {
    version: versionTag,
    timestamp: new Date().toISOString(),
    triggerEvent,
    allocations: newAllocations,
    unassignedEmergencies,
    changesFromPrevious
  };

  history.push(newPlanVersion);
  mockData.setPlanHistory(history);
  mockData.setAllocations(newAllocations);
  mockData.setResources(resources);
  mockData.setEmergencies(emergencies);

  return {
    planVersion: newPlanVersion,
    allocations: newAllocations,
    unassignedEmergencies,
    changesFromPrevious
  };
}

module.exports = { runAllocationEngine };
