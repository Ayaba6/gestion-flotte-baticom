// src/components/AdminFlotte.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResumeSection from "./ResumeSection.js";
import MissionsSection from "./MissionsSection.js";
import { supabase } from "../services/supabaseClient.js";

export default function AdminFlotte() {
  const [section, setSection] = useState("resume");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate("/login");

        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (!profile || profile.role !== "admin") return navigate("/login");

        const { data: camionsData } = await supabase.from("camions").select("*");
        setCamions(camionsData || []);
        const { data: usersData } = await supabase.from("users").select("*").eq("role", "chauffeur");
        setChauffeurs(usersData || []);
        const { data: missionsData } = await supabase.from("missions").select("*");
        setMissions(missionsData || []);

        setLoading(false);
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;

  const menuItems = [
    { key: "resume", label: "Résumé" },
    { key: "missions", label: "Missions" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="bg-green-800 text-white w-64 hidden md:flex flex-col p-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-8">Admin Flotte</h2>
        <button
          onClick={() => navigate("/adminusers")}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-green-900 hover:bg-green-700 rounded font-semibold"
        >
          ← Retour
        </button>
        <nav className="flex-1 flex flex-col gap-4">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`w-full text-left px-4 py-2 rounded font-medium ${
                section === item.key ? "bg-green-900" : "hover:bg-green-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white shadow-md px-6 py-4 md:hidden">
          <h2 className="text-xl font-bold text-green-800">Admin Flotte</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/adminusers")}
              className="px-3 py-1 bg-green-900 text-white rounded hover:bg-green-700"
            >
              ← Retour
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-green-800 text-2xl">
              {sidebarOpen ? "✖" : "☰"}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}>
            <aside
              className="bg-green-800 text-white w-64 p-6 absolute left-0 top-0 h-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl font-bold mb-8">Admin Flotte</h2>
              <button
                onClick={() => navigate("/adminusers")}
                className="mb-6 flex items-center gap-2 px-4 py-2 bg-green-900 hover:bg-green-700 rounded font-semibold"
              >
                ← Retour
              </button>
              <nav className="flex flex-col gap-4">
                {menuItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-2 rounded font-medium ${
                      section === item.key ? "bg-green-900" : "hover:bg-green-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Sections */}
        <main className="p-6 md:p-8 flex-1 overflow-auto">
          {section === "resume" && (
            <ResumeSection camions={camions} chauffeurs={chauffeurs} missions={missions} />
          )}
          {section === "missions" && (
            <MissionsSection camions={camions} chauffeurs={chauffeurs} missions={missions} />
          )}
        </main>
      </div>
    </div>
  );
}
