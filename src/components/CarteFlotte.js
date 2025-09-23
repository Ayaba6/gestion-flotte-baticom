// src/components/CarteFlotte.js
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fonction pour adapter la vue aux positions
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

export default function CarteFlotte({ camions = [], chauffeurs = [] }) {
  // On choisit la liste à utiliser : camions si présents, sinon chauffeurs
  const data = camions.length > 0 ? camions : chauffeurs;
  const positions = data
    .filter((c) => c.latitude && c.longitude)
    .map((c) => [c.latitude, c.longitude]);

  return (
    <MapContainer center={[12.37, -1.53]} zoom={13} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {data
        .filter((c) => c.latitude && c.longitude)
        .map((c, idx) => (
          <Marker key={c.id || idx} position={[c.latitude, c.longitude]}>
            <Popup>
              {c.immatriculation || c.nom || c.id} <br />
              Statut: {c.statut || "N/A"}
            </Popup>
          </Marker>
        ))}
      <FitBounds positions={positions} />
    </MapContainer>
  );
}
