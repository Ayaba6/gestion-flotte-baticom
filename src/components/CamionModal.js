import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { useToast } from "../components/ui/use-toast.js";

export default function CamionModal({ editingCamion, setShowModal, fetchCamions }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    immatriculation: "",
    marquemodele: "",
    type: "",
    statut: "Disponible",
    photoUrl: "",
    cartegriseUrl: "",
    cartegriseexpiry: "",
    assuranceUrl: "",
    assuranceexpiry: "",
    visitetechniqueUrl: "",
    visitetechniqueexpiry: "",
  });

  // Pré-remplissage si édition
  useEffect(() => {
    if (editingCamion) {
      setForm({
        ...editingCamion,
        cartegriseexpiry: editingCamion.cartegriseexpiry?.split("T")[0] || "",
        assuranceexpiry: editingCamion.assuranceexpiry?.split("T")[0] || "",
        visitetechniqueexpiry: editingCamion.visitetechniqueexpiry?.split("T")[0] || "",
      });
    } else {
      setForm({
        immatriculation: "",
        marquemodele: "",
        type: "",
        statut: "Disponible",
        photoUrl: "",
        cartegriseUrl: "",
        cartegriseexpiry: "",
        assuranceUrl: "",
        assuranceexpiry: "",
        visitetechniqueUrl: "",
        visitetechniqueexpiry: "",
      });
    }
  }, [editingCamion]);

  // Changement champ texte
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // 🔼 Upload fichier vers Supabase
  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const filePath = `${fieldName}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      toast({ title: "Erreur Upload", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("uploads").getPublicUrl(filePath);

    if (publicUrlData?.publicUrl) {
      setForm((prev) => ({ ...prev, [fieldName]: publicUrlData.publicUrl }));
      toast({ title: "Fichier uploadé ✅", description: `Document ${fieldName} ajouté.` });
    }
  };

  // 🧾 Enregistrement camion
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.immatriculation || !form.marquemodele || !form.type) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (editingCamion) {
        const { error } = await supabase.from("camions").update(form).eq("id", editingCamion.id);
        if (error) throw error;
        toast({ title: "Camion mis à jour ✅" });
      } else {
        const { error } = await supabase.from("camions").insert([form]);
        if (error) throw error;
        toast({ title: "Camion ajouté ✅" });
      }

      fetchCamions();
      setShowModal(false);
    } catch (err) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {editingCamion ? "Modifier le Camion" : "Créer un Camion"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              name="immatriculation"
              placeholder="Immatriculation *"
              value={form.immatriculation}
              onChange={handleChange}
            />
            <Input
              name="marquemodele"
              placeholder="Marque / Modèle *"
              value={form.marquemodele}
              onChange={handleChange}
            />

            {/* ✅ Liste déroulante Type */}
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="border rounded px-2 py-2 w-full"
            >
              <option value="">-- Sélectionner le type --</option>
              <option value="Benne">Benne</option>
              <option value="Tracteur">Tracteur</option>
              <option value="Semi-remorque">Semi-remorque</option>
              <option value="Remorque">Remorque</option>
            </select>

            {/* Statut */}
            <select
              name="statut"
              value={form.statut}
              onChange={handleChange}
              className="border rounded px-2 py-2 w-full"
            >
              <option value="Disponible">Disponible</option>
              <option value="En maintenance">En maintenance</option>
              <option value="Indisponible">Indisponible</option>
            </select>
          </div>

          <hr className="my-3" />
          <h3 className="text-sm font-semibold text-gray-700">🖼️ Photo du camion</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "photoUrl")}
            className="block text-sm text-gray-600"
          />
          {form.photoUrl && (
            <img
              src={form.photoUrl}
              alt="Camion"
              className="w-32 h-20 object-cover rounded mt-2 border"
            />
          )}

          <hr className="my-3" />
          <h3 className="text-sm font-semibold text-gray-700">
            📄 Documents & Dates d'expiration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Carte grise */}
            <div>
              <label className="text-xs text-gray-500">Carte Grise</label>
              <input type="file" onChange={(e) => handleFileUpload(e, "cartegriseUrl")} />
              <Input
                type="date"
                name="cartegriseexpiry"
                value={form.cartegriseexpiry}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            {/* Assurance */}
            <div>
              <label className="text-xs text-gray-500">Assurance</label>
              <input type="file" onChange={(e) => handleFileUpload(e, "assuranceUrl")} />
              <Input
                type="date"
                name="assuranceexpiry"
                value={form.assuranceexpiry}
                onChange={handleChange}
                className="mt-1"
              />
            </div>

            {/* Visite technique */}
            <div>
              <label className="text-xs text-gray-500">Visite Technique</label>
              <input type="file" onChange={(e) => handleFileUpload(e, "visitetechniqueUrl")} />
              <Input
                type="date"
                name="visitetechniqueexpiry"
                value={form.visitetechniqueexpiry}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              className="border-gray-300 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading
                ? "Enregistrement..."
                : editingCamion
                ? "Mettre à jour"
                : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
