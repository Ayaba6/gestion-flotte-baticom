// src/components/ChauffeurTracker.js
import { useEffect } from "react";
import { supabase } from "../services/supabaseClient.js";

function ChauffeurTracker({ missionId, userId }) {
  useEffect(() => {
    if (!missionId || !userId) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Envoyer la position à Supabase
        const { error } = await supabase.from("positions").insert([
          {
            chauffeur_id: userId,
            mission_id: missionId,
            latitude,
            longitude,
          },
        ]);

        if (error) console.error("Erreur en envoyant la position:", error);
      },
      (err) => console.error("Erreur GPS:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [missionId, userId]);

  return null; // pas d'affichage
}

export default ChauffeurTracker;
