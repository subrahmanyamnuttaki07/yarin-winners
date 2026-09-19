import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  getDashboard,
  getEmergencies,
  approveAllocation,
  manualAllocation,
  completeEmergency,
  createResourceRequest,
  getResourceRequests
} from "../services/api";
import "../index.css";

function Dashboard() {
  const [resourceRequestModal, setResourceRequestModal] = useState(false);

const [resourceRequest, setResourceRequest] = useState({
  emergencyId: "",
  resourceType: "",
  quantity: 1,
  reason: ""
});
const [resourceRequests, setResourceRequests] = useState([]);
const [requestEmergencies, setRequestEmergencies] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'new_emergency' | 'assigned' | 'unavailable' | 'completed', title: string, message: string }
  const [newEmergencyId, setNewEmergencyId] = useState(null);
  const [manualModal, setManualModal] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [error, setError] = useState(null);

  const knownIdsRef = useRef(new Set());
  const isInitialFetchRef = useRef(true);

  // 3-Second Automatic Polling & New Emergency Detection
  const fetchDashboardData = async () => {
  try {
   const [dashboard, requests, emergencyList] = await Promise.all([
  getDashboard(),
  getResourceRequests(),
  getEmergencies()
]);

    setData(dashboard);
    setResourceRequests(requests || []);
setRequestEmergencies(
  Array.isArray(emergencyList)
    ? emergencyList
    : emergencyList?.emergencies ||
      emergencyList?.data ||
      []
);
    // keep your existing code here
  } catch (err) {
    console.error(err);
  }
};

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // Dismiss Toast helper
  const closeToast = () => setToast(null);

  // Complete Rescue Work Action
  const handleCompleteMission = async (emergencyId, resourceName) => {
    try {
      setIsReplanning(true);
      const res = await completeEmergency(emergencyId);
      
      setToast({
        type: "assigned",
        title: "RESCUE WORK COMPLETED",
        message: `Rescue work completed successfully for emergency ${emergencyId}. ${res.freedResource || resourceName || 'Assigned unit'} is now Available for new assignments!`
      });

      await fetchDashboardData();
    } catch (err) {
      console.error("Complete mission error:", err);
      setError("Failed to mark rescue work as completed.");
    } finally {
      setTimeout(() => setIsReplanning(false), 2000);
    }
  };

  // Manual Resource Assignment Action with Availability Check
  const handleAssignClick = async (emergencyId, emergencyTitle, resource) => {
    if (!resource) {
      setManualModal({ emergencyId, emergencyTitle });
      return;
    }

    const isAvailable = (resource.status || '').toUpperCase() === 'AVAILABLE';

    if (isAvailable) {
      try {
        await manualAllocation({
          emergencyId,
          resourceId: resource.id
        });

        setToast({
          type: "assigned",
          title: "RESOURCE ASSIGNED",
          message: `${resource.name} assigned successfully to ${emergencyTitle || emergencyId}.`
        });

        await fetchDashboardData();
      } catch (err) {
        console.error("Assignment error:", err);
        setError("Failed to complete manual assignment.");
      }
    } else {
      // Resource is UNAVAILABLE
      setToast({
        type: "unavailable",
        title: "RESOURCE UNAVAILABLE",
        message: `${resource.name} is currently unavailable (${resource.status || 'Busy'}).`
      });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualModal || !selectedResourceId) return;

    const resourcesList = data?.resources || [];
    const targetResource = resourcesList.find(r => r.id === selectedResourceId);

    if (targetResource) {
      handleAssignClick(manualModal.emergencyId, manualModal.emergencyTitle, targetResource);
      setManualModal(null);
      setSelectedResourceId("");
    }
  };

  const handleApprove = async (emergencyId, resourceId, action) => {
    try {
      await approveAllocation({ emergencyId, resourceId, action });
      await fetchDashboardData();
    } catch (err) {
      console.error("Approve error:", err);
      setError("Failed to update allocation approval status");
    }
  };
