import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Truck, User, Plus, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button.js";
import MissionForm from './MissionForm.js'; // <-- IMPORT DU FORMULAIRE SÉPARÉ

export default function MissionsSection() {
  const [missions, setMissions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [camions, setCamions] = useState([]);
  const [remorques, setRemorques] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  // Champs formulaire (maintenus ici pour la logique de sauvegarde)
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [camionId, setCamionId] = useState("");
  const [remorqueId, setRemorqueId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("toutes");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 🔹 Charger données (unchanged)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase
          .from("users")
          .select("*")
          .eq("role", "chauffeur");
        const { data: camionsData } = await supabase.from("camions").select("*");
        const { data: remorquesData } = await supabase.from("remorques").select("*");
        const { data: missionsData } = await supabase.from("missions").select("*");

        setChauffeurs(usersData || []);
        setCamions(camionsData || []);
        setRemorques(remorquesData || []);
        setMissions(missionsData || []);
      } catch (err) {
        console.error("Erreur chargement missions:", err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Fonction de réinitialisation des champs du formulaire
  const resetForm = () => {
    setTitre(""); 
    setDescription(""); 
    setDepart(""); 
    setDestination("");
    setChauffeurId(""); 
    setCamionId(""); 
    setRemorqueId("");
    setEditingMission(null); 
    setShowForm(false);
  }

  // 🔹 Ajouter ou modifier une mission (unchanged)
  const saveMission = async () => {
    if (!titre || !description || !depart || !destination || !chauffeurId || !camionId) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const enCours = missions.find(
      (m) =>
        (m.chauffeur_id === chauffeurId || m.camion_id === camionId) &&
        m.statut !== "terminee" &&
        (!editingMission || m.id !== editingMission.id)
    );
    if (enCours) {
      alert("Le chauffeur ou le camion est déjà assigné à une mission active !");
      return;
    }

    try {
      const missionData = {
        titre,
        description,
        depart,
        destination,
        chauffeur_id: chauffeurId,
        camion_id: camionId,
        remorque_id: remorqueId || null,
        statut: editingMission ? editingMission.statut : "a_venir", // Conserver le statut existant ou mettre "a_venir"
      };

      if (editingMission) {
        const { error } = await supabase
          .from("missions")
          .update(missionData)
          .eq("id", editingMission.id);
        if (error) throw error;

        setMissions((prev) =>
          prev.map((m) =>
            m.id === editingMission.id ? { ...m, ...missionData } : m
          )
        );
      } else {
        const { data, error } = await supabase.from("missions").insert([missionData]).select();
        if (error) throw error;
        setMissions((prev) => [...prev, ...(data || [])]);
      }

      resetForm(); // Appel de la fonction de réinitialisation
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde de la mission.");
    }
  };

  // 🔹 Préparer l'édition d'une mission
  const prepareEdit = (mission) => {
    setEditingMission(mission);
    setTitre(mission.titre);
    setDescription(mission.description);
    setDepart(mission.depart);
    setDestination(mission.destination);
    setChauffeurId(mission.chauffeur_id);
    setCamionId(mission.camion_id);
    setRemorqueId(mission.remorque_id || "");
    setShowForm(true);
  };


  // 🔹 Terminer mission (unchanged)
  const terminerMission = async (missionId) => {
    try {
      await supabase.from("missions").update({ statut: "terminee" }).eq("id", missionId);
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? { ...m, statut: "terminee" } : m))
      );
    } catch (err) { console.error(err); }
  };

  // 🔹 Supprimer mission (unchanged)
  const supprimerMission = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette mission ?")) return;
    try {
      await supabase.from("missions").delete().eq("id", id);
      setMissions((prev) => prev.filter((m) => m.id !== id));
    } catch (err) { console.error(err); }
  };

  // 🔹 Filtrage et recherche (unchanged)
  const filteredMissions = missions.filter((m) => {
    const chauffeur = chauffeurs.find((c) => c.id === m.chauffeur_id);
    const camion = camions.find((c) => c.id === m.camion_id);
    const remorque = remorques.find((r) => r.id === m.remorque_id);

    const matchesSearch =
      (m.titre?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.description?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.depart?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (m.destination?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (chauffeur?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (camion?.immatriculation ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (remorque?.immatriculation ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatut === "toutes" ? true : m.statut === filterStatut;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderStatut = (statut) => {
    switch (statut) {
      case "a_venir": return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">À venir</span>;
      case "en_cours": return <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">En cours</span>;
      case "terminee": return <span className="flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"><Check size={14} /> Terminée</span>;
      default: return statut;
    }
  };

  // Détermine le type de camion sélectionné pour le passer au formulaire
  const selectedCamionType = camions.find((c) => c.id === camionId)?.type;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Missions</h2>
        <Button 
          onClick={() => { 
            if (showForm && !editingMission) {
                setShowForm(false); // Masquer si déjà ouvert et mode ajout
            } else {
                setShowForm(true); 
                setEditingMission(null); // S'assurer que le mode est "ajout"
                // On pourrait aussi réinitialiser les champs ici si on le souhaite
            }
          }}
        >
          <Plus size={18} className="mr-2" /> Nouvelle mission
        </Button>
      </div>

      {/* APPEL DU FORMULAIRE SÉPARÉ */}
      {showForm && (
        <MissionForm
          // Les états et leurs setters
          titre={titre} setTitre={setTitre}
          description={description} setDescription={setDescription}
          depart={depart} setDepart={setDepart}
          destination={destination} setDestination={setDestination}
          chauffeurId={chauffeurId} setChauffeurId={setChauffeurId}
          camionId={camionId} setCamionId={setCamionId}
          remorqueId={remorqueId} setRemorqueId={setRemorqueId}
          
          // Les données pour les listes déroulantes
          chauffeurs={chauffeurs}
          camions={camions}
          remorques={remorques}
          
          // La fonction de sauvegarde et l'état d'édition
          saveMission={saveMission}
          editingMission={editingMission}
          
          // Le type de camion sélectionné pour la logique de remorque
          selectedCamionType={selectedCamionType}
        />
      )}
      
      {/* CONTRÔLES DE RECHERCHE ET FILTRE */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex space-x-4 items-center">
        <input
          type="text"
          placeholder="Rechercher (titre, chauffeur, immat...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-1/3"
        />
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
          className="p-2 border rounded"
        >
          <option value="toutes">Tous les statuts</option>
          <option value="a_venir">À venir</option>
          <option value="en_cours">En cours</option>
          <option value="terminee">Terminée</option>
        </select>
      </div>

      {/* TABLEAU DES MISSIONS */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chauffeur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Véhicule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itinéraire</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMissions.map((mission) => {
              const chauffeur = chauffeurs.find((c) => c.id === mission.chauffeur_id);
              const camion = camions.find((c) => c.id === mission.camion_id);
              const remorque = remorques.find((r) => r.id === mission.remorque_id);

              return (
                <tr key={mission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mission.titre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                    <User size={16} /> {chauffeur?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Truck size={16} className="inline mr-2" />{camion?.immatriculation || "N/A"}
                    {remorque && (<span> + Rem. {remorque.immatriculation}</span>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mission.depart} ➡️ {mission.destination}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderStatut(mission.statut)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {mission.statut !== "terminee" && (
                        <Button variant="ghost" size="sm" onClick={() => terminerMission(mission.id)} title="Terminer la mission">
                          <Check size={18} className="text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => prepareEdit(mission)} title="Modifier la mission">
                        <Pencil size={18} className="text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => supprimerMission(mission.id)} title="Supprimer la mission">
                        <Trash2 size={18} className="text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-700">Page {currentPage} de {totalPages}</span>
          <Button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}