// src/components/billing/CamionsSection.js
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Card, CardHeader } from "../components/ui/card.js";
import { Button } from "../components/ui/button.js";
import { Input } from "../components/ui/input.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog.js";
import { useToast } from "../components/ui/use-toast.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.js";
import { Pencil, Trash2, PlusCircle, FileText, File, Calendar, AlertTriangle, XCircle, Truck, Info, Camera, Loader2 } from "lucide-react";
import ResponsiveWrapper from "../components/ResponsiveWrapper.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// 💡 Fonction utilitaire pour le statut
const getStatusBadge = (statut) => {
    switch (statut) {
        case "Disponible":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{statut}</span>;
        case "En maintenance":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">{statut}</span>;
        case "Indisponible":
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">{statut}</span>;
        default:
            return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{statut}</span>;
    }
};

// 💡 Composant pour afficher les documents avec alerte
const DocumentLink = ({ url, expiryDate, name }) => {
    if (!url) return <span className="text-xs text-gray-500 italic">Non fourni</span>;
    
    const now = new Date();
    const expiry = expiryDate ? new Date(expiryDate) : null;
    let alert = null;

    if (expiry) {
        const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            alert = { icon: <XCircle size={14} className="text-red-500" />, title: "Expiré" };
        } else if (diffDays <= 30) {
            alert = { icon: <AlertTriangle size={14} className="text-yellow-500" />, title: `Expire dans ${diffDays}j` };
        }
    }

    return (
        <div className="flex items-center justify-between gap-2 py-1">
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
                <FileText size={14} /> {name}
            </a>
            {alert && (
                <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50/50">
                    {alert.icon}
                    <span className={alert.title.includes("Expiré") ? "text-red-600 font-bold" : "text-yellow-600"}>
                        {alert.title}
                    </span>
                </div>
            )}
        </div>
    );
};

