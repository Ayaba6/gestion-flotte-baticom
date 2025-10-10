// src/components/PannesDeclarees.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Card, CardHeader } from "../components/ui/card.js";
import { useToast } from "../components/ui/use-toast.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Search, Bell, X, MapPin, Truck, Calendar, Activity, FileText, File } from "lucide-react";

export default function PannesDeclarees() {
  const { toast } = useToast();

  const [pannes, setPannes] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [selectedPanne, setSelectedPanne] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showModalConfirm, setShowModalConfirm] = useState(false);
  const [panneToDelete, setPanneToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // 🔄 Charger les pannes et chauffeurs
  useEffect(() => {
    const fetchData = async () => {
      const { data: chauffeursData } = await supabase.from("users").select("*").eq("role", "chauffeur");
      const { data: pannesData } = await supabase
        .from("alertespannes")
        .select("*")
        .order("created_at", { ascending: false });

      setChauffeurs(chauffeursData || []);
      setPannes(pannesData || []);
    };
    fetchData();

    // Realtime notifications
    const pannesChannel = supabase
      .channel("pannes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertespannes" },
        (payload) => {
          setPannes(prev => [payload.new, ...prev]);
          setNewCount(prev => prev + 1);
          toast(`Nouvelle panne : ${payload.new.typepanne}`, { duration: 5000 });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(pannesChannel);
  }, [toast]);

  // 🔄 Utils
  const getChauffeurName = (id) => chauffeurs.find(c => c.id === id)?.name || "Inconnu";

  const getPhotoUrl = (panne) => {
    if (!panne.photo) return null;
    const { data } = supabase.storage.from("pannes").getPublicUrl(panne.photo);
    return data.publicUrl;
  };

  const updateStatut = async (id, newStatut) => {
    const { error } = await supabase.from("alertespannes").update({ statut: newStatut }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else {
      setPannes(prev => prev.map(p => (p.id === id ? { ...p, statut: newStatut } : p)));
      toast({ title: "Statut mis à jour", description: `"${newStatut}"` });
    }
  };

  const openPhotoModal = (panne) => {
    setSelectedPanne(panne);
    setShowPhotoModal(true);
  };

  const confirmDelete = async () => {
    try {
      await supabase.from("alertespannes").delete().eq("id", panneToDelete.id);
      toast({ title: "Panne supprimée", description: `"${panneToDelete.typepanne}" a été supprimée.` });
      setShowModalConfirm(false);
      setPanneToDelete(null);
      setPannes(prev => prev.filter(p => p.id !== panneToDelete.id));
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // 🔍 Filtrage et recherche
  const filteredPannes = pannes.filter(p => {
    const matchFilter = filter === "toutes" ? true : p.statut === filter;
    const matchSearch =
      (p.mission_id?.toString() || "").includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.typepanne || "").toLowerCase().includes(search.toLowerCase()) ||
      getChauffeurName(p.chauffeur_id).toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filteredPannes.length / ITEMS_PER_PAGE);
  const paginatedPannes = filteredPannes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // 📊 Export Excel
  const exportExcel = () => {
    const wsData = filteredPannes.map(p => ({
      Mission: p.mission_id || "N/A",
      Chauffeur: getChauffeurName(p.chauffeur_id),
      Type: p.typepanne || "N/A",
      Description: p.description || "",
      Statut: p.statut,
      Date: p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : "",
      Latitude: p.latitude || "",
      Longitude: p.longitude || "",
      Photo: p.photo ? "Oui" : "Non"
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pannes");
    XLSX.writeFile(wb, "pannes.xlsx");
    toast({ title: "Export Excel", description: "Liste des pannes exportée." });
  };

  // 📄 Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste des Pannes Déclarées", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Mission", "Chauffeur", "Type", "Description", "Statut", "Date", "Latitude", "Longitude", "Photo"]],
      body: filteredPannes.map(p => [
        p.mission_id || "N/A",
        getChauffeurName(p.chauffeur_id),
        p.typepanne || "N/A",
        p.description || "",
        p.statut,
        p.created_at ? new Date(p.created_at).toLocaleString("fr-FR") : "",
        p.latitude || "",
        p.longitude || "",
        p.photo ? "Oui" : "Non"
      ]),
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] }
    });
    doc.save("pannes.pdf");
    toast({ title: "Export PDF", description: "Document généré." });
  };

  // 🔹 Badge statut
  const getStatusBadge = (statut) => {
    const colors = { en_cours: "bg-yellow-100 text-yellow-800", resolu: "bg-green-100 text-green-800", signale: "bg-blue-100 text-blue-800" };
    const labels = { en_cours: "En cours", resolu: "Résolu", signale: "Signalé" };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[statut] || "bg-gray-100 text-gray-800"}`}>{labels[statut] || statut}</span>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <Card className="shadow-xl bg-white/90 border border-gray-200">
        <CardHeader className="flex justify-between items-center p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bell size={24} className="text-red-600" /> Gestion des Pannes
          </h2>
          <div className="flex gap-2">
            <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50">
              <File size={16} /> Excel
            </Button>
            <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50">
              <FileText size={16} /> PDF
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filtre + recherche */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 border-gray-300 rounded px-2 py-1"
          />
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-36 border rounded px-2 py-1"
          >
            <option value="toutes">Toutes les pannes</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
            <option value="signale">Signalé</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mission</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Chauffeur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedPannes.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucune panne trouvée</td></tr>
            ) : paginatedPannes.map(p => (
              <tr key={p.id} className="hover:bg-blue-50/50 transition">
                <td className="px-4 py-2">{p.mission_id || "N/A"}</td>
                <td className="px-4 py-2">{getChauffeurName(p.chauffeur_id)}</td>
                <td className="px-4 py-2 font-semibold">{p.typepanne || "N/A"}</td>
                <td className="px-4 py-2 truncate max-w-xs">{p.description || ""}</td>
                <td className="px-4 py-2">{getStatusBadge(p.statut)}</td>
                <td className="px-4 py-2 flex flex-col gap-1 justify-center items-center">
                  {p.statut !== "resolu" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatut(p.id, "resolu")}>Résolu</Button>}
                  {p.statut !== "en_cours" && <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white" onClick={() => updateStatut(p.id, "en_cours")}>En cours</Button>}
                  {p.latitude && p.longitude && <a href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><MapPin size={14}/> Position</a>}
                  {p.photo && <Button size="sm" variant="outline" onClick={() => openPhotoModal(p)}>Voir photo</Button>}
                  <Button size="sm" variant="destructive" onClick={() => { setPanneToDelete(p); setShowModalConfirm(true); }}>Supprimer</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 p-2 bg-white rounded-lg shadow border border-gray-100">
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              size="sm"
              variant={i + 1 === currentPage ? "default" : "outline"}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Modal photo */}
      {showPhotoModal && selectedPanne && getPhotoUrl(selectedPanne) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative shadow-2xl">
            <button onClick={() => setShowPhotoModal(false)} className="absolute -top-3 -right-3 bg-white p-1 rounded-full text-gray-700 hover:bg-gray-100 transition shadow-lg">
              <X size={28}/>
            </button>
            <h3 className="text-xl font-bold mb-3">Photo de la panne ({selectedPanne.typepanne})</h3>
            <img src={getPhotoUrl(selectedPanne)} alt="Panne" className="w-full h-auto object-contain rounded-lg max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={showModalConfirm}
        onClose={setShowModalConfirm}
        title="Supprimer cette panne ?"
        description={`Êtes-vous sûr de vouloir supprimer "${panneToDelete?.typepanne}" ?`}
        confirmLabel="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
