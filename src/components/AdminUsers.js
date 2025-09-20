import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSection from "./UserSection.js";
import CamionsSection from "./CamionsSection.js";
import { supabase } from "../services/supabaseClient.js";

export default function AdminUsers() {
  const [section, setSection] = useState("users"); // <-- Afficher UserSection par défaut
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
        return;
      }

      // Vérifier le rôle dans la table users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        navigate("/login");
        return;
      }

      if (profile.role !== "admin") {
        // Rediriger selon rôle
        if (profile.role === "superviseur") navigate("/superviseur");
        else if (profile.role === "chauffeur") navigate("/chauffeur");
        else navigate("/login");
        return;
      }

      setUserRole(profile.role);
      setLoading(false);
    };

    checkUser();
  }, [navigate]);

  if (loading) return <div>Chargement...</div>;

  const menuItems = [
    { key: "users", label: "Utilisateurs" },
    { key: "camions", label: "Camions" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full bg-blue-700 text-white w-64 p-6 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <h2 className="text-2xl font-bold mb-8">Gestion Utilisateurs</h2>
        <nav className="flex-1 flex flex-col space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSection(item.key);
                setSidebarOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 rounded ${
                section === item.key ? "bg-blue-900" : "hover:bg-blue-600"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="mt-auto">
            <button
              onClick={() => navigate("/admin")}
              className="block w-full text-left px-4 py-2 rounded bg-gray-600 hover:bg-gray-500"
            >
              ⬅ Retour
            </button>
          </div>
        </nav>
      </aside>

      {/* Mobile Hamburger */}
      <div className="md:hidden flex justify-between items-center bg-blue-700 text-white p-4">
        <h2 className="text-xl font-bold">Gestion Utilisateurs</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 mt-0 md:mt-0">
        {section === "users" && <UserSection />}
        {section === "camions" && <CamionsSection />}
      </main>
    </div>
  );
}
