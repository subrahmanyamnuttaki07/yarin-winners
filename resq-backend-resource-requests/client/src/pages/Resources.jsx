import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getResources, updateResource } from "../services/api";
import "../index.css";

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadResources = async () => {
    try {
      setError(null);

      const data = await getResources();

      setResources(data || []);
    } catch (err) {
      console.error("Failed to load resources:", err);
      setError("Could not load resources from backend");
    } finally {
      setLoading(false);
    }
  };

  // Initial load + automatic refresh every 3 seconds
  useEffect(() => {
    loadResources();

    const interval = setInterval(() => {
      loadResources();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (resourceId, newStatus) => {
    try {
      await updateResource(resourceId, {
        status: newStatus
      });

      await loadResources();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update resource status");
    }
  };

  const availableCount = resources.filter(
    resource => resource.status === "Available"
  ).length;

  const assignedCount = resources.filter(
    resource => resource.status === "Assigned"
  ).length;

  const travellingCount = resources.filter(
    resource => resource.status === "Travelling"
  ).length;

  const busyCount = resources.filter(
    resource => resource.status === "Busy"
  ).length;

  const unavailableCount = resources.filter(
    resource => resource.status === "Unavailable"
  ).length;

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <h2>🚨 ResQ</h2>

        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/emergency">Emergency</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/map">Live Map</Link>
        </div>
      </nav>

      {/* MAIN */}
      <main className="dashboard">

        <h1>Rescue & Relief Resource Management</h1>

        <p>
          Monitor real-time availability, capacity, status, and manual
          status overrides for disaster response units.
        </p>

        {/* AUTO SYNC INDICATOR */}
        <div
          style={{
            marginTop: "15px",
            padding: "10px 14px",
            background: "#ecfdf5",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "13px",
            display: "inline-block"
          }}
        >
          🟢 Live Resource Sync Active — updates every 3 seconds
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="alert"
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              marginTop: "15px"
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* RESOURCE SUMMARY */}
        {!loading && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "25px",
              marginBottom: "25px"
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                color: "#166534",
                fontWeight: "600"
              }}
            >
              🟢 {availableCount} Available
            </div>

            <div
              style={{
                padding: "10px 16px",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                color: "#1d4ed8",
                fontWeight: "600"
              }}
            >
              🔵 {assignedCount} Assigned
            </div>

            <div
              style={{
                padding: "10px 16px",
                background: "#fefce8",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                color: "#a16207",
                fontWeight: "600"
              }}
            >
              🟡 {travellingCount} Travelling
            </div>

            <div
              style={{
                padding: "10px 16px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "8px",
                color: "#c2410c",
                fontWeight: "600"
              }}
            >
              🟠 {busyCount} Busy
            </div>

            <div
              style={{
                padding: "10px 16px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#b91c1c",
                fontWeight: "600"
              }}
            >
              🔴 {unavailableCount} Unavailable
            </div>

            <div
              style={{
                padding: "10px 16px",
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                color: "#374151",
                fontWeight: "700"
              }}
            >
              📦 Total Resources: {resources.length}
            </div>
          </div>
        )}

        {/* RESOURCE LIST */}
        {loading ? (
          <p style={{ marginTop: "20px" }}>
            Loading resources...
          </p>
        ) : resources.length === 0 ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              background: "#f9fafb",
              borderRadius: "10px",
              marginTop: "20px"
            }}
          >
            <h2>No Resources Found</h2>
            <p>
              There are currently no resources available from the backend.
            </p>
          </div>
        ) : (
          <div className="resource-grid">

            {resources.map((resource) => (

              <div
                className="resource-card"
                key={resource.id}
              >

                {/* NAME + STATUS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <h2>
                    {resource.name}
                  </h2>

                  <span
                    className={`status-tag ${resource.status}`}
                  >
                    {resource.status}
                  </span>
                </div>

                {/* TYPE */}
                <p>
                  <b>Type:</b>{" "}
                  {resource.type}
                </p>

                {/* CAPACITY */}
                <p>
                  <b>Capacity & Speed:</b>{" "}
                  {resource.capacity} seats •{" "}
                  {resource.speed} km/h
                </p>

                {/* CAPABILITIES */}
                <p>
                  <b>Capabilities:</b>{" "}
                  {(resource.capabilities || []).join(", ") ||
                    "General Rescue"}
                </p>

                {/* LOCATION */}
                <p>
                  <b>Location Coords:</b>{" "}
                  {resource.latitude}, {resource.longitude}
                </p>

                {/* STATUS OVERRIDE */}
                <div
                  style={{
                    marginTop: "15px",
                    paddingTop: "12px",
                    borderTop: "1px dashed #e5e7eb"
                  }}
                >
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      display: "block",
                      marginBottom: "4px"
                    }}
                  >
                    Change Status Override:
                  </label>

                  <select
                    style={{
                      padding: "6px 10px",
                      borderRadius: "5px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      width: "100%"
                    }}
                    value={resource.status}
                    onChange={(e) =>
                      handleStatusChange(
                        resource.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="Available">
                      Available (Ready)
                    </option>

                    <option value="Assigned">
                      Assigned (Assigned Mission)
                    </option>

                    <option value="Travelling">
                      Travelling (En Route)
                    </option>

                    <option value="Busy">
                      Busy (On Scene)
                    </option>

                    <option value="Completed">
                      Completed (Mission Done)
                    </option>

                    <option value="Unavailable">
                      Unavailable (Breakdown / Maintenance)
                    </option>
                  </select>
                </div>

              </div>

            ))}

          </div>
        )}

      </main>
    </div>
  );
}

export default Resources;