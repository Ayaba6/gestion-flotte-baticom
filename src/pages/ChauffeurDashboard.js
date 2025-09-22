// src/pages/ChauffeurDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import logoSociete from "../assets/logo.png";
import { Truck, ClipboardList, AlertCircle, X } from "lucide-react";

export default function ChauffeurDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPanneModal, setShowPanneModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const [typePanne, setTypePanne] = useState("");
  const [descriptionPanne, setDescriptionPanne] = useState("");
  const [photo, setPhoto] = useState(null);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const startMission = async (mission) => {
    await supabase.from("missions").update({ statut: "en_cours" }).eq("id", mission.id);
    setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, statut: "en_cours" } : m));
  };

  const declarePanne = async () => {
    if (!typePanne || !descriptionPanne) return alert("Remplissez type et description");

    let latitude = null, longitude = null;
    await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => { latitude = pos.coords.latitude; longitude = pos.coords.longitude; resolve(); },
        err => { console.error(err); resolve(); }
      );
    });

    let photoUrl = null;
    if (photo) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("pannes").upload(fileName, photo);
      if (!error) photoUrl = data.path;
    }

    await supabase.from("alertesPannes").insert([{
      mission_id: selectedMission.id,
      chauffeur_id: user.id,
      type: typePanne,
      description: descriptionPanne,
      photo: photoUrl,
      latitude,
      longitude
    }]);

    alert("Panne déclarée !");
    setShowPanneModal(false);
    setTypePanne(""); setDescriptionPanne(""); setPhoto(null);
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Chargement...</div>;

  const missionsEnCours = missions.filter(m => m.statut === "en_cours");
  const missionsTerminees = missions.filter(m => m.statut === "terminee");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* HEADER */}
      <header className="bg-white shadow-md px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <div className="flex items-center space-x-3">
          <img src={logoSociete} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
          <h1 className="text-lg sm:text-xl font-bold text-green-700">BATICOM - Chauffeur</h1>
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

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
        <div className="bg-blue-50 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center">
          <ClipboardList className="text-blue-600 w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
          <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-blue-800">Missions en cours</h3>
          <p className="text-blue-700 text-lg sm:text-xl">{missionsEnCours.length}</p>
        </div>
        <div className="bg-green-50 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center">
          <ClipboardList className="text-green-600 w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
          <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-green-800">Missions terminées</h3>
          <p className="text-green-700 text-lg sm:text-xl">{missionsTerminees.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center">
          <AlertCircle className="text-yellow-600 w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-4" />
          <h3 className="font-bold text-md sm:text-lg mb-1 sm:mb-2 text-yellow-800">Pannes déclarées</h3>
          <p className="text-yellow-700 text-lg sm:text-xl">0</p>
        </div>
      </div>

      {/* TABLEAU MISSIONS */}
      <div className="p-2 sm:p-6 overflow-x-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Mes missions assignées</h2>
        <table className="min-w-full bg-white rounded-2xl shadow overflow-hidden table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Titre</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Description</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Départ</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Destination</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Statut</th>
              <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(m => (
              <tr key={m.id} className={m.statut === "terminee" ? "bg-gray-100" : ""}>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">{m.titre}</td>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">{m.description}</td>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">{m.depart}</td>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base">{m.destination}</td>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-semibold">{m.statut}</td>
                <td className="px-2 sm:px-4 py-1 sm:py-2 text-sm sm:text-base space-x-1 sm:space-x-2">
                  {m.statut === "a_venir" && (
                    <button
                      onClick={() => startMission(m)}
                      className="px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs sm:text-sm"
                    >
                      Démarrer
                    </button>
                  )}
                  {m.statut === "en_cours" && (
                    <button
                      onClick={() => { setSelectedMission(m); setShowPanneModal(true); }}
                      className="px-2 sm:px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-xs sm:text-sm"
                    >
                      Déclarer panne
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PANNE */}
      {showPanneModal && selectedMission && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-2">
          <div className="bg-white p-4 sm:p-6 rounded w-full max-w-sm sm:max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Déclarer une panne</h2>
              <X className="cursor-pointer" onClick={() => setShowPanneModal(false)} />
            </div>
            <select
              value={typePanne}
              onChange={(e) => setTypePanne(e.target.value)}
              className="w-full mb-2 p-2 border rounded text-sm"
            >
              <option value="">Type de panne</option>
              <option value="Mécanique">Mécanique</option>
              <option value="Électrique">Électrique</option>
              <option value="Crevaison">Crevaison</option>
            </select>
            <textarea
              value={descriptionPanne}
              onChange={(e) => setDescriptionPanne(e.target.value)}
              placeholder="Description"
              className="w-full mb-2 p-2 border rounded text-sm"
            />
            <input
              type="file"
              onChange={(e) => setPhoto(e.target.files[0])}
              className="mb-2 text-sm"
            />
            <button
              onClick={declarePanne}
              className="bg-red-600 text-white w-full py-2 rounded text-sm sm:text-base"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
