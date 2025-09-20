// src/pages/ChauffeurDashboard.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Play, Check, AlertCircle, X } from "lucide-react";

export default function ChauffeurDashboard() {
  const [user, setUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPanneModal, setShowPanneModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);

  const [panneType, setPanneType] = useState("");
  const [panneDesc, setPanneDesc] = useState("");
  const [photo, setPhoto] = useState(null);
  const [position, setPosition] = useState({ lat: null, lng: null });

  useEffect(() => {
    const fetchUserAndMissions = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      const { data: profile } = await supabase.from("users").select("id, role, email").eq("id", user.id).single();
      if (!profile || profile.role !== "chauffeur") return;

      setUser(profile);

      const { data: missionsData } = await supabase
        .from("missions")
        .select("*")
        .eq("chauffeurId", profile.id)
        .order("created_at", { ascending: false });

      setMissions(missionsData || []);
      setLoading(false);
    };

    fetchUserAndMissions();
  }, []);

  const declarePanne = async () => {
    if (!panneType || !panneDesc) return alert("Veuillez remplir le type et la description");
    
    // récupération position GPS
    if (!position.lat || !position.lng) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => console.error(err)
      );
    }

    let photoUrl = null;
    if (photo) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from("pannes").upload(fileName, photo);
      if (!error) photoUrl = data.path;
    }

    await supabase.from("alertesPannes").insert([{
      missionId: selectedMission.id,
      chauffeurId: user.id,
      type: panneType,
      description: panneDesc,
      photo: photoUrl,
      latitude: position.lat,
      longitude: position.lng
    }]);

    alert("Panne déclarée !");
    setShowPanneModal(false);
    setPanneType(""); setPanneDesc(""); setPhoto(null);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1>Mes missions</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Départ</th>
            <th>Destination</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {missions.map(m => (
            <tr key={m.id}>
              <td>{m.titre}</td>
              <td>{m.depart}</td>
              <td>{m.destination}</td>
              <td>{m.statut}</td>
              <td>
                {m.statut === "a_venir" && (
                  <button onClick={async () => {
                    await supabase.from("missions").update({ statut: "en_cours" }).eq("id", m.id);
                    setMissions(prev => prev.map(mm => mm.id===m.id ? {...mm, statut:"en_cours"} : mm));
                  }}>Démarrer</button>
                )}
                {m.statut === "en_cours" && (
                  <>
                    <button onClick={async () => {
                      await supabase.from("missions").update({ statut: "terminee" }).eq("id", m.id);
                      setMissions(prev => prev.map(mm => mm.id===m.id ? {...mm, statut:"terminee"} : mm));
                    }}>Terminer</button>
                    <button onClick={() => { setSelectedMission(m); setShowPanneModal(true); }}>Déclarer panne</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal panne */}
      {showPanneModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Déclarer une panne</h2>
              <X className="cursor-pointer" onClick={() => setShowPanneModal(false)}/>
            </div>
            <select value={panneType} onChange={e => setPanneType(e.target.value)} className="w-full mb-2 p-2 border rounded">
              <option value="">Type de panne</option>
              <option value="Mécanique">Mécanique</option>
              <option value="Électrique">Électrique</option>
              <option value="Crevaison">Crevaison</option>
            </select>
            <textarea value={panneDesc} onChange={e => setPanneDesc(e.target.value)} placeholder="Description" className="w-full mb-2 p-2 border rounded"/>
            <input type="file" onChange={e => setPhoto(e.target.files[0])} className="mb-2"/>
            <button onClick={declarePanne} className="bg-red-600 text-white w-full py-2 rounded">Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}
