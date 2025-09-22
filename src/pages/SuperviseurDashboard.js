// src/pages/SuperviseurDashboard.js
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import {
  LayoutDashboard, ClipboardList, AlertTriangle, FileText,
  Users, Truck, Activity
} from "lucide-react";

import logoSociete from "../assets/logo.png";

// Sections
import MissionsSection from "../components/MissionsSection.js";
import PannesDeclarees from "../components/PannesDeclarees.js";
import AlertesExpiration from "../components/AlertesExpiration.js";

// Map imports
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

// Créer des icônes colorées
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
  const [section, setSection] = useState("resume");
  const [loading, setLoading] = useState(true);
  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [pannes, setPannes] = useState([]);
  const [newPannesCount, setNewPannesCount] = useState(0);
  const [user, setUser] = useState(null);

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
          toast(`🚨 Nouvelle panne déclarée par ${payload.new.chauffeur_email || "un chauffeur"}`);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [navigate]);

  if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;

  const menuItems = [
    { key: "resume", label: "Résumé", icon: <LayoutDashboard size={18} /> },
    { key: "missions", label: "Missions", icon: <ClipboardList size={18} /> },
    { key: "pannes", label: "Pannes", icon: <AlertTriangle size={18} />, badge: newPannesCount },
    { key: "documents", label: "Documents", icon: <FileText size={18} /> },
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

      {/* Sidebar */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-8">📊 Superviseur</h2>
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
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <img src={logoSociete} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            <h1 className="text-lg sm:text-xl font-bold text-green-700">BATICOM - Superviseur</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
            <span className="text-gray-700 font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-[250px]">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col p-6">
          {section === "resume" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl shadow p-6 transform hover:scale-105 transition">
                  <Truck className="mb-2" size={32} />
                  <h3 className="text-2xl font-bold">{camions.length}</h3>
                  <p className="opacity-80">Camions actifs</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl shadow p-6 transform hover:scale-105 transition">
                  <Users className="mb-2" size={32} />
                  <h3 className="text-2xl font-bold">{chauffeurs.length}</h3>
                  <p className="opacity-80">Chauffeurs</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-xl shadow p-6 transform hover:scale-105 transition">
                  <ClipboardList className="mb-2" size={32} />
                  <h3 className="text-2xl font-bold">{missions.length}</h3>
                  <p className="opacity-80">Missions</p>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl shadow p-6 transform hover:scale-105 transition">
                  <AlertTriangle className="mb-2" size={32} />
                  <h3 className="text-2xl font-bold">{pannes.length}</h3>
                  <p className="opacity-80">Pannes signalées</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow p-6 transform hover:scale-105 transition">
                  <Activity className="mb-2" size={32} />
                  <h3 className="text-2xl font-bold">{camions.length + chauffeurs.length}</h3>
                  <p className="opacity-80">Suivi de la flotte</p>
                </div>
              </div>

              {/* Carte interactive */}
              <div className="h-96 w-full rounded-xl shadow overflow-hidden">
                <MapContainer center={center} zoom={13} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {camions
                    .filter(camion => camion.latitude && camion.longitude)
                    .map(camion => (
                      <Marker
                        key={camion.id}
                        position={[camion.latitude, camion.longitude]}
                        icon={getMarkerIcon(camion)}
                      >
                        <Popup>
                          Camion {camion.immatriculation || camion.id} <br /> Statut: {camion.statut}
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
        </div>
      </div>
    </div>
  );
}
