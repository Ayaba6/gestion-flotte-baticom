// src/components/MissionsSection.js
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Truck, User, Plus, Check } from "lucide-react";

export default function MissionsSection() {
  const [missions, setMissions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [camions, setCamions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [camionId, setCamionId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("toutes");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔹 Charger données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase.from("users").select("*").eq("role", "chauffeur");
        const { data: camionsData } = await supabase.from("camions").select("*");
        const { data: missionsData } = await supabase.from("missions").select("*");

        setChauffeurs(usersData || []);
        setCamions(camionsData || []);
        setMissions(missionsData || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Ajouter mission
  const ajouterMission = async () => {
    if (!titre || !description || !depart || !destination || !chauffeurId || !camionId) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    try {
      const { data, error } = await supabase.from("missions").insert([{
        titre,
        description,
        depart,
        destination,
        chauffeur_id: chauffeurId,   // <== ici
        camion_id: camionId,         // <== ici
        statut: "a_venir"
      }]);
      if (error) throw error;

      setMissions(prev => [...prev, ...(data || [])]);
      setTitre(""); setDescription(""); setDepart(""); setDestination("");
      setChauffeurId(""); setCamionId(""); setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la mission. Vérifiez que chauffeur et camion sont corrects");
    }
  };

  // 🔹 Terminer mission
  const terminerMission = async (missionId) => {
    try {
      await supabase.from("missions").update({ statut: "terminee" }).eq("id", missionId);
      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, statut: "terminee" } : m));
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Filtrage et recherche
  const filteredMissions = missions.filter(m => {
    const chauffeur = chauffeurs.find(c => c.id === m.chauffeur_id); // <== ici
    const camion = camions.find(c => c.id === m.camion_id);         // <== ici
    const chauffeurName = chauffeur ? chauffeur.name : "";
    const camionImmat = camion ? camion.immatriculation : "";

    const matchesSearch =
      (m.titre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.description?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.depart?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.destination?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      chauffeurName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camionImmat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatut === "toutes" ? true : m.statut === filterStatut;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
  const paginatedMissions = filteredMissions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderStatut = (statut) => {
    switch (statut) {
      case "a_venir":
        return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">À venir</span>;
      case "terminee":
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"><Check size={14}/> Terminée</span>;
      case "en_cours":
        return <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">En cours</span>;
      default:
        return <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">{statut}</span>;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Missions</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition">
          <Plus size={18}/> Nouvelle mission
        </button>
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div className="mb-6 p-6 border rounded-lg bg-white shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de la mission" className="p-3 border rounded w-full"/>
            <input value={depart} onChange={e => setDepart(e.target.value)} placeholder="Départ" className="p-3 border rounded w-full"/>
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination" className="p-3 border rounded w-full"/>
            <select value={chauffeurId} onChange={e => setChauffeurId(e.target.value)} className="p-3 border rounded w-full">
              <option value="">Sélectionner un chauffeur</option>
              {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={camionId} onChange={e => setCamionId(e.target.value)} className="p-3 border rounded w-full">
              <option value="">Sélectionner un camion</option>
              {camions.map(c => <option key={c.id} value={c.id}>{c.immatriculation}</option>)}
            </select>
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la mission" className="p-3 border rounded w-full mb-4"/>
          <button onClick={ajouterMission} className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition w-full">Ajouter la mission</button>
        </div>
      )}

      {/* RECHERCHE ET FILTRE */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <input type="text" placeholder="Recherche..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="p-2 border rounded w-full md:w-1/3"/>
        <select value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }} className="p-2 border rounded w-full md:w-1/4">
          <option value="toutes">Toutes</option>
          <option value="a_venir">À venir</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminées</option>
        </select>
      </div>

      {/* TABLEAU MISSIONS */}
      <div className="overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-3 w-1/6 text-left">Titre</th>
              <th className="p-3 w-1/4 text-left">Description</th>
              <th className="p-3 w-1/12 text-left">Départ</th>
              <th className="p-3 w-1/12 text-left">Destination</th>
              <th className="p-3 w-1/12 text-left">Chauffeur</th>
              <th className="p-3 w-1/12 text-left">Camion</th>
              <th className="p-3 w-1/12 text-left">Statut</th>
              <th className="p-3 w-1/12 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedMissions.map(m => {
              const chauffeur = chauffeurs.find(c => c.id === m.chauffeur_id);
              const camion = camions.find(c => c.id === m.camion_id);
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium truncate">{m.titre}</td>
                  <td className="p-3 truncate">{m.description}</td>
                  <td className="p-3 truncate">{m.depart}</td>
                  <td className="p-3 truncate">{m.destination}</td>
                  <td className="p-3 flex items-center gap-2 truncate">{chauffeur ? <User size={16}/> : null}{chauffeur ? chauffeur.name : "-"}</td>
                  <td className="p-3 flex items-center gap-2 truncate">{camion ? <Truck size={16}/> : null}{camion ? camion.immatriculation : "-"}</td>
                  <td className="p-3">{renderStatut(m.statut)}</td>
                  <td className="p-3 text-right">
                    {m.statut !== "terminee" && <button onClick={() => terminerMission(m.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">Terminer</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Précédent</button>
          <span className="px-2 py-1">{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">Suivant</button>
        </div>
      )}
    </div>
  );
}
