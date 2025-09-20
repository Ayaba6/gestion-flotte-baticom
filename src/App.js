import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.js";
import AdminDashboard from "./pages/AdminDashboard.js";
import AdminUsers from "./components/AdminUsers.js";
import AdminFlotte from "./components/AdminFlotte.js";
import SuperviseurDashboard from "./pages/SuperviseurDashboard.js";
import ChauffeurDashboard from "./pages/ChauffeurDashboard.js";
import PannesDeclarees from "./components/PannesDeclarees.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import "leaflet/dist/leaflet.css";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin */}
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

      {/* Superviseur */}
      <Route
        path="/superviseur"
        element={
          <ProtectedRoute requiredRole="superviseur">
            <SuperviseurDashboard />
          </ProtectedRoute>
        }
      />

      {/* Chauffeur */}
      <Route
        path="/chauffeur"
        element={
          <ProtectedRoute requiredRole="chauffeur">
            <ChauffeurDashboard />
          </ProtectedRoute>
        }
      />

      {/* Pannes déclarées */}
      <Route
        path="/pannesdeclarees"
        element={
          <ProtectedRoute requiredRole="admin">
            <PannesDeclarees />
          </ProtectedRoute>
        }
      />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
