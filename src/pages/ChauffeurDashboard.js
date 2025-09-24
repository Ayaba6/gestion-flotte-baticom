// src/pages/ChauffeurDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import { Truck, ClipboardList, LayoutDashboard, Menu, X } from "lucide-react";
import logoSociete from "../assets/logo.png";

// Profil
import ProfilUser from "../components/ProfilUser.js";

// Leaflet
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function ChauffeurDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState("dashboard");

  // Modal panne
  const [showPanneModal, setShowPanneModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [typePanne, setTypePanne] = useState("");
  const [descriptionPanne, setDescriptionPanne] = useState("");
  const [photo, setPhoto] = useState(null);

  // Positions
  const [positions, setPositions] = useState([]);

  // Centre de la carte
  const center = useMemo(() => {
    const last = positions[positions.length - 1];
    return last && last.latitude && last.longitude
      ? [Number(last.latitude), Number(last.longitude)]
      : [12.37, -1.53]; // par défaut Ouagadougou
  }, [positions]);

  // Récupération utilisateur et missions
  useEffect(() => {
    const fetchUserAndMissions = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return navigate("/login");
      setUser(user);

      const { data: missionsData } = await supabase
        .from("missions")
        .select("*")
        .eq("chauffeur_id", user.id)
        .order("created_at", { ascending: false });

      setMissions(missionsData || []);
      setLoading(false);
    };
    fetchUserAndMissions();
  }, [navigate]);

  // Suivi GPS en temps réel
  useEffect(() => {
    if (!user) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const newPos = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          created_at: new Date().toISOString(),
        };

        setPositions((prev) => [...prev, newPos]);

        // On enregistre en base
        const { error } = await supabase.from("positions").insert([{
          chauffeur_id: user.id,
          latitude: newPos.latitude,
          longitude: newPos.longitude,
        }]);

        if (error) console.error("Erreur insertion position:", error);
      },
      (err) => console.error("Erreur GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const startMission = async (mission) => {
    await supabase.from("missions").update({ statut: "en_cours" }).eq("id", mission.id);
    setMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, statut: "en_cours" } : m))
    );
  };

  const finishMission = async (mission) => {
    await supabase.from("missions").update({ statut: "terminee" }).eq("id", mission.id);
    setMissions((prev) =>
      prev.map((m) => (m.id === mission.id ? { ...m, statut: "terminee" } : m))
    );
  };

  const declarePanne = async () => {
    if (!typePanne || !descriptionPanne) return alert("Remplissez type et description");

    let latitude = null,
      longitude = null;
    await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          resolve();
        },
        (err) => {
          console.error(err);
          resolve();
        }
      );
    });

    let photoUrl = null;
    if (photo) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("pannes")
        .upload(fileName, photo, { upsert: true });
      if (!error) photoUrl = data.path;
    }

    const { error } = await supabase.from("alertespannes").insert([
      {
        mission_id: selectedMission.id,
        chauffeur_id: user.id,
        typepanne: typePanne,
        description: descriptionPanne,
        photo: photoUrl,
        latitude,
        longitude,
      },
    ]);

    if (error) toast.error("Erreur lors de la déclaration de panne !");
    else {
      toast.success("Panne déclarée !");
      setShowPanneModal(false);
      setTypePanne("");
      setDescriptionPanne("");
      setPhoto(null);
    }
  };

  if (loading)
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;

  const missionsEnCours = missions.filter((m) => m.statut === "en_cours");
  const missionsTerminees = missions.filter((m) => m.statut === "terminee");
  const missionsAVenir = missions.filter((m) => m.statut === "a_venir");

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "missions", label: "Missions", icon: <ClipboardList size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      <Toaster position="top-right" />

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="bg-blue-900 text-white w-64 flex flex-col p-6 shadow-xl">
            <div className="flex flex-col items-center mb-6">
              <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
              <h2 className="text-2xl font-bold">BATICOM</h2>
            </div>
            <nav className="flex-1 flex flex-col gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setSection(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                    section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>
            <button
              onClick={() => setSidebarOpen(false)}
              className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
            >
              Fermer
            </button>
          </aside>
          <div className="flex-1 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="bg-blue-900 text-white w-64 hidden md:flex flex-col p-6 shadow-xl z-40">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSociete} alt="Logo" className="w-16 h-16 object-contain mb-2" />
          <h2 className="text-2xl font-bold">BATICOM</h2>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col z-0">
        <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-blue-900">
              <Menu size={28} />
            </button>
          </div>
          <ProfilUser user={user} setUser={setUser} />
        </header>

        <div className="flex-1 flex flex-col p-4 sm:p-6">
          {section === "dashboard" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <StatCard
                  title="Missions en cours"
                  value={missionsEnCours.length}
                  color="from-blue-500 to-blue-600"
                />
                <StatCard
                  title="Missions terminées"
                  value={missionsTerminees.length}
                  color="from-green-500 to-green-600"
                />
                <StatCard
                  title="Missions à venir"
                  value={missionsAVenir.length}
                  color="from-yellow-400 to-yellow-500"
                />
              </div>

              {/* Carte */}
              <div className="relative z-0 h-80 sm:h-96 w-full rounded-xl shadow-lg overflow-hidden mt-6">
                <MapContainer center={center} zoom={13} className="h-full w-full z-0 rounded-xl">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {positions.length > 0 && <ChauffeurTrajet positions={positions} />}
                </MapContainer>
              </div>
            </>
          )}

          {section === "missions" && (
            <MissionTable
              missions={missions}
              startMission={startMission}
              finishMission={finishMission}
              setSelectedMission={setSelectedMission}
              setShowPanneModal={setShowPanneModal}
            />
          )}

          {section === "profil" && <ProfilUser user={user} setUser={setUser} />}
        </div>

        {/* Modal Panne */}
        {showPanneModal && (
          <ModalPanne
            onClose={() => setShowPanneModal(false)}
            typePanne={typePanne}
            setTypePanne={setTypePanne}
            descriptionPanne={descriptionPanne}
            setDescriptionPanne={setDescriptionPanne}
            photo={photo}
            setPhoto={setPhoto}
            declarePanne={declarePanne}
          />
        )}
      </div>
    </div>
  );
}

