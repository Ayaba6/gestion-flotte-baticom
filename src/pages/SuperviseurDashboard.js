// src/pages/SuperviseurDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import {
  LayoutDashboard, ClipboardList, AlertTriangle, FileText,
  Users, Truck, Activity, Menu
} from "lucide-react";

import logoSociete from "../assets/logo.png";

// Sections
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";
import ProfileSettings from "../components/ProfileSettings.js";

// Map imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

// Icônes colorées pour la carte
const greenIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const redIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const orangeIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function SuperviseurDashboard() {
  const [section, setSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [pannes, setPannes] = useState([]);
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
        .select("*, chauffeur:users(id,email)")
        .order("created_at", { ascending: false });
      setPannes(pannesData || []);

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
    { key: "documents", label: "Documents", icon: <FileText size={18} /> },
    { key: "profil", label: "Profil", icon: <Users size={18} /> },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const getMarkerIcon = (camion) => {
    if (camion.statut === "actif") return greenIcon;
    if (camion.statut === "en_panne") return redIcon;
    if (camion.statut === "en_mission") return orangeIcon;
    return greenIcon;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-2xl font-bold">BATICOM</h2>
            </div>
            <nav className="flex-1 flex flex-col gap-3">
              {menuItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { 
                    setSection(item.key); 
                    if (item.key === "pannes") setNewPannesCount(0); 
                    setSidebarOpen(false);
                  }}
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
            <button
              onClick={handleLogout}
              className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
            >
              Déconnexion
            </button>
          </aside>
          <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
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
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
        >
          Déconnexion
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-blue-900"
            >
              <Menu size={28} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-[250px]">
              {user?.email}
            </span>
            <img
              src={user?.user_metadata?.avatar || "/default-avatar.png"}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover cursor-pointer border-2 border-gray-300"
              onClick={() => setSection("profil")}
              title="Cliquez pour modifier le profil"
            />
          </div>
        </header>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col p-4 sm:p-6">
          {section === "dashboard" && (
            <>
              {/* Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
                
                {/* Camions card */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <Truck className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{camions.length}</h3>
                  <p className="opacity-80 text-sm">Camions actifs</p>
                  <div className="w-full bg-blue-300 h-1 rounded mt-2">
                    <div className="bg-white h-1 rounded" style={{ width: `${Math.min(camions.length / 50 * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Chauffeurs card */}
                <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <Users className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{chauffeurs.length}</h3>
                  <p className="opacity-80 text-sm">Chauffeurs</p>
                  <div className="w-full bg-green-300 h-1 rounded mt-2">
                    <div className="bg-white h-1 rounded" style={{ width: `${Math.min(chauffeurs.length / 50 * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Missions card clickable */}
                <div 
                  onClick={() => setSection("missions")}
                  className="cursor-pointer bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300"
                >
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{missions.length}</h3>
                  <p className="opacity-80 text-sm">Missions</p>
                  <div className="w-full bg-yellow-200 h-1 rounded mt-2">
                    <div className="bg-white h-1 rounded" style={{ width: `${Math.min(missions.length / 50 * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Pannes card clickable */}
                <div 
                  onClick={() => setSection("pannes")}
                  className={`cursor-pointer rounded-xl shadow p-4 transform transition hover:scale-105 duration-300 text-white ${pannes.length > 5 ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                >
                  <AlertTriangle className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{pannes.length}</h3>
                  <p className="opacity-80 text-sm">Pannes signalées</p>
                  <div className="w-full bg-red-300 h-1 rounded mt-2">
                    <div className="bg-white h-1 rounded" style={{ width: `${Math.min(pannes.length / 20 * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Alertes expirations card clickable */}
                <div
                  onClick={() => setSection("documents")}
                  className="cursor-pointer bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300"
                >
                  <FileText className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">Alertes</h3>
                  <p className="opacity-80 text-sm">Expirations</p>
                  <div className="w-full bg-purple-300 h-1 rounded mt-2">
                    <div className="bg-white h-1 rounded" style={{ width: "100%" }} />
                  </div>
                </div>

              </div>

              {/* Carte interactive */}
              <div className="h-80 sm:h-96 w-full rounded-xl shadow overflow-hidden">
                <MapContainer center={center} zoom={13} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {camions
                    .filter(c => c.latitude && c.longitude)
                    .map(c => (
                      <Marker
                        key={c.id}
                        position={[c.latitude, c.longitude]}
                        icon={getMarkerIcon(c)}
                      >
                        <Popup>
                          Camion {c.immatriculation || c.id} <br /> Statut: {c.statut}
                        </Popup>
                      </Marker>
                  ))}
                </MapContainer>
              </div>
            </>
          )}

          {section === "missions" && <MissionsSection />}
          {section === "pannes" && <PannesDeclarees />}
          {section === "documents" && <AlertesExpiration />}
          {section === "profil" && <ProfileSettings user={user} setUser={setUser} />}
        </div>
      </div>
    </div>
  );
}
