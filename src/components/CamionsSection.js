import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/card.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import ResponsiveWrapper from "../components/ResponsiveWrapper.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

export default function CamionsSection() {
  const { toast } = useToast();
  const [camions, setCamions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCamion, setEditingCamion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  };

  const [formData, setFormData] = useState(initialForm);

  // --- Fetch camions ---
  const fetchCamions = async () => {
    try {
      const res = await fetch("http://localhost:4000/camions");
      const data = await res.json();
      setCamions(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les camions", variant: "destructive" });
    }
  };

  useEffect(() => { fetchCamions(); }, []);

  // --- Submit form ---
  const handleSubmit = async () => {
    if (!formData.immatriculation || !formData.type || !formData.marquemodele) {
      toast({ title: "Champs manquants", description: "Remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    try {
      let res, data;

      if (editingCamion) {
        // PUT JSON (modification uniquement champs texte)
        res = await fetch(`http://localhost:4000/camions/${editingCamion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            immatriculation: formData.immatriculation,
            type: formData.type,
            marquemodele: formData.marquemodele,
            statut: formData.statut,
            cartegriseexpiry: formData.cartegriseexpiry,
            assuranceexpiry: formData.assuranceexpiry,
            visitetechniqueexpiry: formData.visitetechniqueexpiry,
          }),
        });
        data = await res.json();
      } else {
        // POST avec fichiers
        const body = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== null) body.append(key, value);
        });

        res = await fetch("http://localhost:4000/camions", { method: "POST", body });
        data = await res.json();
      }

      if (!res.ok) throw new Error(data.error || "Erreur");

      toast({ title: "Succès", description: `Camion ${editingCamion ? "modifié" : "créé"} avec succès ✅` });

      setFormData(initialForm);
      setEditingCamion(null);
      setShowModal(false);
      fetchCamions();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Edit camion ---
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
    });
    setShowModal(true);
  };

  // --- Delete camion ---
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce camion ?")) return;
    try {
      const res = await fetch(`http://localhost:4000/camions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast({ title: "Supprimé", description: "Camion supprimé avec succès ✅" });
      fetchCamions();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Filtered camions ---
  const filteredCamions = camions.filter((c) =>
    (c.immatriculation?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

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

      {/* Search */}
      <Input
        placeholder="🔍 Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/3 mb-4"
      />

      {/* Table */}
      <Card>
        <CardContent>
          <ResponsiveWrapper>
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2">Immatriculation</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Marque/Modèle</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Documents</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCamions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{c.immatriculation}</td>
                    <td className="px-4 py-2">{c.type}</td>
                    <td className="px-4 py-2">{c.marquemodele}</td>
                    <td className="px-4 py-2">{c.statut}</td>
                    <td className="px-4 py-2 space-y-1">
                      {c.cartegriseurl && <a href={c.cartegriseurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Carte Grise</a>}
                      {c.assuranceurl && <a href={c.assuranceurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Assurance</a>}
                      {c.visitetechniqueurl && <a href={c.visitetechniqueurl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Visite Technique</a>}
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveWrapper>
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
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
              <option value="Camion">Camion</option>
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

            {/* Documents */}
            <div className="space-y-2">
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
