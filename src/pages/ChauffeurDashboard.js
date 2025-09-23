// src/pages/ChauffeurDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import { toast, Toaster } from "react-hot-toast";
import { Truck, ClipboardList, LayoutDashboard, Menu, X } from "lucide-react";
import logoSociete from "../assets/logo.png";
import ProfileSettingsChauffeur from "../components/ProfileSettingsChauffeur.js";
import ChauffeurTracker from "../components/ChauffeurTracker.js";

// Leaflet
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Icône verte pour le chauffeur
const greenIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function ChauffeurDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [section, setSection] = useState("dashboard");
  const [positions, setPositions] = useState([]);

  // Modal panne
  const [showPanneModal, setShowPanneModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [typePanne, setTypePanne] = useState("");
  const [descriptionPanne, setDescriptionPanne] = useState("");
  const [photo, setPhoto] = useState(null);

  const center = useMemo(() => [12.37, -1.53], []);

  // Récupération utilisateur et missions
  useEffect(() => {
    const fetchUserAndMissions = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate("/login");
        return;
      }
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

    // Récupérer positions existantes
    const fetchPositions = async () => {
      const { data } = await supabase
        .from("positions")
        .select("*")
        .eq("chauffeur_id", user.id)
        .order("created_at", { ascending: true });
      setPositions(data || []);
    };
    fetchPositions();

    // Abonnement temps réel Supabase
    const channel = supabase
      .channel("chauffeur-positions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "positions" },
        (payload) => {
          if (payload.new.chauffeur_id === user.id) {
            setPositions((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    // Geolocation en continu
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await supabase.from("positions").insert([
          {
            chauffeur_id: user.id,
            latitude,
            longitude,
          },
        ]);
      },
      (err) => console.error("Erreur GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => {
      supabase.removeChannel(channel);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const startMission = async (mission) => {
    await supabase
      .from("missions")
      .update({ statut: "en_cours" })
      .eq("id", mission.id);
    setMissions((prev) =>
      prev.map((m) =>
        m.id === mission.id ? { ...m, statut: "en_cours" } : m
      )
    );
  };

  const finishMission = async (mission) => {
    await supabase
      .from("missions")
      .update({ statut: "terminee" })
      .eq("id", mission.id);
    setMissions((prev) =>
      prev.map((m) =>
        m.id === mission.id ? { ...m, statut: "terminee" } : m
      )
    );
  };

  const declarePanne = async () => {
    if (!typePanne || !descriptionPanne) return alert("Remplissez type et description");

    let latitude = null, longitude = null;
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

    if (error) {
      console.error(error);
      toast.error("Erreur lors de la déclaration de panne !");
    } else {
      toast.success("Panne déclarée !");
      setShowPanneModal(false);
      setTypePanne("");
      setDescriptionPanne("");
      setPhoto(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );

  const missionsEnCours = missions.filter((m) => m.statut === "en_cours");
  const missionsTerminees = missions.filter((m) => m.statut === "terminee");
  const missionsAVenir = missions.filter((m) => m.statut === "a_venir");

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { key: "missions", label: "Missions", icon: <ClipboardList size={18} /> },
    { key: "profil", label: "Profil", icon: <Truck size={18} /> },
  ];

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
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setSection(item.key); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition ${
                    section === item.key ? "bg-blue-700" : "hover:bg-blue-800"
                  }`}
                >
                  {item.icon} {item.label}
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
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-blue-900">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                <div className="bg-blue-500 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{missionsEnCours.length}</h3>
                  <p className="opacity-80 text-sm">Missions en cours</p>
                </div>
                <div className="bg-green-500 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{missionsTerminees.length}</h3>
                  <p className="opacity-80 text-sm">Missions terminées</p>
                </div>
                <div className="bg-yellow-400 text-white rounded-xl shadow p-4 transform transition hover:scale-105 duration-300">
                  <ClipboardList className="mb-2" size={28} />
                  <h3 className="text-xl font-bold">{missionsAVenir.length}</h3>
                  <p className="opacity-80 text-sm">Missions à venir</p>
                </div>
              </div>

              {/* Carte interactive */}
              <div className="h-80 sm:h-96 w-full rounded-xl shadow overflow-hidden mt-6">
                <MapContainer center={center} zoom={13} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />

                  {/* Composant pour tracker et envoyer la position */}
                  {user && <ChauffeurTracker missionId={missionsEnCours[0]?.id} userId={user.id} />}

                  {/* Affichage du trajet et du marker */}
                  {positions.length > 0 && (
                    <>
                      <Polyline positions={positions.map((p) => [p.latitude, p.longitude])} color="blue" />
                      <Marker
                        position={[positions[positions.length - 1].latitude, positions[positions.length - 1].longitude]}
                        icon={greenIcon}
                      >
                        <Popup>
                          Dernière position : {new Date(positions[positions.length - 1].created_at).toLocaleTimeString()}
                        </Popup>
                      </Marker>
                    </>
                  )}
                </MapContainer>
              </div>
            </>
          )}

          {section === "missions" && (
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
                              onClick={() => { setSelectedMission(m); setShowPanneModal(true); }}
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
          )}

          {section === "profil" && (
            <ProfileSettingsChauffeur user={user} setUser={setUser} />
          )}
        </div>

        {/* Modal Panne */}
        {showPanneModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2">
            <div className="bg-white p-4 sm:p-6 rounded w-full max-w-sm sm:max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Déclarer une panne</h2>
                <button onClick={() => setShowPanneModal(false)}>
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
                <input
                  type="file"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="w-full text-sm"
                />
                <button
                  onClick={declarePanne}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
