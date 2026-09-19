import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Circle,
  GeoJSON,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDashboard, replanResources } from "../services/api";

const makeIcon = (background, label, size = 38) => L.divIcon({
  className: "resq-marker",
  html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${background};border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:900;box-shadow:0 0 20px ${background};">${label}</div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2]
});

const teamIcon = makeIcon("#16a34a", "🚑", 38);
const waitingIcon = makeIcon("#f59e0b", "!", 36);

function emergencyIcon(priority) {
  if (priority >= 85) return makeIcon("#dc2626", priority, 40);
  if (priority >= 65) return makeIcon("#f97316", priority, 38);
  return makeIcon("#eab308", priority, 36);
}

function FitAP() {
  const map = useMap();
  useEffect(() => {
    map.setView([16.5, 79.8], 7);
  }, [map]);
  return null;
}

function LiveMap() {
  const [data, setData] = useState(null);
  const [apDistricts, setApDistricts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replanning, setReplanning] = useState(false);
  const [status, setStatus] = useState("LIVE ALLOCATION FEED");
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);

  const loadData = async () => {
    try {
      const dashboard = await getDashboard();
      setData(dashboard);
      setStatus("LIVE ALLOCATION FEED");
    } catch (error) {
      console.error("Map data error:", error);
      setStatus("BACKEND CONNECTION REQUIRED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/ap-districts.geojson")
      .then((response) => response.json())
      .then((geojson) => setApDistricts(geojson))
      .catch((error) => console.error("AP GeoJSON error:", error));

    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReplan = async () => {
    try {
      setReplanning(true);
      setStatus("RECALCULATING PRIORITIES & ALLOCATIONS...");
      await replanResources();
      await loadData();
      setStatus("NEW ALLOCATION PLAN ACTIVE");
    } catch (error) {
      console.error("Replan error:", error);
      setStatus("REPLANNING FAILED");
    } finally {
      setReplanning(false);
    }
  };

  const emergencies = data?.emergencies || [];
  const resources = data?.resources || [];
  const allocations = data?.allocations || [];
  const waiting = data?.unassignedEmergencies || [];
  const latestPlan = data?.latestPlan;

  const allocationByEmergency = useMemo(() => {
    return new Map(allocations.map((allocation) => [allocation.emergencyId, allocation]));
  }, [allocations]);

  const activeEmergencies = emergencies.filter(
    (emergency) => !["COMPLETED", "RESOLVED", "CANCELLED"].includes(String(emergency.status).toUpperCase())
  );

  const districtStyle = {
    color: "#22b8f0",
    weight: 1.5,
    fillColor: "#0b2945",
    fillOpacity: 0.82
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#020617" }}>
      <MapContainer
        center={[16.5, 79.8]}
        zoom={7}
        minZoom={7}
        maxZoom={10}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <FitAP />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {apDistricts && (
          <GeoJSON
            data={apDistricts}
            style={() => districtStyle}
            onEachFeature={(feature, layer) => {
              const name = feature.properties?.NAME || feature.properties?.DISTRICT || feature.properties?.district || "AP District";
              layer.bindTooltip(name, { sticky: true });
            }}
          />
        )}

        {resources.map((resource) => {
          const assignedEmergency = emergencies.find((emergency) => emergency.id === resource.currentEmergencyId);
          return (
            <Marker
              key={resource.id}
              position={[resource.latitude, resource.longitude]}
              icon={teamIcon}
            >
              <Popup>
                <strong>{resource.name}</strong><br />
                Type: {resource.type}<br />
                Status: {resource.status}<br />
                {assignedEmergency ? <>Assigned to: {assignedEmergency.id}<br /></> : null}
              </Popup>
            </Marker>
          );
        })}

        {activeEmergencies.map((emergency) => {
          const allocation = allocationByEmergency.get(emergency.id);
          const isWaiting = !allocation || emergency.status === "Waiting";
          const priority = Number(emergency.priorityScore || 0);

          return (
            <Fragment key={emergency.id}>
              <Marker
                position={[emergency.latitude, emergency.longitude]}
                icon={isWaiting ? waitingIcon : emergencyIcon(priority)}
                eventHandlers={{ click: () => setSelectedEmergencyId(emergency.id) }}
              >
                <Popup>
                  <strong>{emergency.id}</strong><br />
                  User: {emergency.userId || "—"}<br />
                  Location: {emergency.location || emergency.resolvedLocation || "—"}<br />
                  Priority: <strong>{priority}/100</strong><br />
                  Severity: {emergency.severity}<br />
                  People affected: {emergency.peopleAffected}<br />
                  Vulnerable: {emergency.vulnerablePeople || 0}<br />
                  Status: {emergency.status}<br />
                  {allocation ? <>Assigned: {allocation.resourceName}<br />Distance: {Number(allocation.distanceKm).toFixed(1)} km<br />ETA: {allocation.eta} min</> : "Waiting for a suitable resource"}
                </Popup>
              </Marker>
              <Circle
                center={[emergency.latitude, emergency.longitude]}
                radius={Math.max(2500, 9000 - priority * 35)}
                pathOptions={{ color: isWaiting ? "#f59e0b" : "#ef4444", fillColor: isWaiting ? "#f59e0b" : "#ef4444", fillOpacity: 0.08, weight: 1 }}
              />
            </Fragment>
          );
        })}

        {allocations.map((allocation) => (
          <Polyline
            key={`${allocation.emergencyId}-${allocation.resourceId}-${latestPlan?.version || "plan"}`}
            positions={allocation.route || [[allocation.resourceLatitude, allocation.resourceLongitude], [allocation.latitude, allocation.longitude]]}
            pathOptions={{ color: "#22d3ee", weight: 4, dashArray: "10 8", opacity: 0.95 }}
          />
        ))}
      </MapContainer>

      {/* Command panel */}
      <div style={{ position: "absolute", zIndex: 1000, top: "50%", left: 40, transform: "translateY(-50%)", width: 420, maxHeight: "calc(100vh - 70px)", overflowY: "auto", padding: 28, borderRadius: 16, background: "rgba(2,6,23,0.96)", border: "2px solid rgba(56,189,248,0.5)", boxShadow: "0 20px 60px rgba(0,0,0,0.55)", color: "#e2e8f0", backdropFilter: "blur(14px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: 2, color: "#38bdf8", fontWeight: 800 }}>RESQ COMMAND CENTER</div>
            <h1 style={{ margin: "6px 0", fontSize: 28 }}>Live Response Map</h1>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Citizen reports → priority engine → nearest suitable unit → direct response path</div>
          </div>
          <Link to="/operator/dashboard" style={{ color: "#cbd5e1", fontSize: 12 }}>Dashboard</Link>
        </div>

        <div style={{ marginTop: 18, padding: 12, borderRadius: 8, background: replanning ? "rgba(220,38,38,0.16)" : "rgba(14,116,144,0.16)", border: replanning ? "1px solid rgba(220,38,38,0.5)" : "1px solid rgba(56,189,248,0.35)", color: replanning ? "#f87171" : "#38bdf8", textAlign: "center", fontWeight: 800, fontSize: 12 }}>
          {replanning ? "⚠ REPLANNING RESPONSE" : status}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div style={{ padding: 12, background: "rgba(30,41,59,.8)", borderRadius: 8 }}>🚨 <strong>{activeEmergencies.length}</strong><br /><span style={{ color: "#94a3b8", fontSize: 11 }}>ACTIVE REQUESTS</span></div>
          <div style={{ padding: 12, background: "rgba(30,41,59,.8)", borderRadius: 8 }}>🚑 <strong>{allocations.length}</strong><br /><span style={{ color: "#94a3b8", fontSize: 11 }}>ALLOCATED</span></div>
          <div style={{ padding: 12, background: "rgba(30,41,59,.8)", borderRadius: 8 }}>⏳ <strong>{waiting.length}</strong><br /><span style={{ color: "#94a3b8", fontSize: 11 }}>WAITING</span></div>
          <div style={{ padding: 12, background: "rgba(30,41,59,.8)", borderRadius: 8 }}>📋 <strong>{latestPlan?.version || "—"}</strong><br /><span style={{ color: "#94a3b8", fontSize: 11 }}>CURRENT PLAN</span></div>
        </div>

        <button onClick={handleReplan} disabled={replanning || loading} style={{ width: "100%", marginTop: 14, height: 52, border: "none", borderRadius: 9, background: replanning ? "#334155" : "#0284c7", color: "white", fontWeight: 800, cursor: replanning ? "not-allowed" : "pointer" }}>
          {replanning ? "RECALCULATING..." : "⚡ REPLAN ALLOCATION"}
        </button>

        <div style={{ marginTop: 18, borderTop: "1px solid #334155", paddingTop: 16 }}>
          <div style={{ color: "#64748b", fontSize: 11, letterSpacing: 1.4, marginBottom: 10 }}>ACTIVE EMERGENCY REQUESTS</div>
          {activeEmergencies.length === 0 && <div style={{ color: "#64748b", fontSize: 13 }}>No active requests.</div>}
          {activeEmergencies
            .slice()
            .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
            .map((emergency) => {
              const allocation = allocationByEmergency.get(emergency.id);
              const selected = selectedEmergencyId === emergency.id;
              return (
                <button
                  type="button"
                  key={emergency.id}
                  onClick={() => setSelectedEmergencyId(emergency.id)}
                  style={{ width: "100%", textAlign: "left", padding: 12, marginBottom: 8, borderRadius: 8, border: selected ? "1px solid #38bdf8" : "1px solid #334155", background: allocation ? "rgba(34,197,94,.08)" : "rgba(245,158,11,.08)", color: "#e2e8f0", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>{emergency.id} · {emergency.location || emergency.resolvedLocation}</strong>
                    <span style={{ color: emergency.priorityScore >= 85 ? "#f87171" : "#fbbf24", fontWeight: 900 }}>{emergency.priorityScore}/100</span>
                  </div>
                  <div style={{ marginTop: 5, color: "#94a3b8", fontSize: 11 }}>User {emergency.userId || "—"} · {emergency.peopleAffected} affected · {emergency.severity}</div>
                  <div style={{ marginTop: 5, color: allocation ? "#34d399" : "#fbbf24", fontSize: 11, fontWeight: 700 }}>
                    {allocation ? `🚑 ${allocation.resourceName} · ${Number(allocation.distanceKm).toFixed(1)} km · ${allocation.eta} min` : "⏳ WAITING — NO SUITABLE UNIT"}
                  </div>
                </button>
              );
            })}
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>
          Cyan dashed line = direct response path. It represents a direct map path, not a road-navigation route.
        </div>
      </div>

      <div style={{ position: "absolute", zIndex: 1000, bottom: 20, left: 20, background: "rgba(2,6,23,.92)", borderRadius: 8, padding: 12, color: "#cbd5e1", fontSize: 12, border: "1px solid #334155" }}>
        <div>🚑 Rescue unit</div>
        <div style={{ marginTop: 5 }}>🔴 High-priority emergency</div>
        <div style={{ marginTop: 5 }}>🟠/🟡 Lower-priority emergency</div>
        <div style={{ marginTop: 5, color: "#22d3ee" }}>- - Direct response path</div>
      </div>

      {loading && (
        <div style={{ position: "absolute", zIndex: 1100, top: 20, right: 20, background: "#0f172a", color: "#38bdf8", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155" }}>
          Loading RESQ allocation feed...
        </div>
      )}
    </div>
  );
}

export default LiveMap;
