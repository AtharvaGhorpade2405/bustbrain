import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import FormViewer from "./pages/FormViewer";
import FormResponses from "./pages/FormResponses";

function App() {
  return (
    <BrowserRouter>
<nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
  <Link
    to="/home"
    style={{
      padding: "0.5rem 1rem",
      backgroundColor: "#2563eb",
      color: "white",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "500",
    }}
  >
    Login
  </Link>

  <Link
    to="/dashboard"
    style={{
      padding: "0.5rem 1rem",
      backgroundColor: "#1e293b",
      color: "white",
      borderRadius: "6px",
      textDecoration: "none",
      fontWeight: "500",
    }}
  >
    Dashboard
  </Link>
</nav>


      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form/:formId" element={<FormViewer />} />
        <Route path="/forms/:formId/responses" element={<FormResponses />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
