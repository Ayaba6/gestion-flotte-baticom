import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../components/ui/card.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import ResponsiveWrapper from "../components/ResponsiveWrapper.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";

export default function UserSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const initialForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "superviseur",
    cnib: null,
    cnibexpiry: "",
    permis: null,
    permisexpiry: "",
    carte: null,
    carteexpiry: "",
  };

  const [formData, setFormData] = useState(initialForm);

  // --- Fetch users ---
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:4000/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- Submit form ---
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      toast({ title: "Champs manquants", description: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }

    try {
      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => { if (value !== null) body.append(key, value); });

      const url = editingUser
        ? `http://localhost:4000/users/${editingUser.id}`
        : "http://localhost:4000/create-user";

      const options = { method: editingUser ? "PUT" : "POST", body };

      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      toast({ title: "Succès", description: `Utilisateur ${editingUser ? "modifié" : "créé"} avec succès ✅` });

      setFormData(initialForm);
      setEditingUser(null);
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Delete user ---
  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      const res = await fetch(`http://localhost:4000/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      toast({ title: "Supprimé", description: "Utilisateur supprimé avec succès ✅" });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Filtered users ---
  const filteredUsers = users.filter(
    (u) =>
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-xl bg-white/70 border border-gray-200">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
          <Button onClick={() => { setShowModal(true); setEditingUser(null); }}>
            <UserPlus size={18} className="mr-2" /> Créer
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
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Téléphone</th>
                  <th className="px-4 py-2">Rôle</th>
                  <th className="px-4 py-2">Documents</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.phone}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2 space-y-1">
                      {u.cnibUrl && <a href={u.cnibUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">CNIB</a>}
                      {u.permisUrl && <a href={u.permisUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Permis</a>}
                      {u.carteUrl && <a href={u.carteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Carte</a>}
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingUser(u);
                        setFormData({ ...u, password: "" });
                        setShowModal(true);
                      }}>
                        <Pencil size={14} />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={14} />
                      </Button>
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
            <DialogTitle>{editingUser ? "Modifier l’utilisateur" : "Créer un utilisateur"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input placeholder="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <Input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={editingUser !== null} />
            <Input placeholder="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            {!editingUser && <Input type="password" placeholder="Mot de passe" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />}

            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="superviseur">Superviseur</option>
              <option value="chauffeur">Chauffeur</option>
              <option value="admin">Admin</option>
            </select>

            {/* Documents */}
            <div className="space-y-2">
              <label className="block">
                CNIB: <input type="file" onChange={(e) => setFormData({ ...formData, cnib: e.target.files[0] })} />
              </label>
              <Input type="date" placeholder="Date d'expiration CNIB" value={formData.cnibexpiry} onChange={(e) => setFormData({ ...formData, cnibexpiry: e.target.value })} />

              <label className="block">
                Permis: <input type="file" onChange={(e) => setFormData({ ...formData, permis: e.target.files[0] })} />
              </label>
              <Input type="date" placeholder="Date d'expiration Permis" value={formData.permisexpiry} onChange={(e) => setFormData({ ...formData, permisexpiry: e.target.value })} />

              <label className="block">
                Carte: <input type="file" onChange={(e) => setFormData({ ...formData, carte: e.target.files[0] })} />
              </label>
              <Input type="date" placeholder="Date d'expiration Carte" value={formData.carteexpiry} onChange={(e) => setFormData({ ...formData, carteexpiry: e.target.value })} />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button onClick={handleSubmit}>{editingUser ? "Modifier" : "Créer"}</Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
