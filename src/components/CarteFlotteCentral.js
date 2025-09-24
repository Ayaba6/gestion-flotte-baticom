// src/components/CarteFlotteCentral.js
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../services/supabaseClient.js";
import CarteFlotte from "./CarteFlotte.js";
import { toast } from "react-hot-toast";

export default function CarteFlotteCentral() {
  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [loading, setLoading] = useState(true);

  const center = useMemo(() => [12.37, -1.53], []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Camions
        const { data: camionsData } = await supabase.from("camions").select("*");
        setCamions(camionsData || []);

        // Chauffeurs et positions
        const { data: usersData } = await supabase.from("users").select("*");
        const { data: positionsData } = await supabase.from("positions").select("*");

        const chauffeursData = usersData
          .filter(u => u.role === "chauffeur")
          .map(chauffeur => {
            const lastPos = positionsData
              .filter(p => p.chauffeur_id === chauffeur.id)
              .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
            return {
              ...chauffeur,
              latitude: lastPos?.latitude,
              longitude: lastPos?.longitude
            };
          });
        setChauffeurs(chauffeursData);

        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        toast.error("Erreur lors du chargement de la flotte");
      }
    };

    fetchData();

    // Realtime camions
    const camionsChannel = supabase
      .channel("camions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "camions" }, (payload) => {
        setCamions(prev => {
          const idx = prev.findIndex(c => c.id === payload.new.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = payload.new;
            return updated;
          } else {
            return [payload.new, ...prev];
          }
        });
      })
      .subscribe();

    // Realtime positions chauffeurs
    const positionsChannel = supabase
      .channel("positions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "positions" }, (payload) => {
        setChauffeurs(prev =>
          prev.map(c =>
            c.id === payload.new.chauffeur_id
              ? { ...c, latitude: payload.new.latitude, longitude: payload.new.longitude }
              : c
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(camionsChannel);
      supabase.removeChannel(positionsChannel);
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-80">Chargement de la flotte...</div>;
  }

  return <CarteFlotte camions={camions} chauffeurs={chauffeurs} />;
}
