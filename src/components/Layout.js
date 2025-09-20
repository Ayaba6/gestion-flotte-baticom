// src/components/Layout.js
import React from "react";
import { Link } from "react-router-dom";

export default function Layout({ children, role }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-green-700 text-white flex flex-col">
        <div className="text-2xl font-bold p-6 border-b border-green-600">
          🚛 Flotte
        </div>
        <nav className="flex-1 p-4 space-y-4">
          <Link
            to="/"
            className="block py-2 px-4 rounded-lg hover:bg-green-600 transition"
          >
            Accueil
          </Link>
          {role === "admin" && (
            <Link
              to="/admin-dashboard"
              className="block py-2 px-4 rounded-lg hover:bg-green-600 transition"
            >
              Admin
            </Link>
          )}
          {role === "superviseur" && (
            <Link
              to="/superviseur-dashboard"
              className="block py-2 px-4 rounded-lg hover:bg-green-600 transition"
            >
              Superviseur
            </Link>
          )}
          {role === "chauffeur" && (
            <Link
              to="/chauffeur-dashboard"
              className="block py-2 px-4 rounded-lg hover:bg-green-600 transition"
            >
              Chauffeur
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-green-600 text-sm">
          © {new Date().getFullYear()} Gestion Flotte
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
