import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";
import { Pencil, Trash2, UserPlus, FileText, FileSpreadsheet } from "lucide-react";

// Excel
import * as XLSX from "xlsx";
// PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function UserSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // Filtre par rôle

  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 15;

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

  // --- Fetch users ---
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de charger les utilisateurs", variant: "destructive" });
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- Utility: sanitize file names ---
  const sanitizeFileName = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  };

  // --- Upload file ---
  const uploadFile = async (file, folder) => {
    if (!file) return null;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Fichier trop volumineux", variant: "destructive" });
      return null;
    }

    const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      toast({ title: "Erreur upload", description: uploadError.message, variant: "destructive" });
      return null;
    }

    const { data } = supabase.storage.from("uploads").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- Submit form ---
  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Champs manquants", description: "Veuillez remplir les champs requis", variant: "destructive" });
      return;
    }

    try {
      const cnibUrl = formData.cnib ? await uploadFile(formData.cnib, "cnib") : null;
      const permisUrl = formData.permis ? await uploadFile(formData.permis, "permis") : null;
      const carteUrl = formData.carte ? await uploadFile(formData.carte, "carte") : null;
      const acteNaissanceUrl = formData.acteNaissance ? await uploadFile(formData.acteNaissance, "acteNaissance") : null;

      const insertData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        cnibUrl,
        cnibExpiry: formData.cnibExpiry || null,
        permisUrl,
        permisExpiry: formData.permisExpiry || null,
        carteUrl,
        carteExpiry: formData.carteExpiry || null,
        acteNaissanceUrl,
      };

      if (editingUser) {
        const { error } = await supabase.from("users").update(insertData).eq("id", editingUser.id);
        if (error) throw error;
        toast({ title: "Succès", description: "Utilisateur modifié ✅" });
      } else {
        const { error } = await supabase.from("users").insert([insertData]);
        if (error) throw error;
        toast({ title: "Succès", description: "Utilisateur créé ✅" });
      }

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
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Supprimé", description: "Utilisateur supprimé ✅" });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
  };

  // --- Determine documents based on role ---
  const getDocumentFields = (role) => {
    switch (role) {
      case "chauffeur": return ["cnib", "permis", "carte", "acteNaissance"];
      case "superviseur": return ["cnib", "acteNaissance"];
      case "admin": return ["cnib"];
      default: return [];
    }
  };

  const documentFields = getDocumentFields(formData.role);

  // --- Filtre et pagination ---
  const filteredUsers = users.filter(
    u =>
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) &&
      (roleFilter === "" || u.role === roleFilter)
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  // --- Render documents links ---
  const renderDocuments = (user) => {
    const docs = [];
    if (user.cnibUrl) docs.push(<a key="cnib" href={user.cnibUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">CNIB</a>);
    if (user.permisUrl) docs.push(<a key="permis" href={user.permisUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Permis</a>);
    if (user.carteUrl) docs.push(<a key="carte" href={user.carteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Carte</a>);
    if (user.acteNaissanceUrl) docs.push(<a key="acte" href={user.acteNaissanceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Acte</a>);
    return docs.length > 0 ? docs.reduce((prev, curr) => [prev, ', ', curr]) : "—";
  };

  // --- Export Excel ---
  const exportExcel = () => {
    const wsData = filteredUsers.map(u => ({
      Nom: u.name,
      Email: u.email,
      Téléphone: u.phone,
      Rôle: u.role
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, "utilisateurs.xlsx");
  };

  // --- Export PDF ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des utilisateurs", 14, 20);
    const tableColumn = ["Nom", "Email", "Téléphone", "Rôle"];
    const tableRows = filteredUsers.map(u => [u.name, u.email, u.phone, u.role]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 25 });
    doc.save("utilisateurs.pdf");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + search + create + filtre */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Tous les rôles</option>
            <option value="chauffeur">Chauffeur</option>
            <option value="superviseur">Superviseur</option>
            <option value="admin">Admin</option>
          </select>
          <Button onClick={() => { setShowModal(true); setEditingUser(null); }}>
            <UserPlus size={18} className="mr-2" /> Créer
          </Button>
          <Button onClick={exportExcel} variant="outline">
            <FileSpreadsheet size={16} className="mr-1" /> Excel
          </Button>
          <Button onClick={exportPDF} variant="outline">
            <FileText size={16} className="mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Tableau utilisateurs */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Nom/Prenom</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Téléphone</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Rôle</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-r border-gray-300">Documents</th>
              <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-2 text-center text-gray-500">Aucun utilisateur trouvé.</td>
              </tr>
            ) : (
              paginatedUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-r border-gray-200">{u.name}</td>
                  <td className="px-4 py-2 border-r border-gray-200">{u.email}</td>
                  <td className="px-4 py-2 border-r border-gray-200">{u.phone}</td>
                  <td className="px-4 py-2 border-r border-gray-200">{u.role}</td>
                  <td className="px-4 py-2 border-r border-gray-200">{renderDocuments(u)}</td>
                  <td className="px-4 py-2 text-right flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setEditingUser(u); setFormData(u); setShowModal(true); }}>
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>
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
            <Button key={i} size="sm" variant={i + 1 === currentPage ? "default" : "outline"} onClick={() => setCurrentPage(i + 1)}>
              {i + 1}
            </Button>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Modifier utilisateur" : "Créer utilisateur"}</DialogTitle>
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

            {documentFields.includes("cnib") && (
              <div className="space-y-1">
                <label>CNIB</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, cnib: e.target.files[0] })} />
                <Input type="date" placeholder="Date d'expiration CNIB" value={formData.cnibExpiry} onChange={(e) => setFormData({ ...formData, cnibExpiry: e.target.value })} />
              </div>
            )}

            {documentFields.includes("permis") && (
              <div className="space-y-1">
                <label>Permis</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, permis: e.target.files[0] })} />
                <Input type="date" placeholder="Date d'expiration Permis" value={formData.permisExpiry} onChange={(e) => setFormData({ ...formData, permisExpiry: e.target.value })} />
              </div>
            )}

            {documentFields.includes("carte") && (
              <div className="space-y-1">
                <label>Carte d'affiliation</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, carte: e.target.files[0] })} />
                <Input type="date" placeholder="Date d'expiration Carte" value={formData.carteExpiry} onChange={(e) => setFormData({ ...formData, carteExpiry: e.target.value })} />
              </div>
            )}

            {documentFields.includes("acteNaissance") && (
              <div className="space-y-1">
                <label>Acte de naissance</label>
                <input type="file" onChange={(e) => setFormData({ ...formData, acteNaissance: e.target.files[0] })} />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleSubmit}>{editingUser ? "Modifier" : "Créer"}</Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
