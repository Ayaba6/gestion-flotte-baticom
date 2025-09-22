// src/components/CarteFlotte.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../services/supabaseClient.js";

// 🔹 Icône personnalisée
const camionIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function CarteFlotte() {
  const [camions, setCamions] = useState([]);

  useEffect(() => {
    const fetchCamions = async () => {
      // 🔹 Exemple : table "vehicles" avec latitude/longitude
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, immatriculation, latitude, longitude");

      if (error) {
        console.error("Erreur fetch camions:", error);
      } else {
        setCamions(data || []);
      }
    };

    fetchCamions();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🗺️ Carte de la flotte</h2>

      <MapContainer
        center={[12.3686, -1.5272]} // 🔹 par défaut Ouagadougou
        zoom={13}
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {camions.map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude || 12.3686, c.longitude || -1.5272]}
            icon={camionIcon}
          >
            <Popup>
              <b>{c.immatriculation || "Camion"}</b>
              <br />
              {c.latitude?.toFixed(5)}, {c.longitude?.toFixed(5)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
