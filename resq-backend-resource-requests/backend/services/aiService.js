const dotenv = require('dotenv');
dotenv.config();

/**
 * AI Service for Generating Natural Language Allocation & Reallocation Explanations
 * Uses Google Gemini API if key is present; falls back to deterministic template generation.
 */
async function generateAllocationExplanation(allocation, changes = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Build baseline deterministic fallback explanation
  const fallbackExplanation = buildFallbackExplanation(allocation, changes);

  if (!apiKey || apiKey.trim() === '') {
    return fallbackExplanation;
  }

  try {
    const promptText = `You are the AI Command Officer for RESQ Disaster Response System.
Provide a concise 2-sentence explanation of why the following resource allocation or dynamic reallocation occurred.

Allocation Details:
${JSON.stringify(allocation, null, 2)}

Reallocation Changes:
${JSON.stringify(changes, null, 2)}

Explain clearly and professionally without jargon. Focus on urgency, location proximity, severity, and road/weather conditions.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    if (!response.ok) {
      console.warn('[AI Service] Gemini API returned error status:', response.status);
      return fallbackExplanation;
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText && candidateText.trim().length > 0) {
      return candidateText.trim();
    }

    return fallbackExplanation;
  } catch (err) {
    console.warn('[AI Service] Gemini API request failed, using fallback explanation:', err.message);
    return fallbackExplanation;
  }
}

function buildFallbackExplanation(allocation, changes = []) {
  if (changes && changes.length > 0) {
    const change = changes[0];
    const oldName = change.oldResourceName || change.oldResource || 'Unassigned';
    const newName = change.newResourceName || change.newResource || 'New Unit';
    const reasonsStr = change.reasons ? change.reasons.join('. ') : 'Priority score recalculated.';
    return `Reallocation Triggered: Reassigned from ${oldName} to ${newName} for emergency ${change.emergencyId} (${change.severity || 'HIGH'} severity). Key factors: ${reasonsStr}.`;
  }

  if (allocation && allocation.length > 0) {
    const top = allocation[0];
    return `${top.resourceName || 'Resource'} assigned to ${top.emergencyTitle || top.emergencyId} because it is a ${top.severity} severity emergency requiring immediate response. Estimated response time is ${top.eta || 10} minutes.`;
  }

  return 'Optimal resource allocation completed based on emergency severity, distance, capacity, and current route accessibility.';
}

module.exports = {
  generateAllocationExplanation
};
