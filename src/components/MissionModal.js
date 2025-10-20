// src/components/MissionModal.js
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";

export default function MissionModal({
  editingMission,
  setShowModal,
  fetchMissions,
  titre, setTitre,
  description, setDescription,
  depart, setDepart,
  destination, setDestination,
  chauffeurId, setChauffeurId,
  camionId, setCamionId,
  remorqueId, setRemorqueId,
  chauffeurs,
  camions
}) {
  const { toast } = useToast();
  const [remorquesDispo, setRemorquesDispo] = useState([]);

  // ✅ NOUVEAU : état local pour la date de départ
  const [dateDepart, setDateDepart] = useState(
    editingMission?.date_depart
      ? new Date(editingMission.date_depart).toISOString().slice(0, 16)
      : ""
  );

  // Mettre à jour la liste des remorques disponibles lorsque le camion change
  useEffect(() => {
    const selectedCamion = camions.find(c => c.id === camionId);
    if (selectedCamion?.type === "Tracteur") {
      const remorques = camions.filter(c => c.type === "Remorque" || c.type === "Semi-remorque");
      setRemorquesDispo(remorques);
    } else {
      setRemorquesDispo([]);
      setRemorqueId(""); // reset si ce n'est pas un tracteur
    }
  }, [camionId, camions, setRemorqueId]);

  const handleSave = async () => {
    if (!titre || !depart || !destination || !chauffeurId || !camionId) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const missionData = {
      titre,
      description,
      depart,
      destination,
      chauffeur_id: chauffeurId,
      camion_id: camionId,
      remorque_id: remorqueId || null,
      statut: editingMission?.statut || "a_venir",
      date_depart: dateDepart || null, // ✅ Ajout date/heure départ
    };

    try {
      if (editingMission) {
        const { error } = await supabase.from("missions").update(missionData).eq("id", editingMission.id);
        if (error) throw error;
        toast({ title: "Mission mise à jour", description: "La mission a été modifiée avec succès" });
      } else {
        const { error } = await supabase.from("missions").insert([missionData]);
        if (error) throw error;
        toast({ title: "Mission créée", description: "La mission a été ajoutée avec succès" });
      }
      fetchMissions();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const selectedCamion = camions.find(c => c.id === camionId);

  return (
    <Dialog open={true} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingMission ? "Modifier la mission" : "Nouvelle mission"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Titre*</label>
            <input
              type="text"
              value={titre}
              onChange={e => setTitre(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Départ*</label>
            <input
              type="text"
              value={depart}
              onChange={e => setDepart(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Date et heure de départ*</label>
            <input
              type="datetime-local"
              value={dateDepart}
              onChange={e => setDateDepart(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Destination*</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Chauffeur*</label>
            <select
              value={chauffeurId}
              onChange={e => setChauffeurId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Sélectionner un chauffeur</option>
              {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Camion*</label>
            <select
              value={camionId}
              onChange={e => setCamionId(e.target.value)}
              className="w-full border rounded px-2 py-1"
            >
              <option value="">Sélectionner un camion</option>
              {camions.map(c => <option key={c.id} value={c.id}>{c.immatriculation} - {c.type}</option>)}
            </select>
          </div>

          {/* Champ Remorque uniquement si Tracteur */}
          {selectedCamion?.type === "Tracteur" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Remorque (optionnelle)</label>
              <select
                value={remorqueId}
                onChange={e => setRemorqueId(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Aucune</option>
                {remorquesDispo.map(r => <option key={r.id} value={r.id}>{r.immatriculation} - {r.type}</option>)}
              </select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          <Button onClick={handleSave}>{editingMission ? "Modifier" : "Créer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
