import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function OperatorLogin() {
  const navigate = useNavigate();
  const [operatorId, setOperatorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);

    // Prototype Auth Check
    if (operatorId.trim().toLowerCase() === "operator" && password.trim() === "operator123") {
      localStorage.setItem("resq_operator_auth", "true");
      navigate("/operator/dashboard");
    } else {
      setError("Invalid Operator Credentials. Use demo credentials shown below.");
    }
  };

  return (
    <div className="app" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={{ background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(220, 38, 38, 0.3)", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
        
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <span style={{ fontSize: "48px" }}>🚨</span>
          <h2 style={{ color: "#f87171", fontSize: "24px", margin: "10px 0 4px 0" }}>Operator Control Room Login</h2>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>Authorized Emergency Response Personnel</p>
        </div>

        {error && (
          <div className="alert" style={{ background: "#fee2e2", borderLeft: "4px solid #dc2626", color: "#991b1b", marginBottom: "20px", fontSize: "13px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Demo Hint Banner */}
        <div style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px dashed rgba(220, 38, 38, 0.4)", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", color: "#fca5a5" }}>
          <strong>Prototype Demo Credentials:</strong>
          <div style={{ marginTop: "4px" }}>Operator ID: <code style={{ color: "white" }}>operator</code></div>
          <div>Password: <code style={{ color: "white" }}>operator123</code></div>
        </div>

        <form onSubmit={handleLogin}>
          <label style={{ color: "#cbd5e1", fontSize: "14px", display: "block", marginBottom: "6px" }}>Operator ID</label>
          <input
            type="text"
            placeholder="Enter Operator ID"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
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

          <button className="primary-btn" type="submit" style={{ width: "100%", background: "#dc2626", padding: "12px", fontSize: "15px", fontWeight: "600" }}>
            🔐 Authenticate Operator Session
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

export default OperatorLogin;
