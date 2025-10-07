// src/components/AlertesExpiration.js (CORRIGÉ)
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, Clock, Filter, User, Truck, AlertTriangle, CheckCircle, X, Calendar } from "lucide-react";

export default function AlertesExpiration() {
    const [alertes, setAlertes] = useState([]);
    const [chauffeurs, setChauffeurs] = useState({});
    const [camions, setCamions] = useState({});
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    // 💡 Fonction pour récupérer les données et les mapper (inchangée)
    useEffect(() => {
        const fetchData = async () => {
            // 1. Récup alertes
            const { data: alertesData, error: alertesError } = await supabase
                .from("alertesexpiration")
                .select("*")
                .order("expirationdate", { ascending: true });

            if (alertesError) {
                console.error(alertesError);
                return;
            }

            // 2. Récup utilisateurs (chauffeurs)
            const { data: usersData } = await supabase
                .from("users")
                .select("id, name, email");

            // 3. Récup camions
            const { data: camionsData } = await supabase
                .from("camions")
                .select("id, immatriculation, type");

            // 4. Maps
            const chauffeurMap = {};
            (usersData || []).forEach((u) => {
                chauffeurMap[u.id] = u.name || u.email || "Chauffeur inconnu";
            });

            const camionMap = {};
            (camionsData || []).forEach((c) => {
                camionMap[c.id] = { 
                    immatriculation: c.immatriculation || "Camion inconnu",
                    type: c.type || ""
                };
            });

            setChauffeurs(chauffeurMap);
            setCamions(camionMap);
            setAlertes(alertesData || []);
        };

        fetchData();
    }, []);

    const filteredAlertes = alertes.filter((a) => {
        // ⭐️ CORRECTION 1 : Utilisation du chaînage optionnel `?.` pour éviter l'erreur
        const camionImmatriculation = camions[a.camionid]?.immatriculation || "Inconnu";
        const chauffeurName = chauffeurs[a.chauffeurid] || "Inconnu";

        const target = a.chauffeurid
            ? chauffeurName
            : a.camionid
                ? camionImmatriculation
                : "Inconnu";

        // 1. Appliquer filtre type
        const isChauffeur = !!a.chauffeurid;
        const isCamion = !!a.camionid;
        
        let matchFilter = true;
        if (filterType === "chauffeurs" && !isChauffeur) matchFilter = false;
        if (filterType === "camions" && !isCamion) matchFilter = false;

        // 2. Appliquer recherche texte
        const matchSearch =
            target.toLowerCase().includes(search.toLowerCase()) ||
            (a.type || "").toLowerCase().includes(search.toLowerCase());

        return matchFilter && matchSearch;
    });

    // 💡 Fonction getBadge (inchangée)
    const getBadge = (expiration) => {
        const today = new Date();
        const date = new Date(expiration);
        const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

        if (diff < 0) return { text: "Expiré", icon: <X size={16} />, color: "bg-red-600 text-white shadow-md" };
        if (diff <= 7)
            return { text: `${diff} j. restants`, icon: <AlertTriangle size={16} />, color: "bg-red-100 text-red-700 border border-red-200" };
        if (diff <= 30)
            return { text: `${diff} j. restants`, icon: <AlertTriangle size={16} />, color: "bg-orange-100 text-orange-700 border border-orange-200" };
        if (diff <= 90)
            return { text: `${diff} j. restants`, icon: <Clock size={16} />, color: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
        
        return { text: `Long terme`, icon: <CheckCircle size={16} />, color: "bg-green-100 text-green-700 border border-green-200" };
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-yellow-600" /> Alertes Expirations
                </h2>
            </div>

            {/* BARRE DE RECHERCHE + FILTRE */}
            <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                
                {/* Recherche */}
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par chauffeur, immatriculation ou document..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                    />
                </div>

                {/* Sélecteur de filtre */}
                <div className="flex items-center gap-3">
                    <Filter className="text-gray-600" size={20} />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border-2 border-gray-300 rounded-full px-4 py-2 font-medium bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                    >
                        <option value="all">Tous les types</option>
                        <option value="chauffeurs">Chauffeurs (permis, visite médicale...)</option>
                        <option value="camions">Camions (assurances, contrôle technique...)</option>
                    </select>
                </div>
            </div>

            {/* TABLEAU */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600 tracking-wider">
                        <tr>
                            <th className="p-4">Cible</th>
                            <th className="p-4">Type de document</th>
                            <th className="p-4">Date d'expiration</th>
                            <th className="p-4">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAlertes.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-8 text-gray-500 italic">
                                    Aucune alerte d'expiration trouvée pour les filtres actuels.
                                </td>
                            </tr>
                        ) : (
                            filteredAlertes.map((a) => {
                                const badge = getBadge(a.expirationdate);
                                
                                const isChauffeur = !!a.chauffeurid;
                                
                                // ⭐️ CORRECTION 2 : Utilisation du chaînage optionnel `?.` pour l'affichage aussi
                                const targetName = isChauffeur 
                                    ? chauffeurs[a.chauffeurid]
                                    : camions[a.camionid]?.immatriculation;
                                
                                const camionType = camions[a.camionid]?.type;

                                const targetIcon = isChauffeur 
                                    ? <User size={16} className="text-blue-500" />
                                    : <Truck size={16} className="text-green-500" />;
                                
                                const dateDisplay = new Date(a.expirationdate).toLocaleDateString('fr-FR', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                });

                                return (
                                    <tr key={a.id} className="hover:bg-yellow-50/50 transition">
                                        
                                        {/* Cible (Chauffeur / Camion) */}
                                        <td className="p-4 text-sm text-gray-800 font-semibold whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {targetIcon} 
                                                <span>{targetName || "Inconnu"}</span>
                                            </div>
                                            {a.camionid && camionType && (
                                                <span className="text-xs text-gray-500 block ml-6">
                                                    {camionType}
                                                </span>
                                            )}
                                        </td>
                                        
                                        {/* Type document */}
                                        <td className="p-4 text-sm text-gray-700">
                                            {a.type || "Document inconnu"}
                                        </td>
                                        
                                        {/* Date d'expiration */}
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} className="text-gray-400" />
                                                {dateDisplay || "-"}
                                            </span>
                                        </td>
                                        
                                        {/* Statut (Badge) */}
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
                                            >
                                                {badge.icon}
                                                {badge.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}