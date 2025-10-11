// src/components/ModalPanne.js - CORRIGÉ

// Assurez-vous que tous les imports sont corrects
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient.js";
import { toast } from "react-hot-toast";
import { 
    X, 
    AlertTriangle, 
    Zap, 
    MapPin, 
    Camera, 
    Send, 
    Loader2 
} from "lucide-react";

// Types de pannes pour la sélection (Ceci est à l'extérieur, c'est correct)
const PANNE_OPTIONS = [
    { value: "mecanique", label: "Mécanique" },
    { value: "electrique", label: "Électrique" },
    { value: "crevaison", label: "Crevaison" },
    { value: "carburant", label: "Carburant" },
    { value: "autres", label: "Autres" },
];

// 🚀 DÉBUT DU COMPOSANT (Toute la logique doit être ici)
export default function ModalPanne({ missionId, onClose }) {
    // 1. DÉCLARATIONS D'ÉTAT (Hooks)
    const [typePanne, setTypePanne] = useState("");
    const [descriptionPanne, setDescriptionPanne] = useState("");
    const [photo, setPhoto] = useState(null);
    const [position, setPosition] = useState({ latitude: null, longitude: null });
    const [loading, setLoading] = useState(false);

    // 2. EFFECT (GPS)
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                    });
                },
                (err) => {
                    console.error("❌ Erreur GPS :", err);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, []);

    // 3. LOGIQUE DÉCLARATION DE PANNE (useCallback)
    const declarePanne = useCallback(async () => {
        console.log("🟢 Début de déclaration de panne...");

        if (!typePanne || !descriptionPanne) {
            toast.error("Veuillez sélectionner un type et décrire la panne !");
            return;
        }

        if (!missionId) {
             toast.error("ID de mission manquant.");
             return;
        }

        setLoading(true);
        let photoUrl = null;

        try {
            // Récupérer l'utilisateur connecté
            const { data: userData } = await supabase.auth.getUser();
            const chauffeur_id = userData?.user?.id;
            
            if (!chauffeur_id) throw new Error("Utilisateur non authentifié.");

            // Upload de la photo (si présente)
            if (photo) {
                const ext = photo.name.split(".").pop();
                const fileName = `pannes/${chauffeur_id}/${Date.now()}.${ext}`;
                
                const { error: uploadError } = await supabase.storage
                    .from("uploads")
                    .upload(fileName, photo, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("uploads")
                    .getPublicUrl(fileName);

                photoUrl = publicUrlData.publicUrl;
            }

            const { latitude, longitude } = position;

            // Insertion dans Supabase
            const { error } = await supabase.from("alertespannes").insert({
                mission_id: missionId,
                chauffeur_id,
                typepanne: typePanne,
                description: descriptionPanne,
                photo: photoUrl,
                statut: "signalee",
                latitude: latitude ?? null,
                longitude: longitude ?? null,
            });

            if (error) throw error;

            toast.success("Panne déclarée ! L'équipe de maintenance est alertée.");
            onClose();
        } catch (err) {
            console.error("❌ Erreur lors de la déclaration :", err);
            // Extraction du message d'erreur clair
            const detailedError = err.message || err.details || "Erreur de connexion ou de base de données inconnue.";
            toast.error(`Erreur: ${detailedError}`);
        } finally {
            setLoading(false);
        }
    }, [missionId, typePanne, descriptionPanne, photo, position, onClose]);

    const isGpsAvailable = position.latitude !== null && position.longitude !== null;

    // 4. RENDU JSX
    return (
        // Backdrop du modal
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div 
                // Conteneur du modal
                className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative border-t-4 border-red-600"
            >
                {/* Bouton de Fermeture */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                    aria-label="Fermer"
                >
                    <X size={24} />
                </button>

                {/* Header du Modal */}
                <div className="mb-6 flex items-center gap-3 border-b pb-3 border-gray-100">
                    <AlertTriangle size={30} className="text-red-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Déclarer une Panne</h2>
                </div>

                {/* Formulaire */}
                <div className="space-y-4">
                    {/* Type de Panne */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Zap size={16} className="text-red-500" /> Type de Panne
                        </label>
                        <select
                            value={typePanne}
                            onChange={(e) => setTypePanne(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition duration-150 text-gray-800 appearance-none"
                        >
                            <option value="" disabled>-- Choisir le type d'incident --</option>
                            {PANNE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                             Description détaillée
                        </label>
                        <textarea
                            placeholder="Décrivez la panne (nature, urgence, symptômes...)"
                            value={descriptionPanne}
                            onChange={(e) => setDescriptionPanne(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition duration-150 text-gray-800 resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Photo */}
                    <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Camera size={16} className="text-gray-500" /> Ajouter une photo (Optionnel)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhoto(e.target.files[0])}
                            className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                    </div>

                    {/* Position GPS */}
                    <div className="text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="font-semibold text-red-700 flex items-center gap-2 mb-1">
                            <MapPin size={16} /> Position GPS
                        </p>
                        <p className="text-gray-700">Latitude : <span className="font-mono">{position.latitude?.toFixed(5) ?? "En attente..."}</span></p>
                        <p className="text-gray-700">Longitude : <span className="font-mono">{position.longitude?.toFixed(5) ?? "En attente..."}</span></p>
                        {!isGpsAvailable && (
                            <p className="text-xs text-red-500 mt-1">⚠️ Veuillez autoriser l'accès à la position pour une localisation précise.</p>
                        )}
                    </div>
                </div>

                {/* Bouton d'Action */}
                <button
                    onClick={declarePanne}
                    disabled={loading || !typePanne || !descriptionPanne}
                    className={`w-full mt-6 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors duration-200 shadow-md ${
                        loading ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" /> Envoi de l'alerte...
                        </>
                    ) : (
                        <>
                            <Send size={20} /> Envoyer l'alerte Panne
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}