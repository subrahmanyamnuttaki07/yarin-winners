import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function GovernmentLogin() {
  const navigate = useNavigate();
  const [governmentId, setGovernmentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);

    // Prototype Auth Check
    if (governmentId.trim().toLowerCase() === "government" && password.trim() === "government123") {
      localStorage.setItem("resq_government_auth", "true");
      navigate("/government/dashboard");
    } else {
      setError("Invalid Government Credentials. Use demo credentials shown below.");
    }
  };

  return (
    <div className="app" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <span style={{ fontSize: "48px" }}>🏛️</span>
          <h2 style={{ color: "#c084fc", fontSize: "24px", margin: "10px 0 4px 0" }}>Government Executive Login</h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>High-Level Disaster Monitoring & Coordination</p>
        </div>

        {error && (
          <div className="alert" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626", color: "#991b1b", marginBottom: "20px", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Demo Hint Banner */}
        <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px dashed rgba(168, 85, 247, 0.4)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", color: "#e9d5ff" }}>
          <strong>Prototype Demo Credentials:</strong>
          <div style={{ marginTop: "4px" }}>Government ID: <code style={{ color: "white" }}>government</code></div>
          <div>Password: <code style={{ color: "white" }}>government123</code></div>
        </div>

        <form onSubmit={handleLogin}>
          <label style={{ color: "#cbd5e1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Government ID</label>
          <input
            type="text"
            placeholder="Enter Government ID"
            value={governmentId}
            onChange={(e) => setGovernmentId(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.8)", color: "white", marginBottom: "16px", fontSize: "14px" }}
            required
          />

          <label style={{ color: "#cbd5e1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #475569", background: "rgba(30,41,59,0.8)", color: "white", marginBottom: "24px", fontSize: "14px" }}
            required
          />

          <button className="primary-btn" type="submit" style={{ width: "100%", background: "#9333ea", padding: "12px", fontSize: "15px", fontWeight: "600" }}>
            🔐 Authenticate Executive Session
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button 
            onClick={() => navigate("/")}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
          >
            ← Back to Role Selection
          </button>
        </div>

      </div>
    </div>
  );
}

export default GovernmentLogin;
