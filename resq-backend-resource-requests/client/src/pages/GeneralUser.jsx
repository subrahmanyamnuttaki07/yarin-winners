import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEmergency } from "../services/api";
import "../index.css";

function GeneralUser() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("report"); // 'report' | 'safety'

  // Form State - ONLY 4 Required Inputs
  const [formData, setFormData] = useState({
    userId: "",
    location: "",
    disasterType: "Flood / Water Inundation",
    peopleAffected: "",
    vulnerablePeople: "",
    severity: "Critical",
    accessibility: "ACCESSIBLE"
  });

  const [loading, setLoading] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState(null);

  // Accordion open state for Safety Information
  const [openAccordions, setOpenAccordions] = useState({
    flood: true,
    fire: false,
    earthquake: false,
    cyclone: false,
    landslide: false,
    general: false,
    helplines: true
  });

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId.trim()) {
      setError("Please enter your User ID.");
      return;
    }
    if (!formData.location.trim()) {
      setError("Please enter the exact location or nearby landmark.");
      return;
    }
    if (!formData.peopleAffected || Number(formData.peopleAffected) <= 0) {
      setError("Please enter a valid number of affected people (> 0).");
      return;
    }

    setLoading(true);
    setError(null);
    setSubmittedReport(null);

    try {
      const disasterType = formData.disasterType;
      const requiredResource = disasterType.includes("Flood")
        ? "Rescue Boat"
        : disasterType.includes("Fire")
          ? "Fire Truck"
          : disasterType.includes("Medical")
            ? "Medical Team"
            : "Rescue Team";

      const payload = {
        userId: formData.userId.trim(),
        title: `${disasterType} — ${formData.location.trim()}`,
        location: formData.location.trim(),
        severity: formData.severity.toUpperCase(),
        peopleAffected: Number(formData.peopleAffected),
        vulnerablePeople: Number(formData.vulnerablePeople) || 0,
        requiredResource,
        accessibility: formData.accessibility,
        disasterType,
        medicalRequirement: disasterType.includes("Medical"),
        description: `Citizen report from ${formData.userId.trim()}.`
      };

      const res = await createEmergency(payload);
      const emergencyId = res.emergency?.id || `E-${Math.floor(100 + Math.random() * 900)}`;

      setSubmittedReport({
        id: emergencyId,
        userId: formData.userId,
        location: formData.location,
        disasterType: formData.disasterType,
        peopleAffected: formData.peopleAffected,
        vulnerablePeople: formData.vulnerablePeople || 0,
        severity: formData.severity,
        priorityScore: res.emergency?.priorityScore,
        priorityReason: res.emergency?.priorityReason,
        allocation: res.allocation
      });
    } catch (err) {
      console.error("Report emergency error:", err);
      setError("Failed to submit emergency report. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* General User Navbar */}
      <nav className="navbar" style={{ background: "rgba(15, 23, 42, 0.95)", borderBottom: "1px solid rgba(56, 189, 248, 0.3)", padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "26px" }}>🚨</span>
          <div>
            <h2 style={{ fontSize: "20px", margin: 0, color: "#38bdf8", fontWeight: "800" }}>RESQ</h2>
            <p style={{ fontSize: "11px", margin: 0, color: "#94a3b8" }}>Citizen Disaster Reporting Portal</p>
          </div>
        </div>

        <div className="nav-links" style={{ gap: "12px" }}>
          <button
            style={{
              background: activeTab === "report" ? "#0284c7" : "rgba(255,255,255,0.05)",
              color: "white",
              border: activeTab === "report" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
            onClick={() => setActiveTab("report")}
          >
            🚨 Report Emergency
          </button>

          <button
            style={{
              background: activeTab === "safety" ? "#0284c7" : "rgba(255,255,255,0.05)",
              color: "white",
              border: activeTab === "safety" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px"
            }}
            onClick={() => setActiveTab("safety")}
          >
            🛡️ Safety Information
          </button>

          <button
            style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}
            onClick={() => navigate("/")}
          >
            ← Back to Role Selection
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "850px", margin: "30px auto", padding: "0 20px" }}>

        {/* 1. REPORT EMERGENCY OPTION */}
        {activeTab === "report" && (
          <div>
            {!submittedReport ? (
              <div className="form-container" style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(12px)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "16px", padding: "35px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                
                <div style={{ textAlign: "center", marginBottom: "25px" }}>
                  <h1 style={{ color: "#38bdf8", fontSize: "30px", margin: "0 0 8px 0", fontWeight: "800" }}>Report an Emergency</h1>
                  <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                    Provide minimum details below. RESQ will automatically calculate priorities and allocate appropriate response units.
                  </p>
                </div>

                {error && (
                  <div className="alert" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626", color: "#991b1b", marginBottom: "20px" }}>
                    ⚠️ {error}
                  </div>
                )}

                <form className="emergency-form" onSubmit={handleSubmit}>
                  
                  {/* 1. USER ID */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                      🪪 USER ID *
                    </label>
                    <input
                      type="text"
                      name="userId"
                      placeholder="e.g. CITIZEN-1042"
                      value={formData.userId}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                      required
                    />
                  </div>

                  {/* 2. LOCATION */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                      📍 EXACT LOCATION / LANDMARK *
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="e.g. Near Central Bus Stand, Main Road, Sector 4"
                      value={formData.location}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                      required
                    />
                    <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>Example: "Near Central Bus Stand, Main Road"</span>
                  </div>

                  {/* 2. DISASTER TYPE */}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                      🌊 DISASTER TYPE *
                    </label>
                    <select
                      name="disasterType"
                      value={formData.disasterType}
                      onChange={handleChange}
                      style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                    >
                      <option value="Flood / Water Inundation">🌊 Flood / Water Inundation</option>
                      <option value="Fire / Explosion">🔥 Fire / Explosion</option>
                      <option value="Earthquake / Building Collapse">🌎 Earthquake / Building Collapse</option>
                      <option value="Cyclone / Heavy Storm">🌀 Cyclone / Heavy Storm</option>
                      <option value="Landslide / Mudslide">⛰️ Landslide / Mudslide</option>
                      <option value="Other Emergency">🚨 Other Emergency</option>
                    </select>
                  </div>

                  {/* 3. PEOPLE AFFECTED & 4. SEVERITY LEVEL */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                    <div>
                      <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        👥 PEOPLE AFFECTED *
                      </label>
                      <input
                        type="number"
                        name="peopleAffected"
                        placeholder="How many people are affected? (e.g. 25)"
                        value={formData.peopleAffected}
                        onChange={handleChange}
                        min="1"
                        style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        🚨 SEVERITY LEVEL *
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                      >
                        <option value="Low">Low (Low Risk)</option>
                        <option value="Medium">Medium (Moderate Risk)</option>
                        <option value="High">High (High Risk)</option>
                        <option value="Critical">Critical (Immediate Life Threat)</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. VULNERABILITY & ACCESS */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                    <div>
                      <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        🧑‍🦽 VULNERABLE PEOPLE
                      </label>
                      <input
                        type="number"
                        name="vulnerablePeople"
                        placeholder="Children / elderly / disabled"
                        value={formData.vulnerablePeople}
                        onChange={handleChange}
                        min="0"
                        style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                      />
                    </div>
                    <div>
                      <label style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        🛣️ ROAD ACCESS
                      </label>
                      <select
                        name="accessibility"
                        value={formData.accessibility}
                        onChange={handleChange}
                        style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.9)", color: "white", fontSize: "15px" }}
                      >
                        <option value="ACCESSIBLE">Accessible</option>
                        <option value="PARTIAL">Partially accessible</option>
                        <option value="BLOCKED">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    type="submit"
                    disabled={loading}
                    style={{ width: "100%", background: "#dc2626", padding: "16px", fontSize: "18px", fontWeight: "800", borderRadius: "10px", letterSpacing: "0.5px", cursor: "pointer" }}
                  >
                    {loading ? "🚨 TRANSMITTING EMERGENCY..." : "🚨 REPORT EMERGENCY"}
                  </button>
                </form>
              </div>
            ) : (
              /* SUCCESS SCREEN */
              <div style={{ background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(12px)", border: "1px solid #10b981", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
                <div style={{ fontSize: "54px", marginBottom: "10px" }}>🚨</div>
                <h1 style={{ color: "#34d399", fontSize: "32px", margin: "0 0 10px 0", fontWeight: "800" }}>EMERGENCY REPORTED</h1>
                <p style={{ color: "#e2e8f0", fontSize: "18px", margin: "0 0 20px 0" }}>
                  "Your emergency has been successfully reported."
                </p>

                <div style={{ background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "20px", display: "inline-block", textAlign: "left", width: "100%", maxWidth: "500px", marginBottom: "30px" }}>
                  <div style={{ fontSize: "18px", color: "#38bdf8", fontWeight: "bold", marginBottom: "12px", textAlign: "center" }}>
                    Emergency ID: <span style={{ color: "white" }}>{submittedReport.id}</span>
                  </div>

                  <div style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "15px", fontStyle: "italic", textAlign: "center" }}>
                    "RESQ is automatically processing your emergency."
                  </div>

                  {/* Process Indicator Checklist */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "15px" }}>
                    <div style={{ color: "#34d399", fontWeight: "600" }}>✓ Emergency received from User ID: {submittedReport.userId}</div>
                    <div style={{ color: "#fbbf24", fontWeight: "700" }}>Priority Score: {submittedReport.priorityScore ?? "Calculating..."}/100</div>
                    {submittedReport.allocation ? (
                      <div style={{ color: "#38bdf8", fontWeight: "600" }}>✓ Assigned: {submittedReport.allocation.resourceName} • Direct response path generated</div>
                    ) : (
                      <div style={{ color: "#f87171", fontWeight: "600" }}>⏳ No suitable unit currently available — request is waiting</div>
                    )}
                    <div style={{ color: "#34d399", fontWeight: "600" }}>✓ Location identified ({submittedReport.location})</div>
                    <div style={{ color: "#34d399", fontWeight: "600" }}>✓ Situation assessed ({submittedReport.peopleAffected} affected • {submittedReport.severity} severity)</div>
                    <div style={{ color: "#fbbf24", fontWeight: "600" }}>⟳ Resources being assigned automatically by engine</div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => setSubmittedReport(null)}
                    style={{ background: "#0284c7", color: "white", border: "none", padding: "12px 28px", borderRadius: "8px", fontWeight: "bold", fontSize: "15px", cursor: "pointer" }}
                  >
                    Report Another Emergency
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SAFETY INFORMATION OPTION */}
        {activeTab === "safety" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <h1 style={{ color: "#38bdf8", fontSize: "32px", margin: "0 0 10px 0", fontWeight: "800" }}>Emergency Safety Information</h1>
              <p style={{ color: "#94a3b8", fontSize: "15px", margin: 0 }}>
                Practical, easy-to-understand emergency guidance organized by disaster type.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* 🌊 FLOOD */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("flood")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#38bdf8", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>🌊 FLOOD / WATER INUNDATION</span>
                  <span>{openAccordions.flood ? "−" : "+"}</span>
                </button>
                {openAccordions.flood && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <h4 style={{ color: "#38bdf8", marginTop: 0 }}>BEFORE FLOODING:</h4>
                    <ul>
                      <li>Keep emergency supplies (food, water, flashlights, first aid) ready.</li>
                      <li>Keep important personal documents in waterproof protection.</li>
                      <li>Know the nearest safe high ground or shelter location.</li>
                      <li>Follow official local meteorological warnings closely.</li>
                    </ul>
                    <h4 style={{ color: "#38bdf8" }}>DURING FLOODING:</h4>
                    <ul>
                      <li>Move to higher ground or upper building levels immediately.</li>
                      <li>Do not walk or drive through moving floodwater.</li>
                      <li>Stay away from electrical equipment and fallen power lines.</li>
                      <li>Follow official emergency evacuation instructions.</li>
                    </ul>
                    <h4 style={{ color: "#38bdf8" }}>AFTER FLOODING:</h4>
                    <ul>
                      <li>Avoid contact with contaminated floodwater.</li>
                      <li>Do not enter damaged structures until declared safe by authorities.</li>
                      <li>Watch for electrical hazards and gas leaks.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 🔥 FIRE */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("fire")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#f87171", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>🔥 FIRE / EXPLOSION</span>
                  <span>{openAccordions.fire ? "−" : "+"}</span>
                </button>
                {openAccordions.fire && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <h4 style={{ color: "#f87171", marginTop: 0 }}>BEFORE FIRE:</h4>
                    <ul>
                      <li>Know your emergency exit routes and assembly points.</li>
                      <li>Keep fire extinguishers accessible and inspected.</li>
                      <li>Avoid overloaded electrical sockets and faulty wiring.</li>
                    </ul>
                    <h4 style={{ color: "#f87171" }}>DURING FIRE:</h4>
                    <ul>
                      <li>Raise the alarm immediately and evacuate calmly.</li>
                      <li>Use stairs instead of elevators.</li>
                      <li>Crawl low under smoke to breathe cleaner air.</li>
                      <li>Do not re-enter a burning structure under any circumstance.</li>
                    </ul>
                    <h4 style={{ color: "#f87171" }}>AFTER FIRE:</h4>
                    <ul>
                      <li>Do not return until emergency services declare the area safe.</li>
                      <li>Stay clear of damaged walls, roofs, and hazards.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 🌎 EARTHQUAKE */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("earthquake")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#fbbf24", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>🌎 EARTHQUAKE / BUILDING COLLAPSE</span>
                  <span>{openAccordions.earthquake ? "−" : "+"}</span>
                </button>
                {openAccordions.earthquake && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <h4 style={{ color: "#fbbf24", marginTop: 0 }}>BEFORE EARTHQUAKE:</h4>
                    <ul>
                      <li>Identify sturdy safe spots (under sturdy tables or desk).</li>
                      <li>Secure heavy furniture, shelves, and water heaters.</li>
                    </ul>
                    <h4 style={{ color: "#fbbf24" }}>DURING EARTHQUAKE:</h4>
                    <ul>
                      <li><strong>DROP, COVER, AND HOLD ON.</strong></li>
                      <li>Stay away from glass windows, mirrors, and unstable objects.</li>
                      <li>If outdoors, move to an open area away from buildings and power lines.</li>
                      <li>If trapped under debris, cover your face and tap rhythmically on pipes/walls to signal rescuers.</li>
                    </ul>
                    <h4 style={{ color: "#fbbf24" }}>AFTER EARTHQUAKE:</h4>
                    <ul>
                      <li>Be prepared for secondary aftershocks.</li>
                      <li>Check yourself and nearby people for injuries.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 🌀 CYCLONE */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("cyclone")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#60a5fa", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>🌀 CYCLONE / HEAVY STORM</span>
                  <span>{openAccordions.cyclone ? "−" : "+"}</span>
                </button>
                {openAccordions.cyclone && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <h4 style={{ color: "#60a5fa", marginTop: 0 }}>BEFORE CYCLONE:</h4>
                    <ul>
                      <li>Track official meteorological cyclone bulletins.</li>
                      <li>Secure loose outdoor items or bring them indoors.</li>
                    </ul>
                    <h4 style={{ color: "#60a5fa" }}>DURING CYCLONE:</h4>
                    <ul>
                      <li>Stay indoors in the strongest, central room away from windows.</li>
                      <li>Disconnect electrical appliances if power fails.</li>
                    </ul>
                    <h4 style={{ color: "#60a5fa" }}>AFTER CYCLONE:</h4>
                    <ul>
                      <li>Stay clear of fallen electrical poles and live wires.</li>
                      <li>Awaits official clearance before leaving shelters.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* ⛰️ LANDSLIDE */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("landslide")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#c084fc", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>⛰️ LANDSLIDE / MUDSLIDE</span>
                  <span>{openAccordions.landslide ? "−" : "+"}</span>
                </button>
                {openAccordions.landslide && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <h4 style={{ color: "#c084fc", marginTop: 0 }}>DURING LANDSLIDE:</h4>
                    <ul>
                      <li>Evacuate immediately away from the landslide path to stable high ground.</li>
                      <li>Avoid steep slopes, river valleys, and debris flow channels.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 🚨 GENERAL EMERGENCY SAFETY */}
              <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(52, 211, 153, 0.3)", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("general")}
                  style={{ width: "100%", background: "rgba(30, 41, 59, 0.7)", border: "none", padding: "18px 24px", color: "#34d399", fontSize: "18px", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>🚨 GENERAL EMERGENCY SAFETY GUIDELINES</span>
                  <span>{openAccordions.general ? "−" : "+"}</span>
                </button>
                {openAccordions.general && (
                  <div style={{ padding: "24px", color: "#cbd5e1", fontSize: "14px", lineHeight: "1.7" }}>
                    <ul>
                      <li>Remain calm and follow instructions from emergency personnel.</li>
                      <li>Prioritize personal safety before attempting to assist others.</li>
                      <li>Assist children, elderly persons, and people with disabilities when safe.</li>
                      <li>Do not spread unverified rumors; rely on official announcements.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 📞 EMERGENCY HELPLINES */}
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "2px solid #ef4444", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleAccordion("helplines")}
                  style={{ width: "100%", background: "rgba(220, 38, 38, 0.2)", border: "none", padding: "18px 24px", color: "#fca5a5", fontSize: "20px", fontWeight: "800", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}
                >
                  <span>📞 OFFICIAL EMERGENCY HELPLINES</span>
                  <span>{openAccordions.helplines ? "−" : "+"}</span>
                </button>
                {openAccordions.helplines && (
                  <div style={{ padding: "24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "20px" }}>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #ef4444", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#f87171" }}>112</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Unified Emergency Number</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #3b82f6", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#60a5fa" }}>100</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Police Emergency</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #ef4444", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#f87171" }}>101</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Fire & Rescue Services</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #10b981", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#34d399" }}>108</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Ambulance / Medical</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #a855f7", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#c084fc" }}>1098</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Child Helpline</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #ec4899", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#f472b6" }}>181</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>Women Helpline</div>
                      </div>
                      <div style={{ background: "rgba(30, 41, 59, 0.9)", border: "1px solid #f59e0b", padding: "14px", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "24px", fontWeight: "900", color: "#fbbf24" }}>1078</div>
                        <div style={{ fontSize: "13px", color: "#cbd5e1" }}>NDMA / Disaster Mgmt</div>
                      </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0, textAlign: "center" }}>
                      Note: In a life-threatening emergency, contact the appropriate official emergency service immediately. RESQ is a coordination and reporting prototype and does not replace emergency services.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default GeneralUser;
