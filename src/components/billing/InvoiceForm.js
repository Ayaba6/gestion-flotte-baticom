// src/components/billing/InvoiceForm.js
import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient.js";
import { X, FileText, Loader2, DollarSign, User, Calendar } from "lucide-react";
import { toast } from "react-hot-toast"; // Assurez-vous d'avoir installé et configuré react-hot-toast

export default function InvoiceForm({ isOpen, onClose, refresh }) {
    const [clientName, setClientName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!clientName || !amount || !dueDate) {
            toast.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Le montant doit être un nombre positif.");
            return;
        }

        setLoading(true);
        
        const { error } = await supabase.from("invoices").insert([
            { client_name: clientName, amount: Number(amount), due_date: dueDate, status: "en_attente" } // Utilisation du statut 'en_attente' cohérent
        ]);

        setLoading(false);

        if (error) {
            console.error("Erreur lors de l'ajout:", error);
            toast.error("Erreur lors de l'ajout de la facture: " + error.message);
        } else {
            // Réinitialisation du formulaire
            setClientName("");
            setAmount("");
            setDueDate("");
            
            toast.success(`Facture pour ${clientName} ajoutée avec succès!`);
            onClose();
            refresh(); // rafraîchir la liste
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-2xl w-full max-w-lg relative shadow-2xl transform transition-transform duration-300 scale-100">
                
                {/* Bouton de fermeture */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                    aria-label="Fermer"
                >
                    <X size={24} />
                </button>
                
                {/* Titre */}
                <div className="flex items-center gap-3 mb-6 border-b pb-3">
                    <FileText size={28} className="text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Ajouter une nouvelle facture</h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Nom du client */}
                    <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Nom du client (obligatoire)"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition"
                            required
                        />
                    </div>
                    
                    {/* Montant */}
                    <div className="relative">
                        <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            placeholder="Montant (FCFA)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition"
                            min="1"
                            required
                        />
                    </div>
                    
                    {/* Date d'échéance */}
                    <div className="relative">
                        <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition"
                            required
                        />
                    </div>
                    
                    {/* Boutons d'action */}
                    <div className="flex justify-end pt-2 space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                            ) : (
                                "Enregistrer la facture"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}