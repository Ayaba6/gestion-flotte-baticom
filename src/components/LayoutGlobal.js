// src/components/LayoutGlobal.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import logo from "../assets/logo.png";

export default function LayoutGlobal({ children, userRole, userEmail, handleLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const sectionsByRole = {
    admin: [
      { id: "users", label: "Gestion Users", icon: "👥", path: "/admin-users" },
      { id: "flotte", label: "Gestion Flotte", icon: "🚛", path: "/admin-flotte" },
    ],
    superviseur: [
      { id: "missions", label: "Missions", icon: "📋", path: "/superviseur-missions" },
      { id: "rapports", label: "Rapports", icon: "📊", path: "/superviseur-rapports" },
    ],
    chauffeur: [
      { id: "missions", label: "Missions", icon: "🚚", path: "/chauffeur-missions" },
      { id: "historique", label: "Historique", icon: "📜", path: "/chauffeur-historique" },
    ],
  };

  const sections = sectionsByRole[userRole] || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-blue-700 text-white flex-col p-6 gap-6">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
        <h2 className="text-2xl font-bold">{userRole?.toUpperCase()}</h2>
        <p className="text-sm">{userEmail}</p>

        <nav className="flex-1 mt-4">
          <ul className="flex flex-col gap-2">
            {sections.map((sec) => (
              <li
                key={sec.id}
                className="cursor-pointer hover:bg-blue-600 rounded px-3 py-2"
                onClick={() => navigate(sec.path)}
              >
                {sec.icon} {sec.label}
              </li>
            ))}
          </ul>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto bg-red-600 py-2 rounded hover:bg-red-700 flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>

      {/* Hamburger mobile */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 bg-blue-700 text-white p-2 rounded shadow z-50"
      >
        <Menu size={24} />
      </button>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