const handleResourceRequest = async (e) => {
  e.preventDefault();

  try {
    await createResourceRequest({
      emergencyId: resourceRequest.emergencyId,
      resourceType: resourceRequest.resourceType,
      quantity: Number(resourceRequest.quantity),
      reason: resourceRequest.reason,
      requestedBy: "Operator"
    });

    setToast({
      type: "assigned",
      title: "RESOURCE REQUEST SENT",
      message: "Government has received the resource request for approval."
    });

    setResourceRequestModal(false);

    setResourceRequest({
      emergencyId: "",
      resourceType: "",
      quantity: 1,
      reason: ""
    });

    await fetchDashboardData();
  } catch (err) {
    console.error("Resource request error:", err);

    setError(
      err.response?.data?.error ||
      "Failed to send resource request."
    );
  }
};
  const stats = data?.stats || {
    totalResources: 7,
    availableResources: 5,
    assignedResources: 1,
    busyResources: 0,
    unavailableResources: 1,
    activeEmergencies: 4,
    critical: 2,
    waitingEmergencies: 1
  };

  const emergencies = data?.emergencies || [];
  const resources = data?.resources || [];
  const allocations = data?.allocations || [];
  const unassignedEmergencies = data?.unassignedEmergencies || [];
  const weather = data?.weather || { conditions: "Moderate Rain", temperature: 28, riskLevel: "MODERATE" };
  const latestPlan = data?.latestPlan || {};

  const availableUnitsList = resources.filter(r => (r.status || '').toUpperCase() === 'AVAILABLE');
  const assignedUnitsList = resources.filter(r => (r.status || '').toUpperCase() === 'ASSIGNED' || (r.status || '').toUpperCase() === 'BUSY');

  // Emergencies available for additional-resource requests.
  const requestableEmergencies = [
    ...emergencies,
    ...unassignedEmergencies
      .filter(waiting => !emergencies.some(em => em.id === waiting.emergencyId))
      .map(waiting => ({
        id: waiting.emergencyId,
        title: waiting.emergencyTitle,
        status: 'Active'
      }))
  ].filter(
    em => !['COMPLETED', 'RESOLVED', 'CANCELLED'].includes(String(em.status || '').toUpperCase())
  );

  return (
    <div className="app">
      {/* Operator Navbar */}
      <nav className="navbar" style={{ background: "rgba(15, 23, 42, 0.95)", borderBottom: "1px solid rgba(220, 38, 38, 0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🚨</span>
          <div>
            <h2 style={{ fontSize: "18px", margin: 0, color: "#f87171" }}>RESQ Operator Control Room</h2>
            <p style={{ fontSize: "11px", margin: 0, color: "#94a3b8" }}>Real-time Emergency Monitoring & Allocation</p>
          </div>
        </div>

        <div className="nav-links">
          <Link to="/operator/dashboard" style={{ color: "#ffffff", fontWeight: "bold" }}>Dashboard</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/map">Live Map</Link>
          <button 
            onClick={() => {
              localStorage.removeItem("resq_operator_auth");
              window.location.href = "/";
            }}
            style={{ background: "rgba(239, 68, 68, 0.2)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            Logout 🔒
          </button>
        </div>
      </nav>

      <main className="dashboard">
        <section
  style={{
    marginTop: "25px",
    padding: "20px",
    border: "1px solid rgba(124,58,237,0.5)",
    borderRadius: "12px",
    background: "#0b0b0f",
    color: "#f5f5f5"
  }}
>
 <h2
  style={{
    color: "#e9d5ff",
    marginBottom: "18px"
  }}
>
  🏛️ Government Resource Requests
</h2>

  {resourceRequests.length === 0 ? (
    <p>No resource requests.</p>
  ) : (
    resourceRequests.map(request => (
      <div
  key={request.id}
  style={{
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "8px",
    background: "#15151a",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f5f5f5"
  }}
>
        <strong
  style={{
    color:
      request.status === "ACCEPTED"
        ? "#4ade80"
        : request.status === "REJECTED"
        ? "#f87171"
        : "#facc15"
  }}
>
  Status: {request.status}
</strong>

        <p>
          Emergency:{" "}
          {request.emergencyTitle || request.emergencyId || "General"}
        </p>

        <p>Reason: {request.reason}</p>

        <strong>
          Status: {request.status}
        </strong>
      </div>
    ))
  )}
</section>

        {/* Floating Toast Notification */}
        {toast && (
          <div 
            style={{
              position: "fixed",
              top: "80px",
              right: "25px",
              zIndex: 1000,
              background: toast.type === "unavailable" ? "rgba(220, 38, 38, 0.95)" : toast.type === "assigned" ? "rgba(16, 185, 129, 0.95)" : "rgba(30, 41, 59, 0.95)",
              border: toast.type === "unavailable" ? "1px solid #ef4444" : toast.type === "assigned" ? "1px solid #34d399" : "1px solid #38bdf8",
              color: "white",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              maxWidth: "420px",
              backdropFilter: "blur(10px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px"
            }}
          >
            <div>
              <div style={{ fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                {toast.type === "new_emergency" ? "🚨 " : toast.type === "assigned" ? "✅ " : "⚠️ "}
                {toast.title}
              </div>
              <div style={{ fontSize: "13px", lineHeight: "1.4", opacity: 0.95 }}>{toast.message}</div>
            </div>
            <button onClick={closeToast} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px", fontWeight: "bold", padding: 0 }}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="header" style={{ marginBottom: "20px" }}>
          <div>
            <h1>Disaster Control Room Dashboard</h1>
            <p>Intelligent Serving Resource Allocation & Dynamic Priority Monitoring Engine</p>
          </div>
          <div style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", color: "#94a3b8" }}>
            🟢 Auto-Sync Active (3s Polling) | Weather Risk: <strong style={{ color: weather.riskLevel === 'SEVERE' ? '#f87171' : '#38bdf8' }}>{weather.riskLevel || 'MODERATE'}</strong>
          </div>
        </div>

        {error && (
          <div className="alert" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626", color: "#991b1b", marginBottom: "20px" }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}

        {/* Replanning Status Indicator */}
        {isReplanning && (
          <div className="banner-replanning" style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "24px" }}>🔄</span>
            <div>
              <div style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }}>REPLANNING RESOURCE ALLOCATION...</div>
              <div style={{ fontSize: "13px", fontWeight: "normal", opacity: 0.9 }}>
                Recalculating dynamic priorities, verifying resource availability & updating response routes...
              </div>
            </div>
          </div>
        )}

        {/* Resource Counter Badges */}
        <div className="resource-counters" style={{ marginBottom: "25px" }}>
          <div className="counter-badge total">Total Resources: {stats.totalResources}</div>
          <div className="counter-badge available">🟢 Available: {availableUnitsList.length}</div>
          <div className="counter-badge assigned">🔵 Assigned: {assignedUnitsList.length}</div>
          <div className="counter-badge busy">🟡 Busy: {stats.busyResources}</div>
          <div className="counter-badge unavailable">🔴 Unavailable: {stats.unavailableResources}</div>
          <div className="counter-badge waiting">🟣 Waiting Emergencies: {stats.waitingEmergencies}</div>
        </div>
         <button
  onClick={() => setResourceRequestModal(true)}
  style={{
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "25px"
  }}
>
  🏛️ REQUEST RESOURCES FROM GOVERNMENT
</button>
        {/* AI Allocation Rationale Explanation */}
        {latestPlan?.aiExplanation && (
          <div className="banner-updated" style={{ marginBottom: "25px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)" }}>
            <h3 style={{ color: "#38bdf8" }}>🤖 ALLOCATION RATIONALE & EXPLANATION — [{latestPlan?.version || "PLAN V1"}]</h3>
            <p style={{ margin: "6px 0 0 0", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>
              "{latestPlan.aiExplanation}"
            </p>
          </div>
        )}

        {/* REPLANNED SERVICE RESOURCE ALLOCATION TABLE SECTION */}
        <section className="panel" style={{ marginBottom: "30px" }}>
          <div className="panel-header">
            <h2 style={{ color: "#38bdf8" }}>REPLANNED SERVICE RESOURCE ALLOCATION</h2>
            <span style={{ fontWeight: "bold", background: "#0284c7", color: "white", padding: "2px 10px", borderRadius: "4px", fontSize: "12px" }}>
              {latestPlan?.version || "PLAN V1"}
            </span>
          </div>

          {loading ? (
            <p>Loading allocation details...</p>
          ) : (
            <div className="allocation-table-container">
              <table className="allocation-table">
                <thead>
                  <tr>
                    <th>Emergency</th>
                    <th>Disaster Type</th>
                    <th>Severity</th>
                    <th>People Affected</th>
                    <th>Assigned Resource</th>
                    <th>Resource Type</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th>Allocation Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => {
                    const isNew = alloc.emergencyId === newEmergencyId;
                    const disasterType = alloc.emergencyTitle?.split("—")[0] || "Disaster";
                    return (
                      <tr 
                        key={alloc.emergencyId} 
                        style={{
                          background: isNew ? "rgba(56, 189, 248, 0.2)" : "transparent",
                          transition: "background 0.5s ease"
                        }}
                      >
                        <td>
                          <strong>{alloc.emergencyId}</strong>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>{alloc.emergencyTitle || alloc.emergencyId}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{disasterType}</span>
                        </td>
                        <td>
                          <span className={`status-tag ${alloc.severity || 'HIGH'}`} style={{ fontWeight: "bold" }}>
                            {alloc.severity || 'HIGH'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: "15px", color: "#f87171" }}>{alloc.peopleAffected || 10}</strong>
                        </td>
                        <td>
                          <strong>{alloc.resourceName}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "#94a3b8" }}>{alloc.resourceType}</span>
                        </td>
                        <td>
                          <span className={`status-tag ${alloc.resourceStatus || 'Assigned'}`}>
                            {alloc.resourceStatus || 'Assigned'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "#38bdf8" }}>{alloc.eta} mins</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{alloc.distanceKm || 2} km</div>
                        </td>
                        <td>
                          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#f87171" }}>{alloc.priorityScore || 85}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <button
                              className="btn-action accept"
                              style={{ background: "#059669", color: "white" }}
                              onClick={() => handleCompleteMission(alloc.emergencyId, alloc.resourceName)}
                            >
                              ✅ Complete Mission
                            </button>
                            <button className="btn-action manual" onClick={() => handleAssignClick(alloc.emergencyId, alloc.emergencyTitle, resources.find(r => r.id === alloc.resourceId))}>
                              Reassign
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Unassigned / Waiting Emergencies */}
                  {unassignedEmergencies.map((waiting) => {
                    const isNew = waiting.emergencyId === newEmergencyId;
                    return (
                      <tr 
                        key={waiting.emergencyId} 
                        style={{
                          background: isNew ? "rgba(239, 68, 68, 0.2)" : "rgba(88, 28, 135, 0.15)",
                          transition: "background 0.5s ease"
                        }}
                      >
                        <td>
                          <strong>{waiting.emergencyId}</strong>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>{waiting.emergencyTitle || waiting.emergencyId}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{waiting.requiredResource}</span>
                        </td>
                        <td>
                          <span className="status-tag CRITICAL">CRITICAL</span>
                        </td>
                        <td>
                          <strong style={{ fontSize: "15px", color: "#f87171" }}>{waiting.peopleAffected}</strong>
                        </td>
                        <td colSpan="3">
                          <strong style={{ color: "#f87171" }}>⚠️ NO SUITABLE RESOURCE AVAILABLE</strong>
                        </td>
                        <td>-</td>
                        <td>
                          <span style={{ fontSize: "16px", fontWeight: "bold", color: "#c084fc" }}>{waiting.priorityScore}</span>
                        </td>
                        <td>
                          <button className="btn-action manual" onClick={() => setManualModal({ emergencyId: waiting.emergencyId, emergencyTitle: waiting.emergencyTitle })}>
                            Assign Unit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
          {resourceRequestModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000
    }}
  >
    <div
      style={{
        width: "460px",
        maxWidth: "90%",
        background: "#0f172a",
        border: "1px solid #7c3aed",
        borderRadius: "14px",
        padding: "25px",
        color: "white"
      }}
    >
      <h2 style={{ marginTop: 0, color: "#c084fc" }}>
        🏛️ Request Additional Resources
      </h2>

      <p style={{ color: "#94a3b8", fontSize: "13px" }}>
        Request additional resources from the Government Control Center.
      </p>

      <form onSubmit={handleResourceRequest}>

        <label style={{ display: 'block', marginBottom: '6px' }}>
          Emergency
        </label>

        <div style={{ width: '100%', boxSizing: 'border-box', margin: '6px 0 15px' }}>
          <select
            value={resourceRequest.emergencyId}
            onChange={(e) =>
              setResourceRequest({
                ...resourceRequest,
                emergencyId: e.target.value
              })
            }
            required
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '7px',
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #475569',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="">
              {requestEmergencies.filter(
  (em) =>
    !["COMPLETED", "RESOLVED", "CANCELLED"].includes(
      String(em.status || "").toUpperCase()
    )
).length === 0 ? 'No active emergencies' : 'Select emergency'}
            </option>

           {requestEmergencies
  .filter(
    (em) =>
      !["COMPLETED", "RESOLVED", "CANCELLED"].includes(
        String(em.status || "").toUpperCase()
      )
  )
  .map((em) => (
              <option key={em.id} value={em.id}>
                {em.id} — {em.title || 'Emergency'}
              </option>
            ))}
          </select>
        </div>

        <label>Resource Type</label>

        <select
          value={resourceRequest.resourceType}
          onChange={(e) =>
            setResourceRequest({
              ...resourceRequest,
              resourceType: e.target.value
            })
          }
          required
          style={{
            width: "100%",
            padding: "11px",
            margin: "6px 0 15px",
            borderRadius: "7px",
            background: "#020617",
            color: "white",
            border: "1px solid #475569"
          }}
        >
          <option value="">Select resource</option>
          <option value="Ambulance">Ambulance</option>
          <option value="Rescue Team">Rescue Team</option>
          <option value="Boat">Boat</option>
          <option value="Medical Team">Medical Team</option>
          <option value="Helicopter">Helicopter</option>
          <option value="Relief Supplies">Relief Supplies</option>
        </select>

        <label>Quantity</label>

        <input
          type="number"
          min="1"
          value={resourceRequest.quantity}
          onChange={(e) =>
            setResourceRequest({
              ...resourceRequest,
              quantity: e.target.value
            })
          }
          required
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            margin: "6px 0 15px",
            borderRadius: "7px",
            background: "#020617",
            color: "white",
            border: "1px solid #475569"
          }}
        />

        <label>Reason</label>

        <textarea
          value={resourceRequest.reason}
          onChange={(e) =>
            setResourceRequest({
              ...resourceRequest,
              reason: e.target.value
            })
          }
          placeholder="Why are additional resources required?"
          required
          rows={4}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px",
            margin: "6px 0 15px",
            borderRadius: "7px",
            background: "#020617",
            color: "white",
            border: "1px solid #475569",
            resize: "vertical"
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px"
          }}
        >
          <button
            type="button"
            onClick={() => setResourceRequestModal(false)}
            style={{
              background: "#475569",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "7px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            style={{
              background: "#7c3aed",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "7px",
              cursor: "pointer",
              fontWeight: "700"
            }}
          >
            Send Request
          </button>
        </div>

      </form>
    </div>
  </div>
)}
        {/* Manual Assignment Modal */}
        {manualModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ background: "#1e293b", border: "1px solid #475569", padding: "25px", borderRadius: "12px", width: "450px", maxWidth: "90%", color: "white" }}>
              <h3 style={{ marginTop: 0, color: "#38bdf8" }}>Assign Specific Resource Unit</h3>
              <p style={{ marginTop: "6px", color: "#cbd5e1", fontSize: "14px" }}>Emergency: <strong>{manualModal.emergencyTitle}</strong></p>
              
              <form onSubmit={handleManualSubmit} style={{ marginTop: "15px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}>Select Unit to Assign:</label>
                <select
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(15,23,42,0.8)", color: "white", marginBottom: "20px" }}
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Unit --</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type}) — Status: {r.status}
                    </option>
                  ))}
                </select>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" className="btn-action" style={{ background: "#475569", color: "white" }} onClick={() => setManualModal(null)}>Cancel</button>
                  <button type="submit" className="btn-action accept">Confirm Assignment</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Active Emergency Requests List & Resource Units Breakdown */}
        <div className="content-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Active Emergency Requests</h2>
              <span>Live Feed</span>
            </div>
            {emergencies.map((e) => {
              const isNew = e.id === newEmergencyId;
              const isCompleted = e.status === 'Completed';
              return (
                <div key={e.id} className="emergency" style={{ background: isNew ? "rgba(56, 189, 248, 0.2)" : isCompleted ? "rgba(16, 185, 129, 0.1)" : "transparent", transition: "background 0.5s ease" }}>
                  <div>
                    <h3 style={{ textDecoration: isCompleted ? "line-through" : "none", color: isCompleted ? "#94a3b8" : "white" }}>{e.title}</h3>
                    <p>{e.peopleAffected} affected • Status: <span className={`status-tag ${e.status}`}>{e.status}</span></p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{e.priorityReason}</p>
                    {!isCompleted && (
                      <button
                        style={{ background: "#059669", color: "white", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer", fontWeight: "bold", marginTop: "6px" }}
                        onClick={() => handleCompleteMission(e.id, e.requiredResource)}
                      >
                        ✅ Complete Rescue Work
                      </button>
                    )}
                  </div>
                  <strong className={(e.severity || e.urgency || "").toLowerCase()}>{e.severity || e.urgency}</strong>
                </div>
              );
            })}
          </section>

          {/* Resources Status Breakdown: Allocated vs Available */}
          <section className="panel">
            <div className="panel-header">
              <h2>Resource Status List</h2>
              <span>🟢 {availableUnitsList.length} Available | 🔵 {assignedUnitsList.length} Allocated</span>
            </div>
            {resources.map((r) => {
              const isAvail = (r.status || '').toUpperCase() === 'AVAILABLE';
              return (
                <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px border rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{isAvail ? "🟢 " : "🔵 "}{r.name}</strong>
                    <span className={`status-tag ${r.status}`}>{r.status}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Type: {r.type} • Cap: {r.capacity} • Speed: {r.speed} km/h
                  </p>
                </div>
              );
            })}
          </section>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;