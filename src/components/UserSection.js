// src/components/gestion/UserSection.js
import React, { useState, useEffect, useCallback } from "react";

// ======================================================================
// 📦 I. IMPORTATIONS
// ======================================================================

// Services
import { supabase } from "../services/supabaseClient.js";

// UI Components (shadcn/ui-like, styled for consistency)
import { Card, CardHeader } from "../components/ui/card.js"; // Ajouté pour la cohérence
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog.js"; // Ajouté DialogFooter
import { useToast } from "../components/ui/use-toast.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.js"; // Ajouté pour la cohérence

// Icons
import { Pencil, Trash2, UserPlus, FileText, File, Loader2, Users, Info, Calendar } from "lucide-react"; // Mis à jour les icônes pour le style

// Data Export Libraries
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Importé comme dans le premier fichier


// ======================================================================
// ⚙️ II. CONSTANTES & ÉTAT INITIAL
// ======================================================================

const USERS_PER_PAGE = 5; // Réduit à 5 pour coller au style de pagination du premier code

const initialFormState = {
    name: "",
    email: "",
    password: "", // Only for creation
    phone: "",
    role: "superviseur",
    // Documents (will hold File objects before upload)
    cnib: null,
    cnibExpiry: "",
    permis: null,
    permisExpiry: "",
    carte: null,
    carteExpiry: "",
    acteNaissance: null,
};


// 💡 Composant utilitaire pour le statut/rôle
const getRoleBadge = (role) => {
    switch (role) {
        case "admin":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 capitalize">{role}</span>;
        case "superviseur":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800 capitalize">{role}</span>;
        case "chauffeur":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">{role}</span>;
        default:
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">{role}</span>;
    }
};

// 💡 Composant pour afficher les liens de documents
const DocumentLink = ({ url, name }) => {
    if (!url) return <span className="text-xs text-gray-500 italic">Non fourni</span>;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1 py-0.5">
            <FileText size={14} /> {name}
        </a>
    );
};

// ======================================================================
// 🚀 III. COMPOSANT PRINCIPAL (UserSection)
// ======================================================================

