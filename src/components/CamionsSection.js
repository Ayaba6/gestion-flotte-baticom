// src/components/CamionsSection.js
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Card, CardHeader, CardContent } from "../components/ui/card.js";
import { useToast } from "../components/ui/use-toast.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.js";
import CamionModal from "./CamionModal.js";
import { Pencil, Trash2, Truck, FileText, File } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Badge statut
const getStatusBadge = (statut) => {
  const colors = {
    Disponible: "bg-green-100 text-green-800",
    "En maintenance": "bg-yellow-100 text-yellow-800",
    Indisponible: "bg-red-100 text-red-800",
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[statut] || "bg-gray-100 text-gray-800"}`}>{statut}</span>;
};

// Documents
const renderDocuments = (c) => {
  const docs = [];
  if (c.cartegriseUrl) docs.push(<a key="cg" href={c.cartegriseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Carte Grise</a>);
  if (c.assuranceUrl) docs.push(<a key="assur" href={c.assuranceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Assurance</a>);
  if (c.visitetechniqueUrl) docs.push(<a key="vt" href={c.visitetechniqueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Visite Tech.</a>);
  return docs.length ? <div className="flex flex-col gap-1">{docs}</div> : <span className="text-gray-400 italic">Aucun</span>;
};

export default function CamionsSection() {
  const { toast } = useToast();
  const [camions, setCamions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCamion, setEditingCamion] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [camionToDelete, setCamionToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchCamions = useCallback(async () => {
    const { data, error } = await supabase.from("camions").select("*").order("inserted_at", { ascending: false });
    if (error) toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
    else setCamions(data || []);
  }, [toast]);

  useEffect(() => { fetchCamions(); }, [fetchCamions]);

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from("camions").delete().eq("id", camionToDelete.id);
      if (error) throw error;
      toast({ title: "Camion supprimé", description: `Le camion "${camionToDelete.immatriculation}" a été supprimé.` });
      fetchCamions();
      setCamionToDelete(null);
      setConfirmOpen(false);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (c) => { setEditingCamion(c); setShowModal(true); };
  const handleAdd = () => { setEditingCamion(null); setShowModal(true); };

  const filteredCamions = camions.filter(c =>
    c.immatriculation?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (typeFilter === "" || c.type === typeFilter) &&
    (statutFilter === "" || c.statut === statutFilter)
  );

  const totalPages = Math.ceil(filteredCamions.length / ITEMS_PER_PAGE);
  const paginatedCamions = filteredCamions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const exportExcel = () => {
    const wsData = filteredCamions.map(c => ({
      Photo: c.photoUrl ? "Oui" : "Non",
      Immatriculation: c.immatriculation,
      Type: c.type,
      "Marque/Modèle": c.marquemodele,
      Statut: c.statut,
      Documents: [
        c.cartegriseUrl ? "CG" : "",
        c.assuranceUrl ? "Assur." : "",
        c.visitetechniqueUrl ? "VT" : ""
      ].filter(Boolean).join(", ")
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Camions");
    XLSX.writeFile(wb, "liste_camions.xlsx");
    toast({ title: "Export Excel", description: "Liste des camions exportée." });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste des Camions", 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Photo", "Immat.", "Type", "Modèle", "Statut", "Documents"]],
      body: filteredCamions.map(c => [
        c.photoUrl ? "Oui" : "Non",
        c.immatriculation,
        c.type,
        c.marquemodele,
        c.statut,
        [
          c.cartegriseUrl ? "CG" : "",
          c.assuranceUrl ? "Assur." : "",
          c.visitetechniqueUrl ? "VT" : ""
        ].filter(Boolean).join(", ")
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0,0,0] },
    });

    doc.save("liste_camions.pdf");
    toast({ title: "Export PDF", description: "Le document a été généré." });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <Card className="shadow-xl bg-white/90 border border-gray-200">
        <CardHeader className="flex justify-between items-center p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Truck size={24} className="text-blue-600"/> Gestion de la Flotte
          </h2>
          <Button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            + Créer Camion
          </Button>
        </CardHeader>
      </Card>

      {/* Recherche + filtres + exports */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher par immatriculation..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 border-gray-300 rounded px-2 py-1"
          />
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-36 border rounded px-2 py-1"
          >
            <option value="">Tous types</option>
            <option value="Benne">Benne</option>
            <option value="Tracteur">Tracteur</option>
            <option value="Remorque">Remorque</option>
            <option value="Semi remorque">Semi remorque</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-36 border rounded px-2 py-1"
          >
            <option value="">Tous statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="En maintenance">En maintenance</option>
            <option value="Indisponible">Indisponible</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end w-full md:w-auto mt-2 md:mt-0">
          <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50">
            <File size={16}/> Excel
          </Button>
          <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50">
            <FileText size={16}/> PDF
          </Button>
        </div>
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Photo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Immatriculation</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Marque/Modèle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">Documents</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedCamions.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Aucun camion trouvé</td></tr>
            ) : paginatedCamions.map(c => (
              <tr key={c.id} className="hover:bg-blue-50/50 transition">
                <td className="px-4 py-2 text-center">
                  {c.photoUrl ? <img src={c.photoUrl} alt="camion" className="h-10 w-10 object-cover rounded-full shadow-md mx-auto"/> : <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-[10px] mx-auto border">No Photo</div>}
                </td>
                <td className="px-4 py-2 font-medium text-gray-700">{c.immatriculation}</td>
                <td className="px-4 py-2 text-gray-600">{c.type}</td>
                <td className="px-4 py-2 text-gray-600">{c.marquemodele}</td>
                <td className="px-4 py-2">{getStatusBadge(c.statut)}</td>
                <td className="px-4 py-2 hidden lg:table-cell">{renderDocuments(c)}</td>
                <td className="px-4 py-2 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(c)}><Pencil size={16}/></Button>
                  <Button variant="destructive" size="sm" onClick={() => { setCamionToDelete(c); setConfirmOpen(true); }}><Trash2 size={16}/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes mobile */}
      <div className="md:hidden space-y-4">
        {paginatedCamions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-white rounded-xl shadow border border-gray-100">Aucun camion trouvé</div>
        ) : paginatedCamions.map(c => (
          <Card key={c.id} className="bg-white shadow-xl border border-gray-100">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{c.immatriculation}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(c)}><Pencil size={16}/></Button>
                  <Button variant="destructive" size="sm" onClick={() => { setCamionToDelete(c); setConfirmOpen(true); }}><Trash2 size={16}/></Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.photoUrl ? <img src={c.photoUrl} alt="camion" className="h-12 w-12 object-cover rounded-full shadow-md"/> : <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-[10px] border">No Photo</div>}
                <div className="flex flex-col text-gray-600 text-sm">
                  <span><strong>Type:</strong> {c.type}</span>
                  <span><strong>Modèle:</strong> {c.marquemodele}</span>
                  <span><strong>Statut:</strong> {getStatusBadge(c.statut)}</span>
                </div>
              </div>
              <div className="pt-2">{renderDocuments(c)}</div>
            </CardContent>
          </Card>
        ))}
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
              className={i + 1 === currentPage ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 hover:bg-gray-100"}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {showModal && <CamionModal editingCamion={editingCamion} setShowModal={setShowModal} fetchCamions={fetchCamions} />}

      <ConfirmDialog
        open={confirmOpen}
        onClose={setConfirmOpen}
        title="Supprimer ce camion ?"
        description={`Êtes-vous sûr de vouloir supprimer "${camionToDelete?.immatriculation}" ?`}
        confirmLabel="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
