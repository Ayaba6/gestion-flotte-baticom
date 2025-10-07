// src/components/billing/ExpensesList.js
import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient.js";
import { Search, Truck, DollarSign, Calendar, Tag, Plus, Edit } from "lucide-react";

export default function ExpensesList({ expenses = [], refresh, onAdd }) {
    const [search, setSearch] = useState("");
    const [camions, setCamions] = useState([]);
    const [filtered, setFiltered] = useState(expenses || []);
    
    // Récupération des camions (gardé pour l'autonomie du composant)
    useEffect(() => {
        const fetchCamions = async () => {
            const { data } = await supabase.from("camions").select("id, immatriculation");
            setCamions(data || []);
        };
        fetchCamions();
    }, []);

    // Fonction de formatage de la devise (FCFA)
    const currencyFormatter = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(Number(amount || 0));
    };

    // Trouver l'immatriculation du camion
    const getCamionImmat = (camionId) => {
        return camions.find((c) => c.id === camionId)?.immatriculation || "Générale / N/A";
    };

    // Logique de filtrage
    useEffect(() => {
        setFiltered(
            (expenses || []).filter((exp) => {
                const immat = getCamionImmat(exp?.camion_id);
                return (
                    (exp?.description || "").toLowerCase().includes(search.toLowerCase()) ||
                    (immat || "").toLowerCase().includes(search.toLowerCase())
                );
            })
        );
    }, [search, expenses, camions]);

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
            
            {/* Barre de recherche et bouton d'ajout */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-1/3 min-w-[250px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par description ou immatriculation..."
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                <button 
                    onClick={onAdd} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 transition w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> Ajouter une dépense
                </button>
            </div>

            {/* Tableau des dépenses */}
            <div className="overflow-x-auto">
                {(filtered || []).length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <DollarSign size={40} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">
                            Aucune dépense trouvée pour votre recherche ou pour la période.
                        </p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600 tracking-wider">
                            <tr>
                                {/* 💡 On peut mettre des icônes dans les TH si on veut, mais ce n'est pas nécessaire */}
                                <th className="p-4 flex items-center gap-1">
                                    <Calendar size={14} /> Date
                                </th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Camion</th>
                                <th className="p-4">Montant</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(filtered || []).map((exp) =>
                                exp ? (
                                    <tr key={exp.id} className="text-sm hover:bg-red-50/50 transition">
                                        
                                        {/* Date (Fixé : suppression de flex et icône) */}
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(exp.date).toLocaleDateString('fr-FR')}
                                        </td>
                                        
                                        {/* Description (Fixé : suppression de flex et icône) */}
                                        <td className="p-4 font-semibold text-gray-800">
                                            {exp.description || "N/A"}
                                        </td>
                                        
                                        {/* Camion */}
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                <Truck size={14} className="text-gray-500" />
                                                {getCamionImmat(exp.camion_id)}
                                            </span>
                                        </td>
                                        
                                        {/* Montant */}
                                        <td className="p-4 font-bold text-red-600 whitespace-nowrap">
                                            {currencyFormatter(exp.amount)}
                                        </td>
                                        
                                        {/* Actions */}
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <button 
                                                onClick={() => console.log('Ouvrir l\'édition pour:', exp.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                                                title="Modifier la dépense"
                                            >
                                                <Edit size={14} /> Éditer
                                            </button>
                                        </td>
                                    </tr>
                                ) : null
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}