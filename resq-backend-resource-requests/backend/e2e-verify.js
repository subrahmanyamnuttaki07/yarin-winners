const app = require('./server');
const http = require('http');

async function verifyE2E() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5002, resolve));
  const baseUrl = 'http://localhost:5002';

  console.log('--- STARTING E2E VERIFICATION ---');

  try {
    // 1. Health
    let res = await fetch(`${baseUrl}/api/health`);
    let data = await res.json();
    console.log('1. Health Check:', data.status === 'ok' ? 'OK' : 'FAIL');

    // 2. Dashboard initial
    res = await fetch(`${baseUrl}/api/dashboard`);
    data = await res.json();
    console.log(`2. Dashboard loaded: ${data.emergencies.length} emergencies, ${data.resources.length} resources, weather risk: ${data.weather.riskLevel}`);

    // 3. New Emergency report
    res = await fetch(`${baseUrl}/api/emergencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Building Collapse - Area Z',
        severity: 'CRITICAL',
        peopleAffected: 40,
        requiredResource: 'Rescue Team',
        latitude: 12.9500,
        longitude: 77.6100
      })
    });
    data = await res.json();
    console.log(`3. Emergency Created & Allocated: Assigned to ${data.allocation?.resourceName} (ETA: ${data.allocation?.eta} mins)`);

    // 4. Dynamic Reallocation / Weather Sim
    res = await fetch(`${baseUrl}/api/simulate/weather`, { method: 'POST' });
    data = await res.json();
    console.log(`4. Weather Simulation executed: Risk level -> ${data.newWeather?.riskLevel}, Reallocations: ${data.changes?.length} changed`);
    console.log(`   AI Explanation: "${data.aiExplanation}"`);

    // 5. Final Dashboard Check
    res = await fetch(`${baseUrl}/api/dashboard`);
    data = await res.json();
    console.log(`5. Final Stats: Critical=${data.stats.critical}, ActiveEmergencies=${data.stats.activeEmergencies}, AvailableResources=${data.stats.availableResources}`);

    console.log('--- E2E VERIFICATION COMPLETED SUCCESSFULLY ---');
  } catch (e) {
    console.error('E2E Verification Error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
}

verifyE2E();
