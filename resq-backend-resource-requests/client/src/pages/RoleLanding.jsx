import { Link, useNavigate } from "react-router-dom";
import "../index.css";

function RoleLanding() {
  const navigate = useNavigate();

  const handleOperatorClick = () => {
    const isAuth = localStorage.getItem("resq_operator_auth");
    if (isAuth === "true") {
      navigate("/operator/dashboard");
    } else {
      navigate("/operator/login");
    }
  };

  const handleGovernmentClick = () => {
    const isAuth = localStorage.getItem("resq_government_auth");
    if (isAuth === "true") {
      navigate("/government/dashboard");
    } else {
      navigate("/government/login");
    }
  };

  return (
    <div className="app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px", color: "#f9fafb" }}>
      
      {/* Header Badge */}
      <div style={{ background: "rgba(220, 38, 38, 0.15)", border: "1px solid rgba(220, 38, 38, 0.4)", borderRadius: "9999px", padding: "6px 18px", color: "#f87171", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px" }}>
        🚨 Official Disaster Coordination Platform
      </div>

      {/* Main Title */}
      <div style={{ textAlign: "center", maxWidth: "800px", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "52px", fontWeight: "900", letterSpacing: "-1px", margin: 0, background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          RESQ
        </h1>
        <p style={{ fontSize: "20px", color: "#94a3b8", marginTop: "10px", fontWeight: "500" }}>
          Intelligent Disaster Response & Relief Coordination Engine
        </p>
        <p style={{ fontSize: "16px", color: "#64748b", marginTop: "15px", fontStyle: "italic" }}>
          "Choose how you want to access RESQ"
        </p>
      </div>

      {/* 3 Role Selection Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "25px", width: "100%", maxWidth: "1100px" }}>
        
        {/* 👤 GENERAL USER CARD */}
        <div 
          onClick={() => navigate("/user")}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px",
            padding: "32px 24px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
            e.currentTarget.style.borderColor = "#38bdf8";
            e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(56, 189, 248, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
            e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.5)";
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>👤</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#38bdf8", margin: "0 0 10px 0" }}>GENERAL USER</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0", flexGrow: 1 }}>
            Report an emergency, request immediate assistance, view active disaster alerts & nearby safety shelters.
          </p>
          <button style={{ background: "#0284c7", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", cursor: "pointer", width: "100%" }}>
            Access Citizen Portal →
          </button>
        </div>

        {/* 🚨 OPERATOR CARD */}
        <div 
          onClick={handleOperatorClick}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "16px",
            padding: "32px 24px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
            e.currentTarget.style.borderColor = "#ef4444";
            e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(239, 68, 68, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
            e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.5)";
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚨</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#f87171", margin: "0 0 10px 0" }}>OPERATOR</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0", flexGrow: 1 }}>
            Manage emergencies, run serving allocation engines, trigger dynamic replanning & command response units.
          </p>
          <button style={{ background: "#dc2626", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", cursor: "pointer", width: "100%" }}>
            Enter Command Center →
          </button>
        </div>

        {/* 🏛️ GOVERNMENT CARD */}
        <div 
          onClick={handleGovernmentClick}
          style={{
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "16px",
            padding: "32px 24px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-6px)";
            e.currentTarget.style.borderColor = "#c084fc";
            e.currentTarget.style.boxShadow = "0 20px 40px -15px rgba(192, 132, 252, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.3)";
            e.currentTarget.style.boxShadow = "0 10px 30px -10px rgba(0,0,0,0.5)";
          }}
        >
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🏛️</div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#c084fc", margin: "0 0 10px 0" }}>GOVERNMENT</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0", flexGrow: 1 }}>
            Monitor disaster situations at high-level executive dashboard, initiate strategic resource coordination & policy logs.
          </p>
          <button style={{ background: "#9333ea", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "15px", cursor: "pointer", width: "100%" }}>
            Access Executive Portal →
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div style={{ marginTop: "50px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
        RESQ Multi-Role System • Real-Time Deterministic Allocation Engine • Autonomous Weather Risk & AI Integration
      </div>

    </div>
  );
}

export default RoleLanding;
