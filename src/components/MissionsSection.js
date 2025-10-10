import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Card, CardHeader } from "../components/ui/card.js";
import { useToast } from "../components/ui/use-toast.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.js";
import MissionModal from "./MissionModal.js";
import { Pencil, Trash2, Truck, Check, FileText, File } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Badge pour le statut
const getStatusBadge = (statut) => {
  const colors = {
    a_venir: "bg-yellow-100 text-yellow-800",
    en_cours: "bg-blue-100 text-blue-800",
    terminee: "bg-green-100 text-green-800"
  };
  const labels = {
    a_venir: "À venir",
    en_cours: "En cours",
    terminee: "Terminée"
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[statut] || "bg-gray-100 text-gray-800"}`}>{labels[statut] || statut}</span>;
};

export default function MissionsSection() {
  const { toast } = useToast();

  const [missions, setMissions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [camions, setCamions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMission, setEditingMission] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [missionToDelete, setMissionToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Champs pour le modal
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [depart, setDepart] = useState("");
  const [destination, setDestination] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [camionId, setCamionId] = useState("");
  const [remorqueId, setRemorqueId] = useState("");

  // 🔄 Charger les données
  const fetchData = useCallback(async () => {
    try {
      const { data: usersData } = await supabase.from("users").select("*").eq("role", "chauffeur");
      const { data: camionsData } = await supabase.from("camions").select("*");
      const { data: missionsData } = await supabase.from("missions").select("*").order("created_at", { ascending: false });

      setChauffeurs(usersData || []);
      setCamions(camionsData || []);
      setMissions(missionsData || []);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditingMission(null);
    setShowModal(true);
  };

  const handleEdit = (mission) => {
    setEditingMission(mission);
    setTitre(mission.titre);
    setDescription(mission.description);
    setDepart(mission.depart);
    setDestination(mission.destination);
    setChauffeurId(mission.chauffeur_id);
    setCamionId(mission.camion_id);
    setRemorqueId(mission.remorque_id || "");
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await supabase.from("missions").delete().eq("id", missionToDelete.id);
      toast({ title: "Mission supprimée", description: `"${missionToDelete.titre}" a été supprimée.` });
      setMissionToDelete(null);
      setConfirmOpen(false);
      fetchData();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // Filtrage
  const filteredMissions = missions.filter(m => {
    const chauffeur = chauffeurs.find(c => c.id === m.chauffeur_id);
    const camion = camions.find(c => c.id === m.camion_id);
    return (m.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            chauffeur?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            camion?.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterStatut === "" || m.statut === filterStatut);
  });

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Export Excel
  const exportExcel = () => {
    const wsData = filteredMissions.map(m => {
      const camion = camions.find(c => c.id === m.camion_id);
      const remorque = m.remorque_id ? camions.find(c => c.id === m.remorque_id) : null;
      return {
        Titre: m.titre,
        Chauffeur: chauffeurs.find(c => c.id === m.chauffeur_id)?.name || "",
        Camion: camion?.immatriculation || "",
        Remorque: remorque?.immatriculation || "",
        Départ: m.depart,
        Destination: m.destination,
        Statut: m.statut
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Missions");
    XLSX.writeFile(wb, "missions.xlsx");
    toast({ title: "Export Excel", description: "Fichier généré" });
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Liste des Missions", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Titre", "Chauffeur", "Camion", "Remorque", "Départ", "Destination", "Statut"]],
      body: filteredMissions.map(m => {
        const camion = camions.find(c => c.id === m.camion_id);
        const remorque = m.remorque_id ? camions.find(c => c.id === m.remorque_id) : null;
        return [
          m.titre,
          chauffeurs.find(c => c.id === m.chauffeur_id)?.name || "",
          camion?.immatriculation || "",
          remorque?.immatriculation || "",
          m.depart, m.destination, m.statut
        ];
      }),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240,240,240] }
    });
    doc.save("missions.pdf");
    toast({ title: "Export PDF", description: "Fichier généré" });
  };

  const terminerMission = async (m) => {
    try {
      await supabase.from("missions").update({ statut: "terminee" }).eq("id", m.id);
      fetchData();
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-xl bg-white/90 border border-gray-200">
        <CardHeader className="flex justify-between items-center p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Truck size={24} className="text-blue-600"/> Missions
          </h2>
          <Button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            + Nouvelle mission
          </Button>
        </CardHeader>
      </Card>

      {/* Recherche + filtres + exports */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 border-gray-300 rounded px-2 py-1"
          />
          <select
            value={filterStatut}
            onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-36 border rounded px-2 py-1"
          >
            <option value="">Tous statuts</option>
            <option value="a_venir">À venir</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end w-full md:w-auto mt-2 md:mt-0">
          <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50"><File size={16}/> Excel</Button>
          <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50"><FileText size={16}/> PDF</Button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-32">Titre</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-32">Chauffeur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-28">Camion</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-28">Remorque</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-48">Itinéraire</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedMissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">Aucune mission trouvée</td>
              </tr>
            ) : paginatedMissions.map(m => {
              const chauffeur = chauffeurs.find(c => c.id === m.chauffeur_id);
              const camion = camions.find(c => c.id === m.camion_id);
              const remorque = m.remorque_id ? camions.find(c => c.id === m.remorque_id) : null;
              return (
                <tr key={m.id} className="hover:bg-blue-50/50 transition">
                  <td className="px-4 py-2 font-medium text-gray-700 truncate" title={m.titre}>{m.titre}</td>
                  <td className="px-4 py-2 text-gray-600 truncate" title={chauffeur?.name || "N/A"}>{chauffeur?.name || "N/A"}</td>
                  <td className="px-4 py-2 text-gray-600 truncate" title={camion?.immatriculation || "N/A"}>{camion?.immatriculation || "N/A"}</td>
                  <td className="px-4 py-2 text-gray-600 truncate" title={remorque?.immatriculation || "-"}>{remorque?.immatriculation || "-"}</td>
                  <td className="px-4 py-2 text-gray-600 break-words max-w-[200px]" title={`${m.depart} ➡ ${m.destination}`}>{m.depart} ➡ {m.destination}</td>
                  <td className="px-4 py-2">{getStatusBadge(m.statut)}</td>
                  <td className="px-4 py-2 flex justify-center gap-2">
                    {m.statut !== "terminee" && <Button variant="outline" size="sm" onClick={() => terminerMission(m)}><Check size={16}/></Button>}
                    <Button variant="outline" size="sm" onClick={() => handleEdit(m)}><Pencil size={16}/></Button>
                    <Button variant="destructive" size="sm" onClick={() => { setMissionToDelete(m); setConfirmOpen(true); }}><Trash2 size={16}/></Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 p-2 bg-white rounded-lg shadow border border-gray-100">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button key={i} size="sm" variant={i + 1 === currentPage ? "default" : "outline"} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && <MissionModal
        editingMission={editingMission} setShowModal={setShowModal} fetchMissions={fetchData}
        titre={titre} setTitre={setTitre} description={description} setDescription={setDescription}
        depart={depart} setDepart={setDepart} destination={destination} setDestination={setDestination}
        chauffeurId={chauffeurId} setChauffeurId={setChauffeurId}
        camionId={camionId} setCamionId={setCamionId}
        remorqueId={remorqueId} setRemorqueId={setRemorqueId}
        chauffeurs={chauffeurs} camions={camions}
      />}

      {/* ConfirmDialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={setConfirmOpen}
        title="Supprimer cette mission ?"
        description={`Êtes-vous sûr de vouloir supprimer "${missionToDelete?.titre}" ?`}
        confirmLabel="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
