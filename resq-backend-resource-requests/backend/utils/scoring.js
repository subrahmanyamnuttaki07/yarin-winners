/**
 * RESQ deterministic, explainable priority + allocation scoring.
 * Priority is calculated from report factors before resources are considered.
 */

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getSeverityScore(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL': return 100;
    case 'HIGH': return 75;
    case 'MEDIUM': return 50;
    case 'LOW': return 25;
    default: return 50;
  }
}

function getPeopleAffectedScore(peopleAffected) {
  const count = Math.max(0, Number(peopleAffected) || 0);
  // 200+ affected people saturates this factor at 100.
  return clamp(Math.round((count / 200) * 100));
}

function getVulnerabilityScore(vulnerablePeople, peopleAffected) {
  const vulnerable = Math.max(0, Number(vulnerablePeople) || 0);
  const affected = Math.max(1, Number(peopleAffected) || 1);
  const ratioScore = (vulnerable / affected) * 100;
  const absoluteScore = Math.min(100, vulnerable * 2.5);
  return clamp(Math.round(Math.max(ratioScore, absoluteScore)));
}

function getAccessibilityScore(accessibility) {
  switch ((accessibility || '').toUpperCase()) {
    case 'ACCESSIBLE': return 100;
    case 'PARTIAL': return 60;
    case 'BLOCKED': return 25;
    default: return 75;
  }
}

function calculateDynamicPriority(emergency) {
  const severityScore = getSeverityScore(emergency.severity || emergency.urgency);
  const peopleScore = getPeopleAffectedScore(emergency.peopleAffected);
  const vulnerabilityScore = getVulnerabilityScore(emergency.vulnerablePeople, emergency.peopleAffected);
  const accessibilityScore = getAccessibilityScore(emergency.accessibility);

  const isMedical = Boolean(emergency.medicalRequirement) ||
    /medical|ambulance/i.test(emergency.requiredResource || '') ||
    /medical|ambulance/i.test(emergency.disasterType || '');

  const medicalScore = isMedical ? 100 : 0;

  // Explainable weights. The report itself determines priority; resource distance
  // is intentionally handled later by the allocation stage.
  const weighted =
    severityScore * 0.35 +
    peopleScore * 0.30 +
    vulnerabilityScore * 0.20 +
    accessibilityScore * 0.10 +
    medicalScore * 0.05;

  const priorityScore = Math.round(clamp(weighted));

  const reasons = [
    `severity ${severityScore}/100 × 35%`,
    `${Number(emergency.peopleAffected) || 0} people affected → ${peopleScore}/100 × 30%`,
    `${Number(emergency.vulnerablePeople) || 0} vulnerable people → ${vulnerabilityScore}/100 × 20%`,
    `accessibility ${emergency.accessibility || 'UNKNOWN'} → ${accessibilityScore}/100 × 10%`
  ];

  if (isMedical) reasons.push('medical requirement → +5% factor');

  return {
    priorityScore,
    priorityReason: `Priority ${priorityScore}/100. ${reasons.join('; ')}.`
  };
}

function getCompatibilityScore(requiredResource, resourceType, resourceCapabilities = []) {
  const req = (requiredResource || '').toLowerCase().trim();
  const res = (resourceType || '').toLowerCase().trim();
  const capabilities = resourceCapabilities.map((value) => String(value).toLowerCase());

  if (req === res) return 100;
  if (req.includes('boat') && res.includes('boat')) return 100;
  if (req.includes('boat') && (res.includes('rescue team') || capabilities.includes('water_rescue'))) return 85;
  if (req.includes('fire') && res.includes('fire')) return 100;
  if (req.includes('medical') && (res.includes('ambulance') || res.includes('medical'))) return 100;
  if (req.includes('team') && res.includes('rescue team')) return 95;
  if (req.includes('rescue team') && res.includes('boat')) return 60;

  return 20;
}

function getWeatherRiskPenalty(weather, resourceType, accessibility) {
  let penalty = 0;
  const risk = String(weather?.riskLevel || '').toUpperCase();
  const severe = risk === 'HIGH' || risk === 'SEVERE' || Number(weather?.rainfall) > 50;
  const resLower = (resourceType || '').toLowerCase();

  if (severe && (resLower.includes('ambulance') || resLower.includes('truck'))) penalty += 25;
  if (String(accessibility).toUpperCase() === 'BLOCKED' && !resLower.includes('boat')) penalty += 40;

  return penalty;
}

function calculateETA(distanceKm, speedKmh) {
  const speed = speedKmh && speedKmh > 0 ? speedKmh : 40;
  return Math.max(2, Math.round((distanceKm / speed) * 60));
}

function calculateScore({ priorityScore, compatibility, distanceKm, etaMinutes, weatherRiskPenalty }) {
  // Priority is the dominant factor. Distance selects the nearest suitable
  // resource among similarly ranked emergencies rather than overriding priority.
  const distancePenalty = Math.min(25, distanceKm * 0.8);
  const responseTimePenalty = Math.min(15, etaMinutes * 0.5);
  const totalScore =
    priorityScore * 0.55 +
    compatibility * 0.35 -
    distancePenalty -
    responseTimePenalty -
    weatherRiskPenalty * 0.25;

  return Math.round(clamp(totalScore, 1, 100));
}

module.exports = {
  calculateDynamicPriority,
  getSeverityScore,
  getPeopleAffectedScore,
  getVulnerabilityScore,
  getAccessibilityScore,
  getCompatibilityScore,
  getWeatherRiskPenalty,
  calculateETA,
  calculateScore
};
