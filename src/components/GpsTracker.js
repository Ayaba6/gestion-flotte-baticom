// src/components/GpsTracker.js
import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function GpsTracker() {
  useEffect(() => {
    let watchId;

    async function startTracking() {
      // On récupère l’utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Lancer la géolocalisation en temps réel
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy, heading, speed } = position.coords;

            // Insérer la position dans Supabase
            const { error } = await supabase.from("positions").insert({
              chauffeur_id: user.id,
              latitude,
              longitude,
              accuracy,
              heading,
              speed
            });

            if (error) {
              console.error("Erreur insertion position :", error.message);
            }
          },
          (err) => console.error("Erreur GPS :", err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return null; // Ce composant n’affiche rien, il tourne en arrière-plan
}
