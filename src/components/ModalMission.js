import React, { useState, useCallback, useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Button } from "../components/ui/button.js";
import { toast } from "react-hot-toast";
import {
  X,
  MapPin,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
  CalendarDays,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import ModalPanne from "./ModalPanne.js";

// --- GLOBAL GPS WATCHER ID ---
let positionWatcherId = null;

// --- Badge de statut de mission ---
const MissionStatusBadge = ({ statut }) => {
  const statusMap = {
    terminee: { label: "Terminée", color: "bg-green-500", icon: CheckCircle },
    en_cours: { label: "En Cours", color: "bg-yellow-500", icon: Clock },
    a_venir: { label: "À Venir", color: "bg-blue-500", icon: CalendarDays },
    default: { label: statut, color: "bg-gray-500", icon: AlertTriangle },
  };
  const { label, color, icon: Icon } = statusMap[statut] || statusMap.default;

  return (
    <span
      className={`px-3 py-1 inline-flex items-center gap-2 text-sm font-bold rounded-full ${color} text-white shadow-sm`}
    >
      <Icon size={14} /> {label.toUpperCase()}
    </span>
  );
};

export default function ModalMission({ mission, onClose, refreshMissions }) {
  const [showPanneModal, setShowPanneModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [camion, setCamion] = useState(null);

  const isMissionTerminee = mission.statut === "terminee";
  const isMissionAVenir = mission.statut === "a_venir";
  const isMissionEnCours = mission.statut === "en_cours";

  // --- Récupérer les infos du camion ---
  useEffect(() => {
    if (!mission?.camion_id) return;
    const fetchCamion = async () => {
      const { data, error } = await supabase
        .from("camions")
        .select("immatriculation")
        .eq("id", mission.camion_id)
        .single();
      if (error) console.error(error);
      else setCamion(data);
    };
    fetchCamion();
  }, [mission]);

  // --- Fonction pour envoyer les coordonnées au serveur ---
  const sendLocationToSupabase = useCallback(
    async (position) => {
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      if (latitude && longitude) {
        const { error } = await supabase.from("positions").insert({
          mission_id: mission.id_uuid,
          chauffeur_id: mission.chauffeur_id,
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
        });
        if (error) console.error("Erreur position:", error);
      }
    },
    [mission.id_uuid, mission.chauffeur_id]
  );

  // --- Démarrer ou arrêter le suivi GPS ---
  const toggleGpsTracking = useCallback(
    (startTracking) => {
      if (!navigator.geolocation) return console.error("Géolocalisation non supportée.");

      if (startTracking && positionWatcherId === null) {
        positionWatcherId = navigator.geolocation.watchPosition(
          (position) => sendLocationToSupabase(position),
          (error) => {
            console.error("Erreur GPS:", error);
            if (error.code === 1) toast.error("Activez la localisation pour le suivi.");
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      } else if (!startTracking && positionWatcherId !== null) {
        navigator.geolocation.clearWatch(positionWatcherId);
        positionWatcherId = null;
      }
    },
    [sendLocationToSupabase]
  );

  // --- Hook pour lancer le suivi si mission déjà en cours ---
  useEffect(() => {
    if (isMissionEnCours) toggleGpsTracking(true);
    return () => toggleGpsTracking(false);
  }, [isMissionEnCours, toggleGpsTracking]);

  // --- Démarrer la mission ---
  const handleDemarrerMission = useCallback(async () => {
    if (!isMissionAVenir) return toast.error("Impossible de démarrer cette mission.");

    setIsUpdating(true);
    const { error } = await supabase
      .from("missions")
      .update({ statut: "en_cours" })
      .eq("id_uuid", mission.id_uuid);
    setIsUpdating(false);

    if (error) return toast.error("Échec du démarrage de la mission.");

    toggleGpsTracking(true);
    toast.success("Mission démarrée !");
    refreshMissions?.();
    onClose();
  }, [mission, isMissionAVenir, refreshMissions, onClose, toggleGpsTracking]);

  // --- Terminer la mission ---
  const handleTerminerMission = useCallback(async () => {
    if (!isMissionEnCours) return toast.error("Seules les missions en cours peuvent être terminées.");

    setIsUpdating(true);
    const { error } = await supabase
      .from("missions")
      .update({ statut: "terminee" })
      .eq("id_uuid", mission.id_uuid);
    setIsUpdating(false);

    if (error) return toast.error("Erreur lors de la finalisation de la mission.");

    toggleGpsTracking(false);
    toast.success("Mission terminée !");
    refreshMissions?.();
    onClose();
  }, [mission, isMissionEnCours, refreshMissions, onClose, toggleGpsTracking]);

  if (!mission) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-red-600 p-2 rounded-full"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="mb-6 border-b pb-4 border-gray-100">
            <h2 className="text-3xl font-extrabold">{mission.titre}</h2>
            <div className="mt-2">
              <MissionStatusBadge statut={mission.statut} />
            </div>
          </div>

          {/* Détails trajet */}
          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col items-center flex-1 text-center pr-2">
                <MapPin size={22} className="text-blue-600 mb-1" />
                <p className="text-xs font-semibold text-gray-500">DÉPART</p>
                <p className="text-sm font-medium text-gray-800">{mission.depart}</p>
              </div>
              <ArrowRight size={28} className="text-gray-400 mx-2 hidden sm:block" />
              <div className="flex flex-col items-center flex-1 text-center pl-2">
                <MapPin size={22} className="text-blue-600 mb-1" />
                <p className="text-xs font-semibold text-gray-500">DESTINATION</p>
                <p className="text-sm font-medium text-gray-800">{mission.destination}</p>
              </div>
            </div>

            {/* Ressources */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm font-semibold text-gray-500">RESSOURCES</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                  <Truck size={18} className="text-gray-600" />
                  <span className="font-medium text-sm">
                    Camion: {camion?.immatriculation || mission.camion_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md border border-gray-200">
                  <Truck size={18} className="text-gray-600" />
                  <span className="font-medium text-sm">
                    Remorque: {mission.remorque_id || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="pt-4">
              <p className="text-sm font-semibold text-gray-500 mb-1">NOTES</p>
              <p className="text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-200 text-sm italic">
                {mission.description || "Aucune description fournie."}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-4 border-t border-gray-100">
            {isMissionAVenir && (
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
                onClick={handleDemarrerMission}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Préparation...
                  </>
                ) : (
                  <>
                    <PlayCircle size={20} /> Démarrer la mission
                  </>
                )}
              </Button>
            )}

            {isMissionEnCours && (
              <>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2"
                  disabled={isUpdating}
                  onClick={() => setShowPanneModal(true)}
                >
                  <AlertTriangle size={20} /> Déclarer une panne
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2"
                  onClick={handleTerminerMission}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Finalisation...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} /> Terminer la mission
                    </>
                  )}
                </Button>
              </>
            )}

            {isMissionTerminee && (
              <p className="text-center w-full text-lg text-green-600 font-semibold py-2">
                ✅ Mission Complète
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🚨 Modal Panne */}
      {showPanneModal && (
        <ModalPanne
          missionId={mission.id_uuid}
          onClose={() => setShowPanneModal(false)}
        />
      )}
    </>
  );
}
