// src/components/UserModal.js
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { useToast } from "../components/ui/use-toast.js";
import { supabase } from "../services/supabaseClient.js";

export default function UserModal({ editingUser, setShowModal, fetchUsers }) {
  const { toast } = useToast();

  const initialForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "superviseur",
    cnib: null,
    cnibExpiry: "",
    permis: null,
    permisExpiry: "",
    carte: null,
    carteExpiry: "",
    acteNaissance: null,
  };

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        ...initialForm,
        ...editingUser,
        password: "",
      });
    }
  }, [editingUser]);

  const uploadFile = async (file, folder) => {
    if (!file) return null;
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("uploads").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!formData.name || !formData.email) {
        toast({ title: "Erreur", description: "Veuillez remplir les champs requis.", variant: "destructive" });
        return;
      }

      let userId = editingUser?.id;
      if (!editingUser) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });
        if (signUpError) throw signUpError;
        userId = data.user.id;
      }

      const uploads = {};
      if (formData.cnib instanceof File) uploads.cnib = await uploadFile(formData.cnib, "cnib");
      else uploads.cnib = editingUser?.cnibUrl || null;

      if (formData.permis instanceof File) uploads.permis = await uploadFile(formData.permis, "permis");
      else uploads.permis = editingUser?.permisUrl || null;

      if (formData.carte instanceof File) uploads.carte = await uploadFile(formData.carte, "carte");
      else uploads.carte = editingUser?.carteUrl || null;

      if (formData.acteNaissance instanceof File) uploads.acteNaissanceUrl = await uploadFile(formData.acteNaissance, "acteNaissance");
      else uploads.acteNaissanceUrl = editingUser?.acteNaissanceUrl || null;

      const userPayload = {
        id: userId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        cnibUrl: uploads.cnib,
        cnibExpiry: formData.cnibExpiry,
        permisUrl: uploads.permis,
        permisExpiry: formData.permisExpiry,
        carteUrl: uploads.carte,
        carteExpiry: formData.carteExpiry,
        acteNaissanceUrl: uploads.acteNaissanceUrl,
      };

      let response;
      if (editingUser) {
        response = await supabase.from("users").update(userPayload).eq("id", userId);
      } else {
        response = await supabase.from("users").insert([userPayload]);
      }

      if (response.error) throw response.error;

      toast({
        title: editingUser ? "Utilisateur modifié" : "Utilisateur créé",
        description: "Les informations ont été enregistrées avec succès.",
      });

      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error("Erreur création/modification utilisateur:", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Détermine si le champ doit s'afficher selon le rôle
  const showField = (field) => {
    if (formData.role === "superviseur") return ["cnib", "acteNaissance"].includes(field);
    if (formData.role === "admin") return field === "cnib";
    return true; // chauffeur ou autres → tous
  };

  return (
    <Dialog open={true} onOpenChange={setShowModal}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Modifier un utilisateur" : "Créer un utilisateur"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input placeholder="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} />
          {!editingUser && <Input type="password" placeholder="Mot de passe" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}
          <Input placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />

          <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="chauffeur">Chauffeur</option>
            <option value="superviseur">Superviseur</option>
            <option value="admin">Admin</option>
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {showField("cnib") && (
              <div>
                <label className="block text-sm font-medium">CNIB</label>
                <Input type="file" onChange={(e) => setFormData({ ...formData, cnib: e.target.files[0] })} />
                <Input type="date" value={formData.cnibExpiry} onChange={(e) => setFormData({ ...formData, cnibExpiry: e.target.value })} />
              </div>
            )}
            {showField("permis") && (
              <div>
                <label className="block text-sm font-medium">Permis</label>
                <Input type="file" onChange={(e) => setFormData({ ...formData, permis: e.target.files[0] })} />
                <Input type="date" value={formData.permisExpiry} onChange={(e) => setFormData({ ...formData, permisExpiry: e.target.value })} />
              </div>
            )}
            {showField("carte") && (
              <div>
                <label className="block text-sm font-medium">Carte Grise</label>
                <Input type="file" onChange={(e) => setFormData({ ...formData, carte: e.target.files[0] })} />
                <Input type="date" value={formData.carteExpiry} onChange={(e) => setFormData({ ...formData, carteExpiry: e.target.value })} />
              </div>
            )}
            {showField("acteNaissance") && (
              <div>
                <label className="block text-sm font-medium">Acte de Naissance</label>
                <Input type="file" onChange={(e) => setFormData({ ...formData, acteNaissance: e.target.files[0] })} />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={loading}>{loading ? "Enregistrement..." : editingUser ? "Modifier" : "Créer"}</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
