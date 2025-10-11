// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Pages
import Login from "./pages/Login.js";

// Dashboards
import AdminDashboard from "./pages/AdminDashboard.js";
import SuperviseurDashboard from "./pages/SuperviseurDashboard.js";
import ChauffeurDashboard from "./pages/ChauffeurDashboard.js";
import BillingExpenses from "./pages/BillingExpenses.js";

// Admin modules
import AdminUsers from "./components/AdminUsers.js";
import AdminFlotte from "./components/AdminFlotte.js";
import PannesDeclarees from "./components/PannesDeclarees.js";
import AlertesExpiration from "./components/AlertesExpiration.js";

// Chauffeur modules
import MissionsHistorique from "./components/MissionsHistorique.js";
import PannesHistorique from "./components/PannesHistorique.js";

// ProtectedRoute
import ProtectedRoute from "./components/ProtectedRoute.js";

export default function App() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-flotte"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminFlotte />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pannesdeclarees"
        element={
          <ProtectedRoute requiredRole="admin">
            <PannesDeclarees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alertes-expirations"
        element={
          <ProtectedRoute requiredRole="admin">
            <AlertesExpiration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute requiredRole="admin">
            <BillingExpenses />
          </ProtectedRoute>
        }
      />

      {/* Superviseur routes */}
      <Route
        path="/superviseur"
        element={
          <ProtectedRoute requiredRole="superviseur">
            <SuperviseurDashboard />
          </ProtectedRoute>
        }
      />

      {/* Chauffeur routes */}
      <Route
        path="/chauffeur"
        element={
          <ProtectedRoute requiredRole="chauffeur">
            <ChauffeurDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/missionshistorique"
        element={
          <ProtectedRoute requiredRole="chauffeur">
            <MissionsHistorique />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panneshistorique"
        element={
          <ProtectedRoute requiredRole="chauffeur">
            <PannesHistorique />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
