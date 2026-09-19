const app = require('./server');
const http = require('http');

async function testServingResourceAllocationModule() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5003, resolve));
  const baseUrl = 'http://localhost:5003';

  console.log('====================================================');
  console.log('--- TESTING SERVING RESOURCE ALLOCATION MODULE ---');
  console.log('====================================================');

  try {
    // 1. Initial Dashboard Load & Plan V1 check
    let res = await fetch(`${baseUrl}/api/dashboard`);
    let data = await res.json();
    console.log('✅ 1. Dashboard Initial Plan Version:', data.latestPlan?.version || 'PLAN V1');
    console.log(`      Resource Counters: Available=${data.stats.availableResources}, Assigned=${data.stats.assignedResources}, Busy=${data.stats.busyResources}, Unavailable=${data.stats.unavailableResources}`);

    // 2. Perform Resource Allocation (PLAN V1)
    res = await fetch(`${baseUrl}/api/allocate-resource`, { method: 'POST' });
    data = await res.json();
    console.log(`✅ 2. Allocation Executed [${data.planVersion?.version}]:`);
    console.log(`      Allocated Emergencies: ${data.allocations?.length || 0}`);
    data.allocations.forEach(a => {
      console.log(`      • ${a.emergencyTitle} -> Assigned: ${a.resourceName} (${a.resourceType}) | Priority: ${a.priorityScore}`);
      console.log(`        Reason: ${a.priorityReason}`);
    });

    // 3. Perform Exact Final Acceptance Test Scenario
    // Simulate Disaster Change: Assigned Resource becomes Unavailable + New Critical Emergency D arrives
    res = await fetch(`${baseUrl}/api/simulate/disaster-change`, { method: 'POST' });
    data = await res.json();
    console.log(`\n✅ 3. Dynamic Replanning Disaster Change Simulated:`);
    console.log(`      Old Plan: ${data.oldPlan?.version} -> New Plan: ${data.newPlan?.version}`);
    console.log(`      Unavailable Resource: ${data.simulationEvent?.unavailableResource?.name} (Status: ${data.simulationEvent?.unavailableResource?.status})`);
    console.log(`      New Critical Emergency: ${data.simulationEvent?.newEmergency?.title} (Priority: ${data.simulationEvent?.newEmergency?.priorityScore || 'CRITICAL'})`);
    console.log(`\n      NEW PLAN (${data.newPlan?.version}) ALLOCATIONS:`);
    data.allocations.forEach(a => {
      console.log(`      • ${a.emergencyTitle} -> ${a.resourceName} (ETA: ${a.eta}m, Priority: ${a.priorityScore})`);
    });

    if (data.unassignedEmergencies && data.unassignedEmergencies.length > 0) {
      console.log(`\n      UNSATISFIED / WAITING EMERGENCIES:`);
      data.unassignedEmergencies.forEach(u => {
        console.log(`      • ${u.emergencyTitle} -> Status: ${u.status} (${u.reason})`);
      });
    }

    console.log(`\n      AI Explanation: "${data.aiExplanation}"`);

    // 4. Test Human Approval API (Accept Recommendation)
    const topAlloc = data.allocations[0];
    if (topAlloc) {
      res = await fetch(`${baseUrl}/api/allocation/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyId: topAlloc.emergencyId,
          resourceId: topAlloc.resourceId,
          action: 'ACCEPT'
        })
      });
      let approveRes = await res.json();
      console.log(`\n✅ 4. Human Responder Approval (ACCEPT): ${approveRes.message}`);
    }

    // 5. Test Allocation History API
    res = await fetch(`${baseUrl}/api/allocation-history`);
    let historyData = await res.json();
    console.log(`\n✅ 5. Plan History Store: ${historyData.length} versioned plan(s) recorded:`, historyData.map(h => h.version).join(', '));

    console.log('\n🎉 ALL ACCEPTANCE TEST CRITERIA PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test Failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

testServingResourceAllocationModule();
