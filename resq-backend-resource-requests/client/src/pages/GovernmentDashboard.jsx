import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getDashboard,
  getGovernmentActions,
  createGovernmentAction,
  getGovernmentSummary,
  getResourceRequests,
  updateResourceRequest
} from "../services/api";
import "../index.css";

function GovernmentDashboard() {
  const [resourceRequests, setResourceRequests] = useState([]);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const fetchGovernmentData = async () => {
  try {
    const [dashRes, actRes, sumRes, requestRes] = await Promise.all([
      getDashboard(),
      getGovernmentActions(),
      getGovernmentSummary(),
      getResourceRequests()
    ]);

    setData(dashRes);
    setActions(actRes || []);
    setSummaryData(sumRes || null);
    setResourceRequests(requestRes || []);
  } catch (err) {
    console.error("Government dashboard error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  fetchGovernmentData();

  const interval = setInterval(fetchGovernmentData, 3000);

  return () => clearInterval(interval);
}, []);

  const handleTriggerAction = async (actionType, defaultArea, defaultDesc) => {
    try {
      setActionFeedback(null);
      const res = await createGovernmentAction({
        type: actionType,
        area: defaultArea,
        emergencyId: data?.emergencies?.[0]?.id || "E101",
        description: defaultDesc,
        status: "Initiated"
      });

      setActionFeedback(`✅ ${defaultDesc} - Action Record #${res.action?.id} logged successfully.`);
      await fetchGovernmentData();
    } catch (err) {
      console.error("Trigger action error:", err);
      setActionFeedback("⚠️ Failed to execute government action.");
    }
  };
  
  const handleResourceDecision = async (requestId, status) => {
  try {
    await updateResourceRequest(requestId, status);

    setActionFeedback(
      status === "ACCEPTED"
        ? "✅ Resource request accepted."
        : "❌ Resource request rejected."
    );

    await fetchGovernmentData();
  } catch (err) {
    console.error("Resource decision error:", err);

    setActionFeedback(
      err.response?.data?.error ||
      "Failed to update resource request."
    );
  }
};
  const handleLogout = () => {
    localStorage.removeItem("resq_government_auth");
    navigate("/");
  };

  const emergencies = data?.emergencies || [];
  const resources = data?.resources || [];
  const hospitals = data?.hospitals || [];
  const shelters = data?.shelters || [];
  const weather = data?.weather || {};

  const totalAffected = emergencies.reduce((sum, e) => sum + (Number(e.peopleAffected) || 0), 0);
  const criticalCount = emergencies.filter(e => (e.severity || e.urgency) === 'CRITICAL').length;
  const deployedResources = resources.filter(r => (r.status || '').toLowerCase() !== 'available').length;
  const availableResources = resources.length - deployedResources;

  const totalHospitalBeds = hospitals.reduce((sum, h) => sum + (h.availableBeds || 0), 0);
  const totalHospitalCap = hospitals.reduce((sum, h) => sum + (h.capacity || 0), 0);

  const totalShelterOcc = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);
  const totalShelterCap = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0);

  return (
    <div className="app">
      {/* Executive Navbar */}
      <nav className="navbar" style={{ background: "rgba(15, 23, 42, 0.95)", borderBottom: "1px solid rgba(168, 85, 247, 0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🏛️</span>
          <div>
            <h2 style={{ fontSize: "18px", margin: 0, color: "#c084fc" }}>GOVERNMENT DISASTER MONITORING</h2>
            <p style={{ fontSize: "11px", margin: 0, color: "#94a3b8" }}>Executive Command & High-Level Strategic Coordination</p>
          </div>
        </div>

        <div className="nav-links">
          <a href="#overview" style={{ color: "#e2e8f0" }}>Overview</a>
          <a href="#map-section" style={{ color: "#e2e8f0" }}>Map</a>
          <a href="#actions-section" style={{ color: "#e2e8f0" }}>Actions</a>
          <a href="#capacity-section" style={{ color: "#e2e8f0" }}>Hospitals & Shelters</a>
          <a href="#log-section" style={{ color: "#e2e8f0" }}>Action Log</a>
          <button onClick={handleLogout} style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            Logout 🔒
          </button>
        </div>
      </nav>

      <main className="dashboard" style={{ maxWidth: "1250px", margin: "20px auto" }}>
        <section
  className="panel"
  style={{
    marginBottom: "30px",
    padding: "20px",
    border: "1px solid rgba(168,85,247,0.35)"
  }}
>
  <div className="panel-header">
    <h2 style={{ color: "#c084fc" }}>
      📡 Operator Resource Requests
    </h2>

    <span>
      {
        resourceRequests.filter(
          r => String(r.status).toUpperCase() === "PENDING"
        ).length
      } Pending
    </span>
  </div>

  {resourceRequests.length === 0 ? (
    <p style={{ color: "#94a3b8" }}>
      No resource requests received.
    </p>
  ) : (
    <div style={{ display: "grid", gap: "12px" }}>
      {resourceRequests.map((request) => {
        const status = String(
          request.status || "PENDING"
        ).toUpperCase();

        return (
          <div
            key={request.id}
            style={{
              background: "rgba(30,41,59,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "16px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px"
              }}
            >
              <div>
                <strong style={{ color: "white", fontSize: "16px" }}>
                  {request.resourceType} × {request.quantity}
                </strong>

                <p
                  style={{
                    margin: "6px 0",
                    color: "#94a3b8",
                    fontSize: "13px"
                  }}
                >
                  Emergency:{" "}
                  <strong>{request.emergencyId || "General"}</strong>
                </p>

                <p
                  style={{
                    margin: "6px 0",
                    color: "#cbd5e1",
                    fontSize: "13px"
                  }}
                >
                  Reason: {request.reason}
                </p>

                <p
                  style={{
                    margin: "6px 0",
                    color: "#64748b",
                    fontSize: "12px"
                  }}
                >
                  Requested by: {request.requestedBy || "Operator"}
                </p>
              </div>

              <span
                style={{
                  height: "fit-content",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "800",
                  background:
                    status === "ACCEPTED"
                      ? "rgba(16,185,129,0.2)"
                      : status === "REJECTED"
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(245,158,11,0.2)",
                  color:
                    status === "ACCEPTED"
                      ? "#34d399"
                      : status === "REJECTED"
                      ? "#f87171"
                      : "#fbbf24"
                }}
              >
                {status}
              </span>
            </div>

            {status === "PENDING" && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px"
                }}
              >
                <button
                  onClick={() =>
                    handleResourceDecision(
                      request.id,
                      "ACCEPTED"
                    )
                  }
                  style={{
                    background: "#059669",
                    color: "white",
                    border: "none",
                    padding: "9px 15px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: "700"
                  }}
                >
                  ✅ ACCEPT REQUEST
                </button>

                <button
                  onClick={() =>
                    handleResourceDecision(
                      request.id,
                      "REJECTED"
                    )
                  }
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "9px 15px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontWeight: "700"
                  }}
                >
                  ❌ REJECT
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</section>
        {/* Situation Summary Banner */}
        {summaryData && (
          <div className="banner-updated" style={{ background: "rgba(88, 28, 135, 0.4)", border: "1px solid rgba(168, 85, 247, 0.4)", marginBottom: "25px" }}>
            <h3 style={{ color: "#e9d5ff" }}><span>🤖</span> EXECUTIVE SITUATION SUMMARY</h3>
            <p style={{ margin: "6px 0 0 0", color: "#f3e8ff", fontSize: "14px", lineHeight: "1.6" }}>
              {summaryData.summary}
            </p>
          </div>
        )}

        {/* Top Executive Stats */}
        <section id="overview" className="resource-counters" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "25px" }}>
          <div className="counter-badge" style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{emergencies.length}</div>
            <div style={{ fontSize: "12px" }}>Active Emergencies</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#fbbf24", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{totalAffected}</div>
            <div style={{ fontSize: "12px" }}>People Affected</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{criticalCount}</div>
            <div style={{ fontSize: "12px" }}>Critical Emergencies</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{deployedResources}</div>
            <div style={{ fontSize: "12px" }}>Units Deployed</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{availableResources}</div>
            <div style={{ fontSize: "12px" }}>Units Available</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", color: "#c084fc", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{totalHospitalBeds} / {totalHospitalCap}</div>
            <div style={{ fontSize: "12px" }}>Hospital Beds Free</div>
          </div>

          <div className="counter-badge" style={{ background: "rgba(236, 72, 153, 0.15)", border: "1px solid rgba(236, 72, 153, 0.3)", color: "#f472b6", textAlign: "center", padding: "14px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900" }}>{totalShelterOcc} / {totalShelterCap}</div>
            <div style={{ fontSize: "12px" }}>Shelter Occupancy</div>
          </div>
        </section>

        {/* Strategic Government Action & Coordination Panel */}
        <section id="actions-section" className="panel" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(168, 85, 247, 0.3)", marginBottom: "30px", padding: "20px" }}>
          <div className="panel-header" style={{ marginBottom: "15px" }}>
            <h2 style={{ color: "#c084fc" }}>🏛️ Strategic Action & Policy Coordination</h2>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Executive Trigger Controls</span>
          </div>

          {actionFeedback && (
            <div className="alert" style={{ background: "#ecfdf5", borderLeft: "4px solid #10b981", color: "#065f46", marginBottom: "15px" }}>
              {actionFeedback}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            <button
              onClick={() => handleTriggerAction("REQUEST_RESOURCES", "North Zone", "Requested National Guard & 10 Additional Ambulances")}
              style={{ background: "#9333ea", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              🚀 REQUEST ADDITIONAL RESOURCES
            </button>

            <button
              onClick={() => handleTriggerAction("PRIORITIZE_AREA", "River Zone - Sector D", "Prioritized Critical Flash Flood Zone for Immediate Air Evacuation")}
              style={{ background: "#dc2626", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              🚨 PRIORITIZE CRITICAL AREA
            </button>

            <button
              onClick={() => handleTriggerAction("COORDINATE_MEDICAL", "East Medical Sector", "Coordinated Mobile Field Hospitals & Emergency Triage Support")}
              style={{ background: "#0284c7", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              🏥 COORDINATE MEDICAL SUPPORT
            </button>

            <button
              onClick={() => handleTriggerAction("REQUEST_SHELTER_CAPACITY", "Central District", "Requested Expansion of 500 Additional Emergency Shelter Beds")}
              style={{ background: "#d97706", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              🏠 REQUEST SHELTER CAPACITY
            </button>

            <button
              onClick={() => handleTriggerAction("SEND_RELIEF_SUPPORT", "South Sector", "Dispatched Food, Clean Water & Emergency Power Generators")}
              style={{ background: "#059669", color: "white", border: "none", padding: "12px 18px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
            >
              📦 SEND RELIEF SUPPORT
            </button>
          </div>
        </section>

        {/* Government Interactive Visual Map */}
        <section id="map-section" className="panel" style={{ marginBottom: "30px", padding: "20px" }}>
          <div className="panel-header">
            <h2>Government Visual Disaster Command Map</h2>
            <span>Regional Oversight</span>
          </div>

          <div className="map-placeholder" style={{ justifyContent: "flex-start", padding: "20px", overflow: "hidden", height: "400px", position: "relative" }}>
            <div style={{ position: "absolute", top: "15px", left: "20px", background: "rgba(15,23,42,0.9)", padding: "10px 15px", borderRadius: "8px", border: "1px solid #475569", fontSize: "12px", zIndex: 10, color: "#cbd5e1" }}>
              <strong>Executive Map Legend:</strong>
              <div style={{ marginTop: "4px" }}>
                🔴 Critical Emergency &nbsp;|&nbsp; 🟢 Deployed Unit &nbsp;|&nbsp; 🏥 Hospital &nbsp;|&nbsp; 🏠 Relief Shelter
              </div>
            </div>

            {loading ? (
              <div style={{ marginTop: "150px", fontSize: "16px", color: "#94a3b8" }}>Loading Regional Map Layer...</div>
            ) : (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                {emergencies.map((e, idx) => {
                  const top = 110 + (idx * 80) % 260;
                  const left = 50 + (idx * 160) % 700;
                  return (
                    <div
                      key={e.id}
                      className="map-marker emergency-marker"
                      style={{ top: `${top}px`, left: `${left}px`, borderLeft: "4px solid #dc2626", cursor: "pointer" }}
                      onClick={() => setSelectedNode({ type: "Emergency Location", title: e.title, details: `Affected: ${e.peopleAffected} citizens • Severity: ${e.severity} • Priority: ${e.priorityScore || 80}` })}
                    >
                      🔴 {e.title.split("—")[0]} (P-{e.priorityScore || 80})
                    </div>
                  );
                })}

                {resources.map((r, idx) => {
                  const top = 80 + ((idx + 2) * 85) % 270;
                  const right = 40 + (idx * 130) % 600;
                  return (
                    <div
                      key={r.id}
                      className="map-marker resource-marker"
                      style={{ top: `${top}px`, right: `${right}px`, borderLeft: "4px solid #16a34a", cursor: "pointer" }}
                      onClick={() => setSelectedNode({ type: "Deployed Unit", title: r.name, details: `Type: ${r.type} • Status: ${r.status} • Cap: ${r.capacity}` })}
                    >
                      🟢 {r.name}
                    </div>
                  );
                })}

                {hospitals.map((h, idx) => (
                  <div
                    key={h.id}
                    className="map-marker"
                    style={{ bottom: "100px", left: `${180 + idx * 240}px`, borderLeft: "4px solid #2563eb", cursor: "pointer" }}
                    onClick={() => setSelectedNode({ type: "Hospital Capacity", title: h.name, details: `Available Beds: ${h.availableBeds} / ${h.capacity}` })}
                  >
                    🏥 {h.name}
                  </div>
                ))}

                {shelters.map((s, idx) => (
                  <div
                    key={s.id}
                    className="map-marker"
                    style={{ bottom: "40px", right: `${150 + idx * 220}px`, borderLeft: "4px solid #9333ea", cursor: "pointer" }}
                    onClick={() => setSelectedNode({ type: "Relief Shelter", title: s.name, details: `Occupancy: ${s.currentOccupancy} / ${s.capacity}` })}
                  >
                    🏠 {s.name}
                  </div>
                ))}
              </div>
            )}

            {selectedNode && (
              <div style={{ position: "absolute", bottom: "20px", left: "20px", background: "#1e293b", padding: "12px 18px", borderRadius: "8px", border: "1px solid #475569", zIndex: 20, color: "white" }}>
                <strong>{selectedNode.type}: {selectedNode.title}</strong>
                <p style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>{selectedNode.details}</p>
                <button style={{ marginTop: "6px", background: "#475569", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => setSelectedNode(null)}>Close</button>
              </div>
            )}
          </div>
        </section>

        {/* Government Action Log Table */}
        <section id="log-section" className="panel" style={{ marginBottom: "30px", padding: "20px" }}>
          <div className="panel-header" style={{ marginBottom: "15px" }}>
            <h2 style={{ color: "#c084fc" }}>📜 Government Executive Action Log</h2>
            <span>Audit Trail</span>
          </div>

          <div className="allocation-table-container">
            <table className="allocation-table">
              <thead>
                <tr>
                  <th>Time Logged</th>
                  <th>Target Area</th>
                  <th>Action Triggered</th>
                  <th>Description</th>
                  <th>Execution Status</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id}>
                    <td style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td><strong>{act.area}</strong></td>
                    <td>
                      <span style={{ fontSize: "12px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                        {act.type}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px", color: "#cbd5e1" }}>{act.description}</td>
                    <td>
                      <span style={{ color: "#34d399", fontWeight: "bold", fontSize: "12px" }}>
                        ✅ {act.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Capacity Breakdown: Hospitals & Shelters */}
        <section id="capacity-section" className="content-grid">
          <div className="panel" style={{ padding: "20px" }}>
            <h2 style={{ color: "#60a5fa", marginTop: 0 }}>🏥 Regional Medical Capacity Overview</h2>
            {hospitals.map((h) => (
              <div key={h.id} style={{ background: "rgba(30,41,59,0.5)", padding: "12px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "white" }}>{h.name}</strong>
                  <span style={{ color: "#34d399", fontSize: "12px", fontWeight: "bold" }}>Beds: {h.availableBeds} / {h.capacity}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Status: {h.status} • Hotline: {h.contact}</p>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: "20px" }}>
            <h2 style={{ color: "#f472b6", marginTop: 0 }}>🏠 Regional Shelter Capacity Overview</h2>
            {shelters.map((s) => (
              <div key={s.id} style={{ background: "rgba(30,41,59,0.5)", padding: "12px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "white" }}>{s.name}</strong>
                  <span style={{ color: "#f472b6", fontSize: "12px", fontWeight: "bold" }}>Occupancy: {s.currentOccupancy} / {s.capacity}</span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>Status: {s.status}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default GovernmentDashboard;
