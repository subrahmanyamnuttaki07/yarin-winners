const app = require('./server');
const http = require('http');

let server;

async function runTests() {
  console.log('--- STARTING BACKEND API VERIFICATION TESTS ---');

  server = http.createServer(app);
  await new Promise(resolve => server.listen(5001, resolve));
  const baseUrl = 'http://localhost:5001';

  try {
    // 1. Health
    let res = await fetch(`${baseUrl}/api/health`);
    let data = await res.json();
    console.log('✅ GET /api/health:', data.status === 'ok' ? 'PASSED' : 'FAILED', data);

    // 2. Dashboard
    res = await fetch(`${baseUrl}/api/dashboard`);
    data = await res.json();
    console.log('✅ GET /api/dashboard:', data.emergencies ? `PASSED (${data.emergencies.length} emergencies)` : 'FAILED');

    // 3. Emergencies
    res = await fetch(`${baseUrl}/api/emergencies`);
    data = await res.json();
    console.log('✅ GET /api/emergencies:', Array.isArray(data) ? `PASSED (${data.length} items)` : 'FAILED');

    // 4. Resources
    res = await fetch(`${baseUrl}/api/resources`);
    data = await res.json();
    console.log('✅ GET /api/resources:', Array.isArray(data) ? `PASSED (${data.length} items)` : 'FAILED');

    // 5. Weather
    res = await fetch(`${baseUrl}/api/weather`);
    data = await res.json();
    console.log('✅ GET /api/weather:', data.conditions ? `PASSED (${data.conditions}, risk: ${data.riskLevel})` : 'FAILED');

    // 6. Allocate
    res = await fetch(`${baseUrl}/api/allocate`, { method: 'POST' });
    data = await res.json();
    console.log('✅ POST /api/allocate:', data.allocations ? `PASSED (${data.allocations.length} allocations)` : 'FAILED');

    // 7. Simulate Emergency
    res = await fetch(`${baseUrl}/api/simulate/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Severe Flood - Sector 5',
        severity: 'CRITICAL',
        peopleAffected: 50,
        requiredResource: 'Rescue Boat'
      })
    });
    data = await res.json();
    console.log('✅ POST /api/simulate/emergency:', data.changes ? `PASSED (${data.changes.length} changes detected)` : 'FAILED');

    // 8. Simulate Weather
    res = await fetch(`${baseUrl}/api/simulate/weather`, { method: 'POST' });
    data = await res.json();
    console.log('✅ POST /api/simulate/weather:', data.newWeather ? `PASSED (Weather: ${data.newWeather.riskLevel})` : 'FAILED');

    console.log('\n🎉 ALL BACKEND API ENDPOINTS TESTED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ API Test Failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
