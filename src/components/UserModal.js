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

  useEffect(() => {
    if (editingUser) setFormData(editingUser);
  }, [editingUser]);

  // Upload + submit logic ici (copie depuis ton UserSection)
  const handleSubmit = async () => {
    // ton code existant pour upload et insert/update
  };

  return (
    <Dialog open={true} onOpenChange={setShowModal}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Modifier utilisateur" : "Créer utilisateur"}</DialogTitle>
        </DialogHeader>

        {/* Formulaire ici (copie ton formulaire actuel) */}
        <div className="space-y-3 mt-2">
          <Input placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <Input placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} />
          {!editingUser && <Input type="password" placeholder="Mot de passe" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />}
          <Input placeholder="Téléphone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="chauffeur">Chauffeur</option>
            <option value="superviseur">Superviseur</option>
            <option value="admin">Admin</option>
          </select>
          {/* Ajoute ici tes champs documents comme dans ton UserSection */}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSubmit}>{editingUser ? "Modifier" : "Créer"}</Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
