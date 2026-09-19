import { BrowserRouter, Routes, Route } from "react-router-dom";

import RoleLanding from "./pages/RoleLanding";
import GeneralUser from "./pages/GeneralUser";
import OperatorLogin from "./pages/OperatorLogin";
import GovernmentLogin from "./pages/GovernmentLogin";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import Dashboard from "./pages/Dashboard";
import Emergency from "./pages/Emergency";
import Resources from "./pages/Resources";
import Map from "./pages/Map.jsx";

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
        }}
      >
        <Routes>

          {/* Main Role Selection */}
          <Route path="/" element={<RoleLanding />} />

          {/* General User */}
          <Route path="/user" element={<GeneralUser />} />
          <Route path="/user/report" element={<GeneralUser />} />

          {/* Operator */}
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route path="/operator/dashboard" element={<Dashboard />} />

          {/* Government */}
          <Route path="/government/login" element={<GovernmentLogin />} />
          <Route
            path="/government/dashboard"
            element={<GovernmentDashboard />}
          />

          {/* Shared */}
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/map" element={<Map />} />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;