import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEmergency } from "../services/api";
import "../index.css";

function Emergency() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    emergencyType: "Rescue Boat",
    peopleAffected: "",
    vulnerablePeople: "",
    urgency: "CRITICAL",
    description: ""
  });

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessResult(null);

    try {
      const payload = {
        title: `${formData.emergencyType} — ${formData.location || "Sector Center"}`,
        latitude: 12.9650 + (Math.random() - 0.5) * 0.05,
        longitude: 77.5950 + (Math.random() - 0.5) * 0.05,
        severity: formData.urgency,
        peopleAffected: Number(formData.peopleAffected) || 10,
        requiredResource: formData.emergencyType,
        accessibility: "ACCESSIBLE"
      };

      const response = await createEmergency(payload);
      setSuccessResult(response);

      setTimeout(() => {
        navigate("/");
      }, 3500);
    } catch (err) {
      console.error("Emergency submit error:", err);
      setError("Failed to report emergency. Please verify backend server is running.");
    } finally {
      setLoading(false);
    }
  };

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

      <main className="form-container">
        <h1>Report Emergency</h1>
        <p>Provide details about the emergency situation for real-time allocation.</p>

        {error && (
          <div className="alert" style={{ background: "#fee2e2", color: "#991b1b", marginBottom: "15px" }}>
            ⚠️ {error}
          </div>
        )}

        {successResult && (
          <div className="alert" style={{ background: "#ecfdf5", borderLeft: "4px solid #10b981", color: "#065f46", marginBottom: "15px" }}>
            🎉 <strong>Emergency Reported & Allocated!</strong>
            <p style={{ marginTop: "5px" }}>
              Assigned Resource: <strong>{successResult.allocation?.resourceName || "Processing"}</strong> (ETA: {successResult.allocation?.eta || "8"} mins)
            </p>
            <p style={{ fontSize: "12px", color: "#047857", marginTop: "3px" }}>Redirecting to command center dashboard...</p>
          </div>
        )}

        <form className="emergency-form" onSubmit={handleSubmit}>
          <label>Reporter Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Location / Area Name</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Area A, East District"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <label>Required Resource Type</label>
          <select name="emergencyType" value={formData.emergencyType} onChange={handleChange}>
            <option value="Rescue Boat">Rescue Boat (Flood / Water)</option>
            <option value="Rescue Team">Rescue Team (Collapse / Trapped)</option>
            <option value="Fire Truck">Fire Truck (Fire Emergency)</option>
            <option value="Ambulance">Ambulance (Medical Evacuation)</option>
            <option value="Medical Team">Medical Team (Triage / First Aid)</option>
          </select>

          <label>People Affected</label>
          <input
            type="number"
            name="peopleAffected"
            placeholder="Number of people"
            value={formData.peopleAffected}
            onChange={handleChange}
            required
          />

          <label>Vulnerable People (Children / Elderly)</label>
          <input
            type="number"
            name="vulnerablePeople"
            placeholder="Children / elderly / disabled"
            value={formData.vulnerablePeople}
            onChange={handleChange}
          />

          <label>Urgency Level</label>
          <select name="urgency" value={formData.urgency} onChange={handleChange}>
            <option value="CRITICAL">CRITICAL (Immediate Life Threat)</option>
            <option value="HIGH">HIGH (High Risk)</option>
            <option value="MEDIUM">MEDIUM (Moderate Risk)</option>
            <option value="LOW">LOW (Low Risk)</option>
          </select>

          <label>Description</label>
          <textarea
            name="description"
            placeholder="Describe the situation in detail..."
            rows="4"
            value={formData.description}
            onChange={handleChange}
          />

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "🚨 Transmitting & Allocating..." : "🚨 Submit Emergency"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Emergency;