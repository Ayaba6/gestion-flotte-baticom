// src/components/AlertesExpiration.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, Clock, Filter, User, Truck, AlertTriangle, CheckCircle, X, Calendar } from "lucide-react";
import { Button } from "../components/ui/button.js";
import { Card, CardHeader } from "../components/ui/card.js";
import { useToast } from "../components/ui/use-toast.js";

export default function AlertesExpiration() {
    const { toast } = useToast();

    const [alertes, setAlertes] = useState([]);
    const [chauffeurs, setChauffeurs] = useState({});
    const [camions, setCamions] = useState({});
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatut, setFilterStatut] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // 🔄 Charger les alertes, chauffeurs et camions
    useEffect(() => {
        const fetchData = async () => {
            const { data: alertesData } = await supabase
                .from("alertesexpiration")
                .select("*")
                .order("expirationdate", { ascending: true });

            const { data: usersData } = await supabase
                .from("users")
                .select("id, name, email");

            const { data: camionsData } = await supabase
                .from("camions")
                .select("id, immatriculation, type");

            const chauffeurMap = {};
            (usersData || []).forEach(u => {
                chauffeurMap[u.id] = u.name || u.email || "Chauffeur inconnu";
            });

            const camionMap = {};
            (camionsData || []).forEach(c => {
                camionMap[c.id] = { immatriculation: c.immatriculation || "Camion inconnu", type: c.type || "" };
            });

            setChauffeurs(chauffeurMap);
            setCamions(camionMap);
            setAlertes(alertesData || []);
        };

        fetchData();
    }, []);

    // 🔹 Badge statut
    const getBadge = (expiration, statut, createdAt) => {
        const today = new Date();
        const date = new Date(expiration);
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
        const isNew = (new Date() - new Date(createdAt)) < 24 * 60 * 60 * 1000;

        if (statut === "traite") return { text: "Traité", icon: <CheckCircle size={16} />, color: "bg-gray-200 text-gray-700" };
        if (diff < 0) return { text: "Expiré", icon: <X size={16} />, color: "bg-red-600 text-white shadow-md" };
        if (diff <= 7) return { text: `${diff} j. restants${isNew ? " • Nouveau" : ""}`, icon: <AlertTriangle size={16} />, color: "bg-red-100 text-red-700 border border-red-200" };
        if (diff <= 30) return { text: `${diff} j. restants${isNew ? " • Nouveau" : ""}`, icon: <AlertTriangle size={16} />, color: "bg-orange-100 text-orange-700 border border-orange-200" };
        if (diff <= 90) return { text: `${diff} j. restants${isNew ? " • Nouveau" : ""}`, icon: <Clock size={16} />, color: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
        return { text: `Long terme${isNew ? " • Nouveau" : ""}`, icon: <CheckCircle size={16} />, color: "bg-green-100 text-green-700 border border-green-200" };
    };

    // 🔹 Marquer comme traité
    const markAsTraite = async (id) => {
        const { error } = await supabase.from("alertesexpiration").update({ statut: "traite" }).eq("id", id);
        if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
        else {
            setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: "traite" } : a));
            toast({ title: "Alerte traitée", description: "L'alerte a été marquée comme traitée." });
        }
    };

    // 🔍 Filtrage
    const filteredAlertes = alertes.filter(a => {
        const camionImmat = camions[a.camionid]?.immatriculation || "";
        const chauffeurName = chauffeurs[a.chauffeurid] || "";
        const target = a.chauffeurid ? chauffeurName : camionImmat;

        let matchType = true;
        if (filterType === "chauffeurs" && !a.chauffeurid) matchType = false;
        if (filterType === "camions" && !a.camionid) matchType = false;

        let matchStatut = filterStatut === "all" ? true : a.statut === filterStatut;

        const matchSearch = target.toLowerCase().includes(search.toLowerCase()) || (a.type || "").toLowerCase().includes(search.toLowerCase());

        return matchType && matchStatut && matchSearch;
    });

    const totalPages = Math.ceil(filteredAlertes.length / ITEMS_PER_PAGE);
    const paginatedAlertes = filteredAlertes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <Card className="shadow-xl bg-white/90 border border-gray-200 mb-6">
                <CardHeader className="flex justify-between items-center p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <Clock size={24} className="text-yellow-600"/> Alertes Expirations
                    </h2>
                </CardHeader>
            </Card>

            {/* Recherche + filtres */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow border border-gray-100 mb-6">
                <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                        className="border-2 border-gray-300 rounded-full px-4 py-2 font-medium bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                        <option value="all">Tous les types</option>
                        <option value="chauffeurs">Chauffeurs</option>
                        <option value="camions">Camions</option>
                    </select>
                    <select
                        value={filterStatut}
                        onChange={e => { setFilterStatut(e.target.value); setCurrentPage(1); }}
                        className="border-2 border-gray-300 rounded-full px-4 py-2 font-medium bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                        <option value="all">Tous statuts</option>
                        <option value="traite">Traité</option>
                        <option value="en_cours">En cours</option>
                        <option value="expire">Expiré</option>
                    </select>
                </div>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600 tracking-wider">
                        <tr>
                            <th className="p-4">Cible</th>
                            <th className="p-4">Type de document</th>
                            <th className="p-4">Date d'expiration</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedAlertes.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-gray-500 italic">Aucune alerte trouvée</td>
                            </tr>
                        ) : paginatedAlertes.map(a => {
                            const isChauffeur = !!a.chauffeurid;
                            const targetName = isChauffeur ? chauffeurs[a.chauffeurid] : camions[a.camionid]?.immatriculation || "Inconnu";
                            const camionType = camions[a.camionid]?.type;
                            const targetIcon = isChauffeur ? <User size={16} className="text-blue-500"/> : <Truck size={16} className="text-green-500"/>;
                            const badge = getBadge(a.expirationdate, a.statut, a.created_at);
                            const dateDisplay = new Date(a.expirationdate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });

                            return (
                                <tr key={a.id} className="hover:bg-yellow-50/50 transition">
                                    <td className="p-4 text-sm font-semibold whitespace-nowrap">
                                        <div className="flex items-center gap-2">{targetIcon}<span>{targetName}</span></div>
                                        {a.camionid && camionType && <span className="text-xs text-gray-500 block ml-6">{camionType}</span>}
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">{a.type || "Document inconnu"}</td>
                                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap flex items-center gap-1"><Calendar size={14} className="text-gray-400"/> {dateDisplay}</td>
                                    <td className="p-4"><span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>{badge.icon}{badge.text}</span></td>
                                    <td className="p-4 flex justify-center gap-2">
                                        {a.statut !== "traite" && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => markAsTraite(a.id)}>Marquer traité</Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
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
                        >
                            {i + 1}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
