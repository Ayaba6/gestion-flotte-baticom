// src/pages/SuperviseurDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  FileText,
  Users,
  Truck,
  Menu,
  X
} from "lucide-react";

import logoSociete from "../assets/logo.png";

// Sections
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";

// Carte flotte
import CarteFlotte from "../components/CarteFlotte.js";

// Profil générique
import ProfilUser from "../components/ProfilUser.js";

export default function SuperviseurDashboard() {
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [newPannesCount, setNewPannesCount] = useState(0);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const center = useMemo(() => [12.37, -1.53], []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return navigate("/login");
      setUser(user);

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || profile.role !== "superviseur") return navigate("/login");

      const { data: camionsData } = await supabase.from("camions").select("*");
      setCamions(camionsData || []);

      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("role", "chauffeur");
      setChauffeurs(usersData || []);

      const { data: missionsData } = await supabase.from("missions").select("*");
      setMissions(missionsData || []);

      const { data: pannesData } = await supabase
        .from("alertesPannes")
        .select("*, chauffeur:users(id,email,user_metadata,camion_id)")
        .order("created_at", { ascending: false });
      setPannes(pannesData || []);

      const { data: alertesData } = await supabase
        .from("alertes_expirations")
        .select("*")
        .order("date_expiration", { ascending: true });
      setAlertes(alertesData || []);

      setLoading(false);
    };
    fetchData();

    const channel = supabase
      .channel("pannes-superviseur")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertesPannes" },
        (payload) => {
          setPannes(prev => [payload.new, ...prev]);
          setNewPannesCount(prev => prev + 1);
          toast(`🚨 Nouvelle panne déclarée`);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "missions", label: "Missions", icon: <ClipboardList size={18} /> },
    { key: "pannes", label: "Pannes", icon: <AlertTriangle size={18} />, badge: newPannesCount },
    { key: "documents", label: "Documents", icon: <FileText size={18} /> }
  ];

  const criticalAlertesCount = alertes.filter(a => a.criticite === "critique").length;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-xl">
            <div className="flex flex-col items-center mb-6 relative">
              <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-2xl font-bold">BATICOM</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-0 right-0 mt-2 mr-2 text-white hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-3">
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setSidebarOpen(false); if (item.key === "pannes") setNewPannesCount(0); }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                    section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
                  }`}
                >
                  {item.icon} {item.label}
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </aside>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
          <h2 className="text-2xl font-bold">BATICOM</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          {menuItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setSection(item.key); if (item.key === "pannes") setNewPannesCount(0); }}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
              }`}
            >
              {item.icon} {item.label}
              {item.badge > 0 && (
                <span className="ml-auto bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-blue-900">
              <Menu size={28} />
            </button>
          </div>

          {/* Zone profil */}
          <ProfilUser user={user} setUser={setUser} />
        </header>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          {section === "dashboard" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <Truck className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{camions.length}</h3>
                  <p className="opacity-80 text-sm">Camions actifs</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <Users className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{chauffeurs.length}</h3>
                  <p className="opacity-80 text-sm">Chauffeurs</p>
                </div>
                <div onClick={() => setSection("missions")} className="cursor-pointer bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{missions.length}</h3>
                  <p className="opacity-80 text-sm">Missions</p>
                </div>
                <div onClick={() => setSection("pannes")} className={`cursor-pointer rounded-xl shadow p-4 transform transition hover:scale-105 duration-300 text-white ${pannes.length > 5 ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-red-400 to-red-600'}`}>
                  <AlertTriangle className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{pannes.length}</h3>
                  <p className="opacity-80 text-sm">Pannes signalées</p>
                </div>
                <div onClick={() => setSection("documents")} className="cursor-pointer bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <FileText className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{criticalAlertesCount}</h3>
                  <p className="opacity-80 text-sm">Alertes expirations</p>
                </div>
              </div>

              <div className="h-80 sm:h-96 w-full rounded-xl shadow overflow-hidden">
                <CarteFlotte chauffeurs={chauffeurs} />
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
