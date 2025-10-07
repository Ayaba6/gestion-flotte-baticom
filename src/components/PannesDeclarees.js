import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, CheckCircle, Clock, Bell, X, MapPin, Truck, Calendar, Layers, Activity } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function PannesDeclarees() {
    const [pannes, setPannes] = useState([]);
    const [filter, setFilter] = useState("toutes");
    const [search, setSearch] = useState("");
    const [newCount, setNewCount] = useState(0);
    const [selectedPanne, setSelectedPanne] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    // 💡 Fonction utilitaire pour le rendu du statut
    const renderStatut = (statut) => {
        switch (statut) {
            case "resolu":
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <CheckCircle size={14} /> Résolu
                    </span>
                );
            case "en_cours":
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                        <Clock size={14} /> En cours
                    </span>
                );
            case "signale":
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                        <Activity size={14} /> Signalé
                    </span>
                );
        }
    };

    // 💡 Fonction utilitaire pour le rendu de la gravité
    const renderGravite = (gravite) => {
        if (!gravite) return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">N/A</span>;
        const baseClass = "px-3 py-1 text-xs font-medium rounded-full";
        switch (gravite.toLowerCase()) {
            case "critique":
                return <span className={`${baseClass} bg-red-100 text-red-700`}>Critique</span>;
            case "moyenne":
                return <span className={`${baseClass} bg-orange-100 text-orange-700`}>Moyenne</span>;
            case "faible":
            default:
                return <span className={`${baseClass} bg-gray-100 text-gray-700`}>Faible</span>;
        }
    };
    
    // 💡 Rendu de l'URL de la photo (pour l'affichage et le modal)
    const getPhotoUrl = (panne) => {
        if (!panne.photo) return null;
        // Utilisez getPublicUrl pour obtenir l'URL du fichier dans le bucket "pannes"
        const { data } = supabase.storage.from("pannes").getPublicUrl(panne.photo);
        return data.publicUrl;
    };


    useEffect(() => {
        const fetchPannes = async () => {
            const { data, error } = await supabase
                .from("alertespannes")
                // Assurez-vous d'avoir 'gravite' dans la table alertespannes
                .select(`*, chauffeur:users(id,email,name)`) 
                .order("created_at", { ascending: false });

            if (error) console.error(error);
            else setPannes(data);
        };
        fetchPannes();

        const pannesChannel = supabase
            .channel("pannes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alertespannes" },
                (payload) => {
                    setPannes(prev => [payload.new, ...prev]);
                    setNewCount(prev => prev + 1);
                    toast(`Nouvelle panne : ${payload.new.typepanne}`, { duration: 5000 });
                }
            )
            .subscribe();

        return () => supabase.removeChannel(pannesChannel);
    }, []);

    const updateStatut = async (id, newStatut) => {
        const { error } = await supabase
            .from("alertespannes")
            .update({ statut: newStatut })
            .eq("id", id);

        if (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour du statut.");
        }
        else {
            setPannes(prev => prev.map(p => (p.id === id ? { ...p, statut: newStatut } : p)));
            toast.success(`Statut mis à jour à "${newStatut}"`);
        }
    };

    const openPhotoModal = (panne) => {
        setSelectedPanne(panne);
        setShowPhotoModal(true);
    };

    const filteredPannes = pannes.filter((p) => {
        const matchFilter = filter === "toutes" ? true : p.statut === filter;
        const matchSearch =
            (p.mission_id?.toString() || "").includes(search.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
            (p.typepanne || "").toLowerCase().includes(search.toLowerCase()) ||
            (p.chauffeur?.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (p.chauffeur?.name || "").toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />

            {/* HEADER ET NOTIFICATION */}
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-200">
                <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                    <Bell className="w-8 h-8 text-red-600" /> Gestion des Pannes Déclarées
                </h2>
                {newCount > 0 && (
                    <div className="flex items-center bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                        <Activity size={18} className="mr-2 animate-pulse" />
                        {newCount} nouvelles alertes !
                    </div>
                )}
            </div>

            {/* BARRE DE FILTRES ET RECHERCHE */}
            <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                {/* Filtres Statut */}
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {["toutes", "en_cours", "resolu"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full font-semibold border-2 transition whitespace-nowrap ${
                                filter === f
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            {f === "toutes" ? "Toutes les pannes" : f === "en_cours" ? "En cours" : "Résolues"}
                        </button>
                    ))}
                </div>

                {/* Champ de recherche */}
                <div className="relative w-full md:w-1/3 min-w-[250px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher (chauffeur, type, description...)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                    />
                </div>
            </div>

            {/* TABLEAU DES PANNES */}
            <div className="overflow-x-auto bg-white rounded-xl shadow-2xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600 tracking-wider">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Chauffeur</th>
                            <th className="p-4">Mission</th>
                            <th className="p-4">Type / Gravité</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Statut</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredPannes.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center p-8 text-gray-500 italic">
                                    Aucune panne trouvée pour les filtres actuels.
                                </td>
                            </tr>
                        ) : (
                            filteredPannes.map(p => {
                                // ⭐️ CORRECTION: Déclaration de la variable 'photoUrl' pour l'utiliser dans ce contexte
                                const photoUrl = getPhotoUrl(p);

                                // Rendu de la date
                                const date = new Date(p.created_at);
                                const dateDisplay = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                                const timeDisplay = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/50 transition">
                                        
                                        {/* Date */}
                                        <td className="p-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} className="text-gray-400" /> {dateDisplay}
                                            </span>
                                            <span className="text-xs text-gray-500 block">{timeDisplay}</span>
                                        </td>
                                        
                                        {/* Chauffeur */}
                                        <td className="p-4 text-sm text-gray-800 font-semibold whitespace-nowrap">
                                            {p.chauffeur?.name || p.chauffeur?.email || "Inconnu"}
                                        </td>
                                        
                                        {/* Mission */}
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                            <Truck size={14} className="inline mr-1 text-blue-500" /> {p.mission_id || "N/A"}
                                        </td>
                                        
                                        {/* Type / Gravité */}
                                        <td className="p-4 text-sm text-gray-800">
                                            <div className="font-semibold">{p.typepanne || "Non spécifié"}</div>
                                            {renderGravite(p.gravite)}
                                        </td>
                                        
                                        {/* Description & Position */}
                                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                                            {p.description}
                                            {p.latitude && p.longitude && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} // Lien Google Maps corrigé
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1 mt-1 text-xs"
                                                >
                                                    <MapPin size={14} /> Voir position
                                                </a>
                                            )}
                                            {photoUrl && (
                                                <button
                                                    onClick={() => openPhotoModal(p)}
                                                    className="text-blue-600 hover:underline flex items-center gap-1 mt-1 text-xs"
                                                >
                                                    <Layers size={14} /> Voir photo
                                                </button>
                                            )}
                                        </td>
                                        
                                        {/* Statut */}
                                        <td className="p-4 text-sm">
                                            {renderStatut(p.statut)}
                                        </td>
                                        
                                        {/* Action */}
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <div className="flex flex-col space-y-2">
                                                {p.statut !== "resolu" && (
                                                    <button
                                                        onClick={() => updateStatut(p.id, "resolu")}
                                                        className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition"
                                                    >
                                                        Marquer résolu
                                                    </button>
                                                )}
                                                {p.statut !== "en_cours" && (
                                                    <button
                                                        onClick={() => updateStatut(p.id, "en_cours")}
                                                        className="px-3 py-1 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 text-sm font-medium transition"
                                                    >
                                                        Prendre en charge
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL PHOTO */}
            {showPhotoModal && selectedPanne && getPhotoUrl(selectedPanne) && (
                <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-3xl w-full relative shadow-2xl">
                        <button
                            onClick={() => setShowPhotoModal(false)}
                            className="absolute -top-3 -right-3 bg-white p-1 rounded-full text-gray-700 hover:bg-gray-100 transition shadow-lg"
                        >
                            <X size={28} />
                        </button>
                        <h3 className="text-xl font-bold mb-3">Photo de la panne ({selectedPanne.typepanne})</h3>
                        <img
                            // ⭐️ Utilisation de getPhotoUrl(selectedPanne) ici aussi pour garantir la portée
                            src={getPhotoUrl(selectedPanne)} 
                            alt="Panne en gros plan"
                            className="w-full h-auto object-contain rounded-lg max-h-[80vh]"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}