export default function UserSection() {
    const { toast } = useToast();

    // --- A. GESTION DE L'ÉTAT (State Management) ---
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState(initialFormState);
    const [uploading, setUploading] = useState(false); // Ajouté l'état d'upload

    // ======================================================================
    // 💾 IV. GESTION DES DONNÉES (Fetch, CRUD Handlers)
    // ======================================================================

    // --- A. Fetching Initial des Utilisateurs (READ) ---
    const fetchUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase.from("users").select("*");
            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error("Error fetching users:", err);
            toast({ title: "Erreur", description: "Impossible de charger les utilisateurs.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);


    // --- B. Soumission du Formulaire (CREATE/UPDATE) ---
    const handleSubmit = async () => {
        if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
            toast({ title: "Champs manquants", description: "Veuillez remplir le nom, l'email et le mot de passe (pour la création).", variant: "destructive" });
            return;
        }

        setUploading(true);
        try {
            // 1. Upload files
            let cnibUrl = editingUser?.cnibUrl;
            let permisUrl = editingUser?.permisUrl;
            let carteUrl = editingUser?.carteUrl;
            let acteNaissanceUrl = editingUser?.acteNaissanceUrl;

            // Upload only if a new File object is present
            if (formData.cnib instanceof File) cnibUrl = await uploadFile(formData.cnib, "cnib");
            if (formData.permis instanceof File) permisUrl = await uploadFile(formData.permis, "permis");
            if (formData.carte instanceof File) carteUrl = await uploadFile(formData.carte, "carte");
            if (formData.acteNaissance instanceof File) acteNaissanceUrl = await uploadFile(formData.acteNaissance, "acteNaissance");

            // 2. Prepare data for DB
            const userData = {
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

            // 3. Insert or Update
            if (editingUser) {
                const { error } = await supabase.from("users").update(userData).eq("id", editingUser.id);
                if (error) throw error;
                toast({ title: "Succès", description: "Utilisateur modifié avec succès ✅" });
            } else {
                // NOTE: Password/Auth creation logic would go here, often via an Auth function/trigger
                const { error } = await supabase.from("users").insert([{...userData, password: formData.password}]); // Assuming password is a column for simplicity
                if (error) throw error;
                toast({ title: "Succès", description: "Utilisateur créé avec succès ✅" });
            }

            // 4. Reset state
            setFormData(initialFormState);
            setEditingUser(null);
            setShowModal(false);
            fetchUsers(); // Refresh the list
        } catch (err) {
            console.error("Submission error:", err);
            toast({ title: "Erreur de soumission", description: err.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };


    // --- C. Suppression d'un Utilisateur (DELETE) ---
    const handleDeleteUser = async (id) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
        try {
            const { error } = await supabase.from("users").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Supprimé", description: "Utilisateur supprimé avec succès ✅" });
            fetchUsers();
        } catch (err) {
            console.error("Deletion error:", err);
            toast({ title: "Erreur de suppression", description: err.message, variant: "destructive" });
        }
    };


    // --- D. Gestion de la Modale (Open/Close) ---
    const handleEdit = (user) => {
        setEditingUser(user);
        // Populate form data, formatting dates to YYYY-MM-DD
        setFormData({
            ...initialFormState,
            ...user,
            cnibExpiry: user.cnibExpiry ? user.cnibExpiry.split('T')[0] : "",
            permisExpiry: user.permisExpiry ? user.permisExpiry.split('T')[0] : "",
            carteExpiry: user.carteExpiry ? user.carteExpiry.split('T')[0] : "",
            cnib: null, // Clear File objects to avoid re-uploading
            permis: null,
            carte: null,
            acteNaissance: null,
        });
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setEditingUser(null);
        setFormData(initialFormState);
        setShowModal(true);
    };


    // ======================================================================
    // 📄 V. GESTION DES FICHIERS (Upload Utilities)
    // ======================================================================

    const sanitizeFileName = (name) =>
        name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-_]/g, "_");

    const uploadFile = async (file, folder) => {
        if (!file) return null;
        if (file.size > 50 * 1024 * 1024) {
            toast({ title: "Erreur", description: "Fichier trop volumineux (max 50MB)", variant: "destructive" });
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


    // ======================================================================
    // 🧮 VI. LOGIQUE MÉTIER & FILTRAGE/PAGINATION
    // ======================================================================

    /** Détermine les champs de documents requis en fonction du rôle. */
    const getDocumentFields = (role) => {
        switch (role) {
            case "chauffeur":
                return ["cnib", "permis", "carte", "acteNaissance"];
            case "superviseur":
                return ["cnib", "acteNaissance"];
            case "admin":
                return ["cnib"];
            default:
                return [];
        }
    };

    const documentFields = getDocumentFields(formData.role);

    // --- Filtering and Pagination Logic ---
    const filteredUsers = (users || []).filter(
        (u) =>
            (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) &&
            (roleFilter === "" || u.role === roleFilter)
    );

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    );

    /** Renders document links for the table cell. */
    const renderDocuments = (user) => {
        const docs = [];
        if (user.cnibUrl) docs.push(<DocumentLink key="cnib" url={user.cnibUrl} name="CNIB" />);
        if (user.permisUrl) docs.push(<DocumentLink key="permis" url={user.permisUrl} name="Permis" />);
        if (user.carteUrl) docs.push(<DocumentLink key="carte" url={user.carteUrl} name="Carte Aff." />);
        if (user.acteNaissanceUrl) docs.push(<DocumentLink key="acte" url={user.acteNaissanceUrl} name="Acte Naiss." />);

        return docs.length > 0 ? <div className="space-y-1">{docs}</div> : <span className="text-gray-500 italic">Aucun</span>;
    };


    // ======================================================================
    // 📊 VII. GESTION DES EXPORTS (Excel, PDF)
    // ======================================================================

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
        XLSX.writeFile(wb, "liste_utilisateurs.xlsx");
        toast({ title: "Export Excel", description: "Liste des utilisateurs exportée." });
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Liste des Utilisateurs", 14, 20);
        doc.setFontSize(10);

        doc.autoTable({
            startY: 30,
            head: [["Nom", "Email", "Téléphone", "Rôle"]],
            body: filteredUsers.map(u => [u.name, u.email, u.phone || "N/A", u.role]),
            theme: 'striped',
            styles: { fontSize: 9, overflow: 'linebreak' },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
        });

        doc.save("liste_utilisateurs.pdf");
        toast({ title: "Export PDF", description: "Le document a été généré avec succès." });
    };


    // ======================================================================
    // 🖥️ VIII. RENDER (JSX)
    // ======================================================================

    return (
        <div className="p-4 md:p-6 space-y-6">

            {/* --- 1. Header et Bouton Ajouter --- */}
            <Card className="shadow-xl bg-white/90 border border-gray-200">
                <CardHeader className="flex flex-row justify-between items-center p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Users size={24} className="text-blue-600" /> Gestion des Utilisateurs
                    </h2>
                    <Button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition"
                    >
                        <UserPlus size={18} /> Créer Utilisateur
                    </Button>
                </CardHeader>
            </Card>

            {/* --- 2. Recherche + filtres + exports --- */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">

                {/* Bloc Recherche et Filtres */}
                <div className="flex flex-wrap gap-3 items-center">
                    <Input
                        placeholder="🔍 Rechercher par Nom..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full sm:w-64 border-gray-300 focus:border-blue-500"
                    />

                    {/* Filtre Rôle */}
                    <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Tous les Rôles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous les Rôles</SelectItem>
                            <SelectItem value="chauffeur">Chauffeur</SelectItem>
                            <SelectItem value="superviseur">Superviseur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Boutons Export */}
                <div className="flex flex-wrap gap-3 justify-end w-full md:w-auto mt-2 md:mt-0">
                    <Button onClick={exportExcel} variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 hover:bg-green-50/50 transition flex-grow md:flex-grow-0">
                        <File size={16} /> Export Excel
                    </Button>
                    <Button onClick={exportPDF} variant="outline" className="flex items-center gap-1 border-red-500 text-red-600 hover:bg-red-50/50 transition flex-grow md:flex-grow-0">
                        <FileText size={16} /> Export PDF
                    </Button>
                </div>
            </div>

            {/* --- 3. Tableau Utilisateurs --- */}
            <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom/Prenom</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rôle</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[150px] hidden lg:table-cell">Documents</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    <Info size={24} className="mx-auto text-gray-400 mb-2" />
                                    Aucun utilisateur trouvé correspondant aux critères de recherche.
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map(u => (
                                <tr key={u.id} className="hover:bg-blue-50/50 transition">
                                    <td className="p-4 font-semibold text-gray-700 whitespace-nowrap">{u.name}</td>
                                    <td className="p-4 text-gray-600 hidden sm:table-cell">{u.email}</td>
                                    <td className="p-4 text-gray-600 hidden md:table-cell">{u.phone || "N/A"}</td>
                                    <td className="p-4">{getRoleBadge(u.role)}</td>
                                    <td className="p-4 text-xs space-y-1 hidden lg:table-cell">{renderDocuments(u)}</td>

                                    {/* Actions */}
                                    <td className="p-4 text-center whitespace-nowrap">
                                        <div className="flex justify-center gap-2">
                                            <Button size="icon" variant="outline" onClick={() => handleEdit(u)} className="hover:bg-blue-100 text-blue-600">
                                                <Pencil size={16} />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleDeleteUser(u.id)} className="bg-red-500 hover:bg-red-600">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
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
                            className={i + 1 === currentPage ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 hover:bg-gray-100"}
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            )}


            {/* ----------------------------------------------------------- */}
            {/* Modal Form */}
            {/* ----------------------------------------------------------- */}
            <Dialog open={showModal} onOpenChange={(isOpen) => {
                setShowModal(isOpen);
                if (!isOpen) {
                    setEditingUser(null);
                    setFormData(initialFormState);
                }
            }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingUser ? "Modifier un utilisateur" : "Créer un nouvel utilisateur"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {/* Immatriculation et Marque/Modèle */}
                        <div className="flex gap-4">
                            <Input
                                placeholder="Nom / Prénom (Requis)"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="w-full"
                            />
                            <Input
                                placeholder="Email (Requis)"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="w-full"
                                disabled={!!editingUser}
                            />
                        </div>

                        <div className="flex gap-4">
                            {!editingUser && (
                                <Input
                                    type="password"
                                    placeholder="Mot de passe (Création uniquement)"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full"
                                />
                            )}
                            <Input
                                placeholder="Téléphone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full"
                            />
                        </div>

                        {/* Rôle */}
                        <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner le Rôle *" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="chauffeur">Chauffeur</SelectItem>
                                <SelectItem value="superviseur">Superviseur</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>


                        {/* Fichiers et Expiration */}
                        <h3 className="text-lg font-semibold border-b pb-1 mt-6 text-gray-700">Documents et Expiration</h3>
                        <p className="text-sm text-gray-500 italic">Laissez vide si vous ne souhaitez pas mettre à jour le fichier.</p>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            {/* Dynamic Document Fields */}
                            {documentFields.map(docKey => (
                                <div key={docKey} className="grid grid-cols-2 gap-4 items-center">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <FileText size={16} />
                                        {docKey === 'cnib' ? 'CNIB' :
                                            docKey === 'permis' ? 'Permis' :
                                                docKey === 'carte' ? "Carte Affiliation" : 'Acte Naissance'} (PDF/Image):
                                    </label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setFormData({ ...formData, [docKey]: e.target.files[0] })}
                                        className="col-span-1"
                                    />

                                    {/* Expiry Date (if applicable) */}
                                    {(docKey === "cnib" || docKey === "permis" || docKey === "carte") && (
                                        <>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <Calendar size={16} /> Exp. {docKey === 'cnib' ? 'CNIB' : docKey === 'permis' ? 'Permis' : 'Carte'}:
                                            </label>
                                            <Input
                                                type="date"
                                                value={formData[`${docKey}Expiry`]}
                                                onChange={(e) => setFormData({ ...formData, [`${docKey}Expiry`]: e.target.value })}
                                                className="col-span-1"
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setShowModal(false)} disabled={uploading}>Annuler</Button>
                        <Button onClick={handleSubmit} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                            {uploading ? (
                                <><Loader2 size={18} className="animate-spin mr-2" /> En cours...</>
                            ) : (
                                editingUser ? "Sauvegarder les modifications" : "Créer l'utilisateur"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}