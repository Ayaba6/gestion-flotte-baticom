// MissionForm.jsx
import React from 'react';
import { Button } from "../components/ui/button.js";

export default function MissionForm({
  titre, setTitre, description, setDescription,
  depart, setDepart, destination, setDestination,
  chauffeurId, setChauffeurId, camionId, setCamionId,
  remorqueId, setRemorqueId,
  chauffeurs, camions, remorques,
  saveMission, editingMission,
  // La prop 'selectedCamionType' n'est plus nécessaire ici
}) {

  // 💡 NOUVEAU : Calculer le type de camion en cours DANS ce composant
  const currentCamion = camions.find((c) => c.id === camionId);
  const currentCamionType = currentCamion?.type;
  
  // Condition d'affichage : uniquement si le camion sélectionné est un 'tracteur'
  const needsRemorque = currentCamionType === "tracteur";


  // Logique pour gérer le changement de camion et réinitialiser la remorque
  const handleCamionChange = (e) => {
    const newCamionId = e.target.value;
    setCamionId(newCamionId); // Met à jour l'état dans le parent

    // Trouver immédiatement le type du camion nouvellement sélectionné
    const newCamion = camions.find(c => c.id === newCamionId);

    // Si le nouveau camion n'est pas un tracteur, on vide la remorque
    if (newCamionId && newCamion?.type !== 'tracteur') {
        setRemorqueId(""); 
    } else if (!newCamionId) {
        setRemorqueId(""); // Si on désélectionne le camion
    }
  };

  return (
    <div className="mb-6 p-6 border rounded-lg bg-white shadow-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">
        {editingMission ? "Modification de mission" : "Nouvelle mission"}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        
        {/* TITRE & DÉPART */}
        <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la mission" className="p-3 border rounded w-full" />
        <input value={depart} onChange={(e) => setDepart(e.target.value)} placeholder="Départ" className="p-3 border rounded w-full" />
        
        {/* DESTINATION & CHAUFFEUR */}
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="p-3 border rounded w-full" />
        <select value={chauffeurId} onChange={(e) => setChauffeurId(e.target.value)} className="p-3 border rounded w-full">
          <option value="">Sélectionner un chauffeur</option>
          {chauffeurs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        {/* CAMION (Affiche l'immatriculation et le type) */}
        <select 
          value={camionId} 
          onChange={handleCamionChange} 
          // Prend toute la ligne si on n'a pas besoin de la remorque
          className={`p-3 border rounded w-full ${needsRemorque ? '' : 'md:col-span-2'}`} 
        >
          <option value="">Sélectionner un camion</option>
          {camions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.immatriculation} ({c.type.charAt(0).toUpperCase() + c.type.slice(1)}) 
            </option>
          ))}
        </select>

        {/* REMORQUE : AFFICHAGE CONDITIONNEL POUR LES TRACTEURS */}
        {needsRemorque && (
          <select 
            value={remorqueId} 
            onChange={(e) => setRemorqueId(e.target.value)} 
            className="p-3 border rounded w-full"
          >
            <option value="">Sélectionner une remorque (optionnel)</option>
            {remorques.map((r) => <option key={r.id} value={r.id}>{r.immatriculation}</option>)}
          </select>
        )}
      </div>

      {/* DESCRIPTION */}
      <textarea 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        placeholder="Description de la mission" 
        className="p-3 border rounded w-full mb-4" 
      />

      {/* BOUTON DE SAUVEGARDE */}
      <Button onClick={saveMission} className="w-full">
        {editingMission ? "Modifier la mission" : "Ajouter la mission"}
      </Button>
    </div>
  );
}