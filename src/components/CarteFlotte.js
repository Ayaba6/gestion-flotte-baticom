// src/components/CarteFlotte.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../services/supabaseClient.js";

import driverIconImg from "../assets/driver.png";
import truckIconImg from "../assets/truck.png";

// Icône chauffeur
const driverIcon = new L.Icon({
  iconUrl: driverIconImg,
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Icône camion
const truckIcon = new L.Icon({
  iconUrl: truckIconImg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function CarteFlotte() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    // Charger les positions initiales
    fetchPositions();

    // Abonnement en temps réel
    const channel = supabase
      .channel("positions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "positions" },
        (payload) => {
          console.log("Changement position détecté:", payload);
          fetchPositions();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchPositions() {
    const { data, error } = await supabase
      .from("positions")
      .select("id, chauffeur_id, latitude, longitude, speed, heading, created_at");

    if (!error && data) {
      setPositions(data);
    }
  }

  return (
    <MapContainer
      center={[12.37, -1.53]} // Exemple : Ouagadougou
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {positions.map((pos) => (
        <Marker
          key={pos.id}
          position={[pos.latitude, pos.longitude]}
          icon={driverIcon}
        >
          <Popup>
            <b>Chauffeur:</b> {pos.chauffeur_id || "Inconnu"} <br />
            <b>Vitesse:</b> {pos.speed || 0} km/h <br />
            <b>Maj:</b>{" "}
            {pos.created_at ? new Date(pos.created_at).toLocaleString() : ""}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
