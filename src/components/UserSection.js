// src/components/UserSection.js
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { Card, CardHeader, CardContent } from "../components/ui/card.js";
import { useToast } from "../components/ui/use-toast.js";
import ConfirmDialog from "../components/ui/ConfirmDialog.js";
import UserModal from "./UserModal.js";
import { Pencil, Trash2, FileText, Users, File } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function UserSection() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 5;

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("id", { ascending: false });
    if (error) {
      toast({ title: "Erreur de chargement", description: error.message, variant: "destructive" });
    } else setUsers(data || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userToDelete.id);
      if (error) throw error;
      toast({ title: "Utilisateur supprimé", description: `${userToDelete.name} a été supprimé avec succès.` });
      fetchUsers();
      setUserToDelete(null);
      setConfirmOpen(false);
    } catch (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (user) => { setEditingUser(user); setShowModal(true); };
  const handleAdd = () => { setEditingUser(null); setShowModal(true); };

  const getRoleBadge = (role) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      superviseur: "bg-green-100 text-green-800",
      chauffeur: "bg-blue-100 text-blue-800",
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[role] || "bg-gray-100 text-gray-800"}`}>{role}</span>;
  };

  const renderDocuments = (user) => {
    const docs = [];
    if (user.cnibUrl) docs.push(<a key="cnib" href={user.cnibUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> CNIB</a>);
    if (user.permisUrl) docs.push(<a key="permis" href={user.permisUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Permis</a>);
    if (user.carteUrl) docs.push(<a key="carte" href={user.carteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Carte Aff.</a>);
    if (user.acteNaissanceUrl) docs.push(<a key="acte" href={user.acteNaissanceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1"><FileText size={14}/> Acte Naiss.</a>);
    return docs.length ? <div className="flex flex-col gap-1">{docs}</div> : <span className="text-gray-400 italic">Aucun</span>;
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (roleFilter === "" || u.role === roleFilter)
  );

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

  const exportExcel = () => {
    const wsData = filteredUsers.map(u => ({ Nom: u.name, Email: u.email, Téléphone: u.phone, Rôle: u.role }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, "liste_utilisateurs.xlsx");
    toast({ title: "Export Excel", description: "Liste des utilisateurs exportée." });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste des Utilisateurs", 14, 20);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [["Nom","Email","Téléphone","Rôle","Documents"]],
      body: filteredUsers.map(u => [
        u.name,
        u.email,
        u.phone || "N/A",
        u.role,
        [
          u.cnibUrl ? "CNIB" : "",
          u.permisUrl ? "Permis" : "",
          u.carteUrl ? "Carte Aff." : "",
          u.acteNaissanceUrl ? "Acte Naiss." : ""
        ].filter(Boolean).join(", ")
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    });

    doc.save("liste_utilisateurs.pdf");
    toast({ title: "Export PDF", description: "Le document a été généré." });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Header */}
      <Card className="shadow-xl bg-white/90 border border-gray-200">
        <CardHeader className="flex flex-row justify-between items-center p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users size={24} className="text-blue-600"/> Gestion des Utilisateurs
          </h2>
          <Button onClick={handleAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            + Créer Utilisateur
          </Button>
        </CardHeader>
      </Card>

      {/* Recherche + filtres + exports */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 Rechercher par Nom..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 border-gray-300 rounded px-2 py-1"
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-40 border rounded px-2 py-1"
          >
            <option value="">Tous les rôles</option>
            <option value="chauffeur">Chauffeur</option>
            <option value="superviseur">Superviseur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto mt-2 md:mt-0">
          <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50">
            <File size={16}/> Excel
          </Button>
          <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50">
            <FileText size={16}/> PDF
          </Button>
        </div>
      </div>

      {/* Tableau (desktop) */}
      <div className="hidden md:block overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Documents</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paginatedUsers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Aucun utilisateur trouvé</td></tr>
            ) : paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-blue-50/50 transition">
                <td className="px-4 py-2 font-medium text-gray-700">{u.name}</td>
                <td className="px-4 py-2 text-gray-600">{u.email}</td>
                <td className="px-4 py-2 text-gray-600">{u.phone || "N/A"}</td>
                <td className="px-4 py-2">{getRoleBadge(u.role)}</td>
                <td className="px-4 py-2">{renderDocuments(u)}</td>
                <td className="px-4 py-2 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(u)}><Pencil size={16}/></Button>
                  <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(u); setConfirmOpen(true); }}><Trash2 size={16}/></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartes utilisateurs (mobile) */}
      <div className="md:hidden space-y-4">
        {paginatedUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 bg-white rounded-xl shadow border border-gray-100">Aucun utilisateur trouvé</div>
        ) : paginatedUsers.map(u => (
          <Card key={u.id} className="bg-white shadow-xl border border-gray-100">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">{u.name}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(u)}><Pencil size={16}/></Button>
                  <Button variant="destructive" size="sm" onClick={() => { setUserToDelete(u); setConfirmOpen(true); }}><Trash2 size={16}/></Button>
                </div>
              </div>
              <div className="text-gray-600 text-sm"><strong>Email:</strong> {u.email}</div>
              <div className="text-gray-600 text-sm"><strong>Téléphone:</strong> {u.phone || "N/A"}</div>
              <div>{getRoleBadge(u.role)}</div>
              <div className="pt-2">{renderDocuments(u)}</div>
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

      {showModal && <UserModal editingUser={editingUser} setShowModal={setShowModal} fetchUsers={fetchUsers} />}

      <ConfirmDialog
        open={confirmOpen}
        onClose={setConfirmOpen}
        title="Supprimer cet utilisateur ?"
        description={`Êtes-vous sûr de vouloir supprimer "${userToDelete?.name}" ?`}
        confirmLabel="Supprimer"
        confirmColor="bg-red-600 hover:bg-red-700"
        onConfirm={confirmDelete}
      />

    </div>
  );
}