// --------- Composants enfants ---------
function ChauffeurTrajet({ positions }) {
  if (!positions || positions.length === 0) return null;
  const polyline = positions.map((p) => [Number(p.latitude), Number(p.longitude)]);
  const lastPos = positions[positions.length - 1];

  return (
    <>
      <Polyline positions={polyline} color="blue" />
      <Marker position={[Number(lastPos.latitude), Number(lastPos.longitude)]}>
        <Popup>Dernière position : {new Date(lastPos.created_at).toLocaleTimeString()}</Popup>
      </Marker>
    </>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div
      className={`bg-gradient-to-r ${color} text-white rounded-xl shadow-lg p-5 transform transition duration-300 hover:scale-105 hover:shadow-2xl`}
    >
      <div className="flex items-center gap-3">
        <ClipboardList size={28} />
        <div>
          <h3 className="text-2xl font-bold">{value}</h3>
          <p className="opacity-90 text-sm">{title}</p>
        </div>
      </div>
    </div>
  );
}

function MissionTable({ missions, startMission, finishMission, setSelectedMission, setShowPanneModal }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Mission</th>
            <th className="py-2 px-4 text-left">Description</th>
            <th className="py-2 px-4 text-left">Camion</th>
            <th className="py-2 px-4 text-left">Statut</th>
            <th className="py-2 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="py-2 px-4">{m.nom}</td>
              <td className="py-2 px-4">{m.description}</td>
              <td className="py-2 px-4">{m.camion_id}</td>
              <td className="py-2 px-4">{m.statut}</td>
              <td className="py-2 px-4 flex gap-2">
                {m.statut === "a_venir" && (
                  <button
                    onClick={() => startMission(m)}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                  >
                    Démarrer
                  </button>
                )}
                {m.statut === "en_cours" && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMission(m);
                        setShowPanneModal(true);
                      }}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      Déclarer panne
                    </button>
                    <button
                      onClick={() => finishMission(m)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Terminer
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModalPanne({ onClose, typePanne, setTypePanne, descriptionPanne, setDescriptionPanne, photo, setPhoto, declarePanne }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2">
      <div className="bg-white p-4 sm:p-6 rounded w-full max-w-sm sm:max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Déclarer une panne</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Type de panne"
            value={typePanne}
            onChange={(e) => setTypePanne(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={descriptionPanne}
            onChange={(e) => setDescriptionPanne(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input type="file" onChange={(e) => setPhoto(e.target.files[0])} className="w-full text-sm" />
          <button
            onClick={declarePanne}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
