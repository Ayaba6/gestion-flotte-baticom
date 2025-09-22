// src/components/Layout.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

export default function Layout({ children, role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 bg-green-700 text-white flex-col">
        <div className="text-2xl font-bold p-6 border-b border-green-600">
          🚛 Flotte
        </div>
        <nav className="flex-1 p-4 space-y-4">
          <Link to="/" className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Accueil</Link>
          {role === "admin" && <Link to="/admin-dashboard" className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Admin</Link>}
          {role === "superviseur" && <Link to="/superviseur-dashboard" className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Superviseur</Link>}
          {role === "chauffeur" && <Link to="/chauffeur-dashboard" className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Chauffeur</Link>}
        </nav>
        <div className="p-4 border-t border-green-600 text-sm">
          © {new Date().getFullYear()} Gestion Flotte
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <aside className="w-64 bg-green-700 text-white flex flex-col p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="text-2xl font-bold">🚛 Flotte</div>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 space-y-4">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Accueil</Link>
              {role === "admin" && <Link to="/admin-dashboard" onClick={() => setSidebarOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Admin</Link>}
              {role === "superviseur" && <Link to="/superviseur-dashboard" onClick={() => setSidebarOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Superviseur</Link>}
              {role === "chauffeur" && <Link to="/chauffeur-dashboard" onClick={() => setSidebarOpen(false)} className="block py-2 px-4 rounded-lg hover:bg-green-600 transition">Chauffeur</Link>}
            </nav>
            <div className="p-4 border-t border-green-600 text-sm">
              © {new Date().getFullYear()} Gestion Flotte
            </div>
          </aside>
          <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white shadow p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="font-bold text-lg">🚛 Flotte</div>
          <div></div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