export default function CamionsSection() {
    const { toast } = useToast();
    const [camions, setCamions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCamion, setEditingCamion] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterStatut, setFilterStatut] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [uploading, setUploading] = useState(false);
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
    const fetchCamions = useCallback(async () => {
        try {
            const { data, error } = await supabase.from("camions").select("*");
            if (error) throw error;
            setCamions(data || []);
        } catch (err) {
            console.error(err);
            toast({ title: "Erreur", description: "Impossible de charger les camions", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => { fetchCamions(); }, [fetchCamions]); 

    // --- Upload Logic ---
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

    // --- Submit form ---
    const handleSubmit = async () => {
        if (!formData.immatriculation || !formData.type || !formData.marquemodele) {
            toast({ title: "Champs manquants", description: "Remplir tous les champs obligatoires", variant: "destructive" });
            return;
        }

        setUploading(true);
        let cartegriseUrl = editingCamion?.cartegriseUrl;
        let assuranceUrl = editingCamion?.assuranceUrl;
        let visitetechniqueUrl = editingCamion?.visitetechniqueUrl;
        let photoUrl = editingCamion?.photoUrl;
        
        try {
            // Upload des nouveaux fichiers
            if (formData.cartegrise instanceof File) cartegriseUrl = await uploadFile(formData.cartegrise, "cartegrise");
            if (formData.assurance instanceof File) assuranceUrl = await uploadFile(formData.assurance, "assurance");
            if (formData.visitetechnique instanceof File) visitetechniqueUrl = await uploadFile(formData.visitetechnique, "visitetechnique");
            if (formData.photo instanceof File) photoUrl = await uploadFile(formData.photo, "photos");

            // Construction des données à insérer/mettre à jour
            const upsertData = {
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
                const { error } = await supabase.from("camions").update(upsertData).eq("id", editingCamion.id);
                if (error) throw error;
                toast({ title: "Succès", description: "Camion modifié ✅" });
            } else {
                const { error } = await supabase.from("camions").insert([upsertData]);
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
        } finally {
            setUploading(false);
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
            // Formatage YYYY-MM-DD
            cartegriseexpiry: c.cartegriseexpiry ? c.cartegriseexpiry.split('T')[0] : "",
            assuranceexpiry: c.assuranceexpiry ? c.assuranceexpiry.split('T')[0] : "",
            visitetechniqueexpiry: c.visitetechniqueexpiry ? c.visitetechniqueexpiry.split('T')[0] : "",
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

    // --- Export Excel ---
    const exportExcel = () => {
        const data = filteredCamions.map(c => ({
            Immatriculation: c.immatriculation,
            Type: c.type,
            "Marque/Modèle": c.marquemodele,
            Statut: c.statut,
            "Exp. Carte Grise": c.cartegriseexpiry || "N/A",
            "Exp. Assurance": c.assuranceexpiry || "N/A",
            "Exp. Visite Technique": c.visitetechniqueexpiry || "N/A",
            "Lien Carte Grise": c.cartegriseUrl || "",
            "Lien Assurance": c.assuranceUrl || "",
            "Lien Visite Technique": c.visitetechniqueUrl || "",
            "Lien Photo": c.photoUrl || "",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Camions");
        XLSX.writeFile(wb, "camions.xlsx");
        toast({ title: "Export Excel", description: "Les données ont été exportées avec succès.", variant: "success" });
    };

    // --- Export PDF ---
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Liste des Camions", 14, 20);
        doc.setFontSize(10);

        doc.autoTable({
            startY: 30,
            head: [["Immat.", "Type", "Modèle", "Statut", "Exp. CG", "Exp. Assur.", "Exp. VT"]],
            body: filteredCamions.map(c => [
                c.immatriculation, 
                c.type, 
                c.marquemodele, 
                c.statut, 
                c.cartegriseexpiry ? new Date(c.cartegriseexpiry).toLocaleDateString('fr-FR') : 'N/A',
                c.assuranceexpiry ? new Date(c.assuranceexpiry).toLocaleDateString('fr-FR') : 'N/A',
                c.visitetechniqueexpiry ? new Date(c.visitetechniqueexpiry).toLocaleDateString('fr-FR') : 'N/A',
            ]),
            theme: 'striped',
            styles: { fontSize: 8, overflow: 'linebreak' },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
        });
        doc.save("camions.pdf");
        toast({ title: "Export PDF", description: "Le document a été généré avec succès.", variant: "success" });
    };


    return (
        <div className="p-4 md:p-6 space-y-6">
            
            {/* --- 1. Header et Bouton Ajouter --- */}
            <ResponsiveWrapper>
                <Card className="shadow-xl bg-white/90 border border-gray-200">
                    <CardHeader className="flex flex-row justify-between items-center p-4 sm:p-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <Truck size={24} className="text-blue-600" /> Gestion de la Flotte
                        </h2>
                        <Button 
                            onClick={() => { setShowModal(true); setEditingCamion(null); setFormData(initialForm); }} 
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 transition"
                        >
                            <PlusCircle size={18} /> Ajouter camion
                        </Button>
                    </CardHeader>
                </Card>
            </ResponsiveWrapper>

            {/* --- 2. Recherche + filtres + exports (NOUVEL EMPLACEMENT) --- */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100">
                
                {/* Bloc Recherche et Filtres */}
                <div className="flex flex-wrap gap-3 items-center">
                    <Input
                        placeholder="🔍 Rechercher par immatriculation/modèle..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full sm:w-64 border-gray-300 focus:border-blue-500"
                    />
                    
                    {/* Filtre Type */}
                    <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Tous types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous types</SelectItem>
                            <SelectItem value="Benne">Benne</SelectItem>
                            <SelectItem value="Tracteur">Tracteur</SelectItem>
                            <SelectItem value="Remorque">Remorque</SelectItem>
                            <SelectItem value="Semi remorque">Semi remorque</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    {/* Filtre Statut */}
                    <Select value={filterStatut} onValueChange={(v) => { setFilterStatut(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Tous statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Tous statuts</SelectItem>
                            <SelectItem value="Disponible">Disponible</SelectItem>
                            <SelectItem value="En maintenance">En maintenance</SelectItem>
                            <SelectItem value="Indisponible">Indisponible</SelectItem>
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

            {/* --- 3. Tableau camions --- */}
            <div className="overflow-x-auto bg-white shadow-xl rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Photo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Immatriculation</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marque/Modèle</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">Documents & Exp.</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {paginatedCamions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    <Info size={24} className="mx-auto text-gray-400 mb-2" />
                                    Aucun camion trouvé correspondant aux critères de recherche.
                                </td>
                            </tr>
                        ) : (
                            paginatedCamions.map(c => (
                                <tr key={c.id} className="hover:bg-blue-50/50 transition">
                                    {/* Photo */}
                                    <td className="p-4 text-center">
                                        {c.photoUrl ? (
                                            <img src={c.photoUrl} alt="camion" className="h-10 w-10 object-cover rounded-full shadow-md mx-auto" />
                                        ) : (
                                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-[10px] mx-auto border">
                                                No Photo
                                            </div>
                                        )}
                                    </td>

                                    {/* Infos camion */}
                                    <td className="p-4 font-semibold text-gray-700 whitespace-nowrap">{c.immatriculation}</td>
                                    <td className="p-4 text-gray-600">{c.type}</td>
                                    <td className="p-4 text-gray-600">{c.marquemodele}</td>
                                    <td className="p-4">{getStatusBadge(c.statut)}</td>

                                    {/* Documents */}
                                    <td className="p-4 text-xs space-y-1">
                                        <DocumentLink url={c.cartegriseUrl} expiryDate={c.cartegriseexpiry} name="Carte Grise" />
                                        <DocumentLink url={c.assuranceUrl} expiryDate={c.assuranceexpiry} name="Assurance" />
                                        <DocumentLink url={c.visitetechniqueUrl} expiryDate={c.visitetechniqueexpiry} name="Visite Technique" />
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-center whitespace-nowrap">
                                        <div className="flex justify-center gap-2">
                                            <Button size="icon" variant="outline" onClick={() => handleEdit(c)} className="hover:bg-blue-100 text-blue-600">
                                                <Pencil size={16} />
                                            </Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleDelete(c.id)} className="bg-red-500 hover:bg-red-600">
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
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingCamion ? "Modifier un camion" : "Créer un nouveau camion"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        
                        {/* Immatriculation et Marque/Modèle */}
                        <div className="flex gap-4">
                            <Input
                                placeholder="Immatriculation (Ex: AB-123-CD)"
                                value={formData.immatriculation}
                                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value })}
                                required
                            />
                            <Input
                                placeholder="Marque / Modèle"
                                value={formData.marquemodele}
                                onChange={(e) => setFormData({ ...formData, marquemodele: e.target.value })}
                                required
                            />
                        </div>
                        
                        {/* Type et Statut */}
                        <div className="flex gap-4">
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Type de Camion *" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Benne">Benne</SelectItem>
                                    <SelectItem value="Tracteur">Tracteur</SelectItem>
                                    <SelectItem value="Remorque">Remorque</SelectItem>
                                    <SelectItem value="Semi remorque">Semi remorque</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={formData.statut} onValueChange={(v) => setFormData({ ...formData, statut: v })}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Statut *" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Disponible">Disponible</SelectItem>
                                    <SelectItem value="En maintenance">En maintenance</SelectItem>
                                    <SelectItem value="Indisponible">Indisponible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fichiers et Expiration */}
                        <h3 className="text-lg font-semibold border-b pb-1 mt-6 text-gray-700">Documents et Expiration</h3>
                        <p className="text-sm text-gray-500 italic">Laissez vide si vous ne souhaitez pas mettre à jour le fichier.</p>

                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            {/* Photo */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="flex items-center gap-2 text-sm font-medium"><Camera size={16} /> Photo du Camion:</label>
                                <Input type="file" onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })} className="col-span-1" />
                            </div>

                            {/* Carte Grise */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="flex items-center gap-2 text-sm font-medium"><FileText size={16} /> Carte Grise (PDF/Image):</label>
                                <Input type="file" onChange={(e) => setFormData({ ...formData, cartegrise: e.target.files[0] })} className="col-span-1" />
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar size={16} /> Exp. Carte Grise:</label>
                                <Input type="date" value={formData.cartegriseexpiry} onChange={(e) => setFormData({ ...formData, cartegriseexpiry: e.target.value })} className="col-span-1" />
                            </div>
                            
                            {/* Assurance */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="flex items-center gap-2 text-sm font-medium"><FileText size={16} /> Assurance (PDF/Image):</label>
                                <Input type="file" onChange={(e) => setFormData({ ...formData, assurance: e.target.files[0] })} className="col-span-1" />
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar size={16} /> Exp. Assurance:</label>
                                <Input type="date" value={formData.assuranceexpiry} onChange={(e) => setFormData({ ...formData, assuranceexpiry: e.target.value })} className="col-span-1" />
                            </div>

                            {/* Visite Technique */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <label className="flex items-center gap-2 text-sm font-medium"><FileText size={16} /> Visite Technique (PDF/Image):</label>
                                <Input type="file" onChange={(e) => setFormData({ ...formData, visitetechnique: e.target.files[0] })} className="col-span-1" />
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-600"><Calendar size={16} /> Exp. Visite Tech.:</label>
                                <Input type="date" value={formData.visitetechniqueexpiry} onChange={(e) => setFormData({ ...formData, visitetechniqueexpiry: e.target.value })} className="col-span-1" />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setShowModal(false)} disabled={uploading}>Annuler</Button>
                        <Button onClick={handleSubmit} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                            {uploading ? (
                                <><Loader2 size={18} className="animate-spin mr-2" /> En cours...</>
                            ) : (
                                editingCamion ? "Sauvegarder les modifications" : "Créer le camion"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}