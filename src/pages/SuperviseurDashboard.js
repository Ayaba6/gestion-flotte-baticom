// src/pages/SuperviseurDashboard.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { LayoutDashboard, ClipboardList, AlertTriangle, FileText, Users, Truck, Menu, X } from "lucide-react";

import logoSociete from "../assets/logo.png";

// Sections
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";

// Carte flotte centralisée
import CarteFlotteCentral from "../components/CarteFlotteCentral.js";

// Profil générique
import ProfilUser from "../components/ProfilUser.js";

export default function SuperviseurDashboard() {
  const [section, setSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPannesCount, setNewPannesCount] = useState(0);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "missions", label: "Missions", icon: <ClipboardList size={18} /> },
    { key: "pannes", label: "Pannes", icon: <AlertTriangle size={18} />, badge: newPannesCount },
    { key: "documents", label: "Documents", icon: <FileText size={18} /> }
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar desktop */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
          <h2 className="text-2xl font-bold">BATICOM</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          {menuItems.map(item => (
            <button key={item.key} onClick={() => { setSection(item.key); if (item.key === "pannes") setNewPannesCount(0); }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${section === item.key ? "bg-blue-700" : "hover:bg-blue-800"}`}>
              {item.icon} {item.label}
              {item.badge > 0 && (
                <span className="ml-auto bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex justify-between items-center">
          <div>
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-blue-900">
              <Menu size={28} />
            </button>
          </div>
          <ProfilUser user={user} setUser={setUser} />
        </header>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-xl">
              <div className="flex flex-col items-center mb-6 relative">
                <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
                <h2 className="text-2xl font-bold">BATICOM</h2>
                <button onClick={() => setSidebarOpen(false)} className="absolute top-0 right-0 mt-2 mr-2 text-white hover:text-gray-300">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 flex flex-col gap-3">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setSection(item.key); setSidebarOpen(false); if (item.key === "pannes") setNewPannesCount(0); }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${section === item.key ? "bg-blue-700" : "hover:bg-blue-800"}`}
                  >
                    {item.icon} {item.label}
                    {item.badge > 0 && (
                      <span className="ml-auto bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
            <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          {section === "dashboard" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow p-4">
                  <Truck className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Camions</h3>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl shadow p-4">
                  <Users className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Chauffeurs</h3>
                </div>
                <div onClick={() => setSection("missions")} className="cursor-pointer bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow p-4">
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Missions</h3>
                </div>
                <div onClick={() => setSection("pannes")} className="cursor-pointer bg-gradient-to-r from-red-400 to-red-600 text-white rounded-xl shadow p-4">
                  <AlertTriangle className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Pannes</h3>
                </div>
                <div onClick={() => setSection("documents")} className="cursor-pointer bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow p-4">
                  <FileText className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Alertes</h3>
                </div>
              </div>

              {/* Carte flotte centralisée */}
              <div className="h-80 sm:h-96 w-full rounded-xl shadow overflow-hidden">
                <CarteFlotteCentral />
              </div>
            </>
          )}

          {section === "missions" && <MissionsSection />}
          {section === "pannes" && <PannesDeclarees />}
          {section === "documents" && <AlertesExpiration />}
        </div>
      </div>
    </div>
  );
}
