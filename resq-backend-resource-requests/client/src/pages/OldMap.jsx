import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboard, simulateDisasterChange, simulateWeather, simulateEmergency } from "../services/api";
import "../index.css";

function Map() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isReplanning, setIsReplanning] = useState(false);
  const [reallocationMsg, setReallocationMsg] = useState(null);

  const fetchMapData = async () => {
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const handleSimDisasterChange = async () => {
    try {
      setIsReplanning(true);
      setReallocationMsg(null);
      const res = await simulateDisasterChange();
      await fetchMapData();
      setReallocationMsg(`⚡ Disaster Change Triggered! [${res.newPlan?.version}] Resource breakdown + New Critical Emergency processed.`);
    } catch (err) {
      console.error("Disaster sim error:", err);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleSimWeather = async () => {
    try {
      setIsReplanning(true);
      setReallocationMsg(null);
      const res = await simulateWeather();
      await fetchMapData();
      setReallocationMsg(`🌧️ Weather Surge Triggered! Risk level set to SEVERE.`);
    } catch (err) {
      console.error("Weather sim error:", err);
    } finally {
      setIsReplanning(false);
    }
  };

  const emergencies = data?.emergencies || [];
  const resources = data?.resources || [];
  const hospitals = data?.hospitals || [];
  const shelters = data?.shelters || [];
  const weather = data?.weather || {};
  const latestPlan = data?.latestPlan || {};

  return (
    <div className="app">
      <nav className="navbar">
        <h2>🚨 ResQ</h2>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/emergency">Emergency</Link>
          <Link to="/resources">Resources</Link>
          <Link to="/map">Live Map</Link>
        </div>
      </nav>

      <main className="dashboard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1>Live Disaster Command Map — [{latestPlan.version || "PLAN V1"}]</h1>
            <p>Real-time visual map tracking emergencies, resource statuses, hospitals, shelters, and dynamic route accessibility.</p>
          </div>
          <div className="sim-actions">
            <button className="sim-btn" style={{ background: "#dc2626", borderColor: "#b91c1c", color: "white" }} onClick={handleSimDisasterChange} disabled={isReplanning}>
              ⚡ Sim Disaster Change
            </button>
            <button className="sim-btn weather" onClick={handleSimWeather} disabled={isReplanning}>
              🌧️ Sim Weather Surge
            </button>
          </div>
        </div>

        {isReplanning && (
          <div className="banner-replanning" style={{ marginTop: "15px" }}>
            🔄 REPLANNING MAP ALLOCATIONS IN REAL-TIME...
          </div>
        )}

        {reallocationMsg && (
          <div className="alert" style={{ background: "#ecfdf5", borderLeft: "4px solid #10b981", color: "#065f46", marginTop: "15px" }}>
            {reallocationMsg}
          </div>
        )}

        <div className="map-placeholder" style={{ justifyContent: "flex-start", padding: "20px", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "15px", left: "20px", background: "rgba(255,255,255,0.95)", padding: "10px 15px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px", zIndex: 10 }}>
            <strong>Live Map Legend:</strong>
            <div style={{ marginTop: "4px" }}>
              🔴 Critical/High Emergency &nbsp;|&nbsp; 🟢 Available Resource &nbsp;|&nbsp; 🔴 Unavailable Resource &nbsp;|&nbsp; 🏥 Hospital &nbsp;|&nbsp; 🏠 Shelter
            </div>
            <div style={{ marginTop: "4px", color: "#4b5563" }}>
              Current Plan: <strong>{latestPlan.version || "PLAN V1"}</strong> | Weather Risk: <span className={`weather-badge ${weather.riskLevel}`}>{weather.riskLevel || "LOW"}</span>
            </div>
          </div>

          {loading ? (
            <div style={{ marginTop: "150px", fontSize: "18px", color: "#4b5563" }}>Loading Command Map Data...</div>
          ) : (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              {/* Emergency Markers */}
              {emergencies.map((e, idx) => {
                const top = 120 + (idx * 85) % 360;
                const left = 60 + (idx * 160) % 650;
                return (
                  <div
                    key={e.id}
                    className="map-marker emergency-marker"
                    style={{ top: `${top}px`, left: `${left}px`, borderLeft: "4px solid #dc2626", cursor: "pointer" }}
                    onClick={() => setSelectedNode({ type: "Emergency Request", title: e.title, details: `${e.peopleAffected} affected • Status: ${e.status} • Priority: ${e.priorityScore || 80}` })}
                  >
                    🔴 {e.title.split("—")[0] || e.title}
                    <div style={{ fontSize: "11px", color: "#dc2626", fontWeight: "bold" }}>P-{e.priorityScore || 80} ({e.status})</div>
                  </div>
                );
              })}

              {/* Resource Markers */}
              {resources.map((r, idx) => {
                const top = 90 + ((idx + 2) * 95) % 380;
                const right = 40 + (idx * 140) % 550;
                const isUnavailable = (r.status || '').toUpperCase() === 'UNAVAILABLE';
                return (
                  <div
                    key={r.id}
                    className="map-marker resource-marker"
                    style={{
                      top: `${top}px`,
                      right: `${right}px`,
                      borderLeft: `4px solid ${isUnavailable ? '#dc2626' : '#16a34a'}`,
                      background: isUnavailable ? '#fee2e2' : 'white',
                      cursor: "pointer"
                    }}
                    onClick={() => setSelectedNode({ type: "Resource Unit", title: r.name, details: `Type: ${r.type} • Status: ${r.status} • Capacity: ${r.capacity} • Speed: ${r.speed} km/h` })}
                  >
                    {isUnavailable ? '🔴' : '🟢'} {r.name}
                    <div style={{ fontSize: "11px", color: isUnavailable ? '#991b1b' : '#16a34a', fontWeight: "bold" }}>{r.status}</div>
                  </div>
                );
              })}

              {/* Hospital Markers */}
              {hospitals.map((h, idx) => (
                <div
                  key={h.id}
                  className="map-marker"
                  style={{ bottom: "140px", left: `${180 + idx * 240}px`, borderLeft: "4px solid #2563eb", cursor: "pointer" }}
                  onClick={() => setSelectedNode({ type: "Hospital", title: h.name, details: `Available Beds: ${h.availableBeds} / ${h.capacity}` })}
                >
                  🏥 {h.name}
                </div>
              ))}

              {/* Shelter Markers */}
              {shelters.map((s, idx) => (
                <div
                  key={s.id}
                  className="map-marker"
                  style={{ bottom: "60px", right: `${150 + idx * 220}px`, borderLeft: "4px solid #9333ea", cursor: "pointer" }}
                  onClick={() => setSelectedNode({ type: "Shelter", title: s.name, details: `Occupancy: ${s.currentOccupancy} / ${s.capacity}` })}
                >
                  🏠 {s.name}
                </div>
              ))}

              {/* Weather Road Blockage Indicator */}
              {weather.riskLevel === "SEVERE" && (
                <div className="map-marker road-marker" style={{ background: "#fee2e2", border: "2px solid #dc2626", color: "#991b1b" }}>
                  ⚫ ROAD R17 & HIGHWAY BLOCKED (FLASH FLOOD)
                </div>
              )}
            </div>
          )}

          {selectedNode && (
            <div style={{ position: "absolute", bottom: "20px", left: "20px", background: "white", padding: "12px 18px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", zIndex: 20 }}>
              <strong>{selectedNode.type}: {selectedNode.title}</strong>
              <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>{selectedNode.details}</p>
              <button style={{ marginTop: "8px", background: "#e5e7eb", border: "none", padding: "4px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }} onClick={() => setSelectedNode(null)}>Close</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Map;