// src/components/CarteFlotte.js
import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../services/supabaseClient.js";

// Icône personnalisée pour les chauffeurs
const greenIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Palette de couleurs pour les trajets
const colors = ["blue", "red", "orange", "purple", "teal", "brown", "pink", "cyan"];

export default function CarteFlotte({ chauffeurs }) {
  const [positions, setPositions] = useState([]);
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);

  const center = useMemo(() => [12.37, -1.53], []);

  // Charger les positions initiales et abonner aux changements
  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error) setPositions(data || []);
    };

    fetchPositions();

    // Abonnement en temps réel
    const channel = supabase
      .channel("positions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "positions" },
        (payload) => {
          setPositions((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Rafraîchissement toutes les 5 secondes
    const interval = setInterval(fetchPositions, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const getColorForChauffeur = (chauffeurId) => {
    const index = chauffeurs.findIndex((c) => c.id === chauffeurId);
    return colors[index % colors.length];
  };

  const getLastPosition = (chauffeurId) => {
    const trajets = positions.filter((p) => p.chauffeur_id === chauffeurId);
    return trajets.length > 0 ? trajets[trajets.length - 1] : null;
  };

  return (
    <div className="w-full h-[500px] rounded-xl shadow relative">
      {/* Menu de sélection du chauffeur */}
      <div className="absolute top-2 left-2 z-[1000] bg-white p-2 rounded shadow">
        <select
          className="border p-1 rounded"
          value={selectedChauffeur || ""}
          onChange={(e) => setSelectedChauffeur(e.target.value || null)}
        >
          <option value="">-- Voir tous les chauffeurs --</option>
          {chauffeurs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.email || c.id}
            </option>
          ))}
        </select>
      </div>

      {/* Carte Leaflet */}
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {chauffeurs
          .filter((c) => !selectedChauffeur || c.id === selectedChauffeur)
          .map((ch) => {
            const trajets = positions.filter((p) => p.chauffeur_id === ch.id);
            const polyline = trajets.map((p) => [p.latitude, p.longitude]);
            const lastPos = getLastPosition(ch.id);

            return (
              <React.Fragment key={ch.id}>
                {/* Tracé du trajet */}
                {polyline.length > 1 && (
                  <Polyline positions={polyline} color={getColorForChauffeur(ch.id)} />
                )}

                {/* Dernière position */}
                {lastPos && (
                  <Marker
                    position={[lastPos.latitude, lastPos.longitude]}
                    icon={greenIcon}
                  >
                    <Popup>
                      <div>
                        <b>Chauffeur:</b> {ch.email || ch.id} <br />
                        <b>Nom:</b> {ch.user_metadata?.nom || "N/A"} <br />
                        <b>Camion:</b> {ch.camion_id || "Non assigné"} <br />
                        <b>Dernière maj:</b>{" "}
                        {new Date(lastPos.created_at).toLocaleTimeString()}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
      </MapContainer>
    </div>
  );
}
