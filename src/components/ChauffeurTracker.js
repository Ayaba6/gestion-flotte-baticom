// src/components/ChauffeurTracker.js
import { useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";

const UPDATE_INTERVAL = 30000; // 30 sec en millisecondes

function ChauffeurTracker({ missionId, userId }) {
  useEffect(() => {
    if (!missionId || !userId) return;

    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;

          // Envoi de la position vers Supabase
          const { error } = await supabase.from("positions").insert([
            {
              chauffeur_id: userId,
              mission_id: missionId,
              latitude,
              longitude,
            },
          ]);

          if (error) {
            console.error("Erreur en envoyant la position:", error);
          } else {
            console.log("Position envoyée:", latitude, longitude);
          }
        },
        (err) => console.error("Erreur GPS:", err),
        { enableHighAccuracy: true }
      );
    }, UPDATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [missionId, userId]);

  return null; // pas d'affichage
}

export default ChauffeurTracker;
