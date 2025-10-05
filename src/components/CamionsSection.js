import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Card, CardContent, CardHeader } from "../components/ui/card.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";
import { Pencil, Trash2, PlusCircle, FileText, File } from "lucide-react";
import ResponsiveWrapper from "../components/ResponsiveWrapper.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function CamionsSection() {
  const { toast } = useToast();
  const [camions, setCamions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCamion, setEditingCamion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const initialForm = {
    immatriculation: "",
    type: "",
    marquemodele: "",
    statut: "Disponible",
    cartegriseexpiry: "",
    assuranceexpiry: "",
    visitetechniqueexpiry: "",
    cartegrise: null,
    assurance: null,
    visitetechnique: null,
    photo: null,
  };
  const [formData, setFormData] = useState(initialForm);

  // --- Fetch camions ---
  const fetchCamions = async () => {
    try {
      const { data, error } = await supabase.from("camions").select("*");
      if (error) throw error;
      setCamions(data || []);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les camions", variant: "destructive" });
    }
  };
  useEffect(() => { fetchCamions(); }, []);

  const sanitizeFileName = (name) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Fichier trop volumineux", variant: "destructive" });
      return null;
    }
    const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const filePath = `${folder}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      toast({ title: "Erreur upload", description: uploadError.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- Submit form ---
  const handleSubmit = async () => {
    if (!formData.immatriculation || !formData.type || !formData.marquemodele) {
      toast({ title: "Champs manquants", description: "Remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    try {
      const cartegriseUrl = formData.cartegrise ? await uploadFile(formData.cartegrise, "cartegrise") : null;
      const assuranceUrl = formData.assurance ? await uploadFile(formData.assurance, "assurance") : null;
      const visitetechniqueUrl = formData.visitetechnique ? await uploadFile(formData.visitetechnique, "visitetechnique") : null;
      const photoUrl = formData.photo ? await uploadFile(formData.photo, "photos") : null;

      const insertData = {
        immatriculation: formData.immatriculation,
        type: formData.type,
        marquemodele: formData.marquemodele,
        statut: formData.statut,
        cartegriseUrl,
        cartegriseexpiry: formData.cartegriseexpiry || null,
        assuranceUrl,
        assuranceexpiry: formData.assuranceexpiry || null,
        visitetechniqueUrl,
        visitetechniqueexpiry: formData.visitetechniqueexpiry || null,
        photoUrl,
      };

      if (editingCamion) {
        const { error } = await supabase.from("camions").update(insertData).eq("id", editingCamion.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Camion modifié ✅" });
      } else {
        const { error } = await supabase.from("camions").insert([insertData]);
        if (error) throw error;
        toast({ title: "Succès", description: "Camion créé ✅" });
      }

      setFormData(initialForm);
      setEditingCamion(null);
      setShowModal(false);
      fetchCamions();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Edit ---
  const handleEdit = (c) => {
    setEditingCamion(c);
    setFormData({
      immatriculation: c.immatriculation,
      type: c.type,
      marquemodele: c.marquemodele,
      statut: c.statut,
      cartegriseexpiry: c.cartegriseexpiry || "",
      assuranceexpiry: c.assuranceexpiry || "",
      visitetechniqueexpiry: c.visitetechniqueexpiry || "",
      cartegrise: null,
      assurance: null,
      visitetechnique: null,
      photo: null,
    });
    setShowModal(true);
  };

  // --- Delete ---
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce camion ?")) return;
    try {
      const { error } = await supabase.from("camions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Supprimé", description: "Camion supprimé ✅" });
      fetchCamions();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Filtrage + pagination ---
  const filteredCamions = (camions || []).filter(
    c =>
      (c.immatriculation?.toLowerCase() || "").includes(searchTerm.toLowerCase()) &&
      (filterType === "" || c.type === filterType) &&
      (filterStatut === "" || c.statut === filterStatut)
  );
  const totalPages = Math.ceil(filteredCamions.length / itemsPerPage);
  const paginatedCamions = filteredCamions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Export ---
  const exportExcel = () => {
    const data = filteredCamions.map(c => ({
      Immatriculation: c.immatriculation,
      Type: c.type,
      "Marque/Modèle": c.marquemodele,
      Statut: c.statut,
      "Carte Grise": c.cartegriseUrl || "",
      Assurance: c.assuranceUrl || "",
      "Visite Technique": c.visitetechniqueUrl || "",
      Photo: c.photoUrl || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Camions");
    XLSX.writeFile(wb, "camions.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Camions", 14, 20);
    doc.autoTable({
      startY: 30,
      head: [["Immatriculation", "Type", "Marque/Modèle", "Statut"]],
      body: filteredCamions.map(c => [c.immatriculation, c.type, c.marquemodele, c.statut])
    });
    doc.save("camions.pdf");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-xl bg-white/70 border border-gray-200">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Gestion des Camions</h2>
          <Button onClick={() => { setShowModal(true); setEditingCamion(null); }} className="flex items-center gap-2">
            <PlusCircle size={18} /> Ajouter camion
          </Button>
        </CardHeader>
      </Card>

      {/* Recherche + filtres + exports */}
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <Input
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="w-full md:w-64"
        />
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
          className="border rounded px-3 py-2 w-full md:w-40"
        >
          <option value="">Tous types</option>
          <option value="Benne">Benne</option>
          <option value="Tracteur">Tracteur</option>
          <option value="Remorque">Remorque</option>
          <option value="Semi remorque">Semi remorque</option>
        </select>
        <select
          value={filterStatut}
          onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
          className="border rounded px-3 py-2 w-full md:w-40"
        >
          <option value="">Tous statuts</option>
          <option value="Disponible">Disponible</option>
          <option value="En maintenance">Maintenance</option>
          <option value="Indisponible">Indisponible</option>
        </select>
        <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1">
          <File size={16} /> Excel
        </Button>
        <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1">
          <FileText size={16} /> PDF
        </Button>
      </div>

      {/* Tableau camions */}
<div className="overflow-x-auto bg-white shadow rounded">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Photo</th>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Immatriculation</th>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Type</th>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Marque/Modèle</th>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Statut</th>
        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Documents</th>
        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {paginatedCamions.length === 0 ? (
        <tr>
          <td colSpan={7} className="px-4 py-4 text-center text-gray-500">Aucun camion trouvé.</td>
        </tr>
      ) : (
        paginatedCamions.map(c => (
          <tr key={c.id} className="hover:bg-gray-50">
            {/* Photo */}
            <td className="px-4 py-2 border-r border-gray-200 text-center">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt="camion" className="h-12 w-12 object-cover rounded" />
              ) : (
                <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                  Pas de photo
                </div>
              )}
            </td>

            {/* Infos camion */}
            <td className="px-4 py-2 border-r border-gray-200">{c.immatriculation}</td>
            <td className="px-4 py-2 border-r border-gray-200">{c.type}</td>
            <td className="px-4 py-2 border-r border-gray-200">{c.marquemodele}</td>
            <td className="px-4 py-2 border-r border-gray-200">{c.statut}</td>

            {/* Documents */}
            <td className="px-4 py-2 border-r border-gray-200">
              <div className="flex flex-col space-y-1">
                {c.cartegriseUrl && (
                  <a href={c.cartegriseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    Carte Grise
                  </a>
                )}
                {c.assuranceUrl && (
                  <a href={c.assuranceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    Assurance
                  </a>
                )}
                {c.visitetechniqueUrl && (
                  <a href={c.visitetechniqueUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    Visite Technique
                  </a>
                )}
              </div>
            </td>

            {/* Actions */}
            <td className="px-4 py-2 text-right whitespace-nowrap flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
                <Trash2 size={14} />
              </Button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

{/* Pagination */}
{totalPages > 1 && (
  <div className="flex justify-center gap-2 mt-2">
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


      {/* Modal Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCamion ? "Modifier camion" : "Créer un camion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Immatriculation"
              value={formData.immatriculation}
              onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Sélectionner type --</option>
              <option value="Benne">Benne</option>
              <option value="Tracteur">Tracteur</option>
              <option value="Remorque">Remorque</option>
              <option value="Semi remorque">Semi remorque</option>
            </select>
            <Input
              placeholder="Marque / Modèle"
              value={formData.marquemodele}
              onChange={(e) => setFormData({ ...formData, marquemodele: e.target.value })}
            />
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Disponible">Disponible</option>
              <option value="En maintenance">Maintenance</option>
              <option value="Indisponible">Indisponible</option>
            </select>

            {/* Fichiers */}
            <div className="space-y-2">
              <label>Photo <Input type="file" onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })} /></label>
              <label>Carte Grise <Input type="file" onChange={(e) => setFormData({ ...formData, cartegrise: e.target.files[0] })} /></label>
              <Input type="date" value={formData.cartegriseexpiry} onChange={(e) => setFormData({ ...formData, cartegriseexpiry: e.target.value })} />
              <label>Assurance <Input type="file" onChange={(e) => setFormData({ ...formData, assurance: e.target.files[0] })} /></label>
              <Input type="date" value={formData.assuranceexpiry} onChange={(e) => setFormData({ ...formData, assuranceexpiry: e.target.value })} />
              <label>Visite Technique <Input type="file" onChange={(e) => setFormData({ ...formData, visitetechnique: e.target.files[0] })} /></label>
              <Input type="date" value={formData.visitetechniqueexpiry} onChange={(e) => setFormData({ ...formData, visitetechniqueexpiry: e.target.value })} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={handleSubmit}>{editingCamion ? "Modifier" : "Créer"}</Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
