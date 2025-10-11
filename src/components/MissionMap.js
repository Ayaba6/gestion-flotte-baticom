// src/components/MissionMap.js
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../services/supabaseClient.js";
import truckIconImg from "../assets/truck.png";

const truckIcon = new L.Icon({
  iconUrl: truckIconImg,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function MissionMap({ chauffeurId, depart, arrivee }) {
  const [positions, setPositions] = useState([]);
  const [center, setCenter] = useState(
    depart ? [depart.lat, depart.lng] : [12.37, -1.53] // Par défaut : Ouagadougou
  );

  // Charger les positions initiales
  useEffect(() => {
    if (!chauffeurId) return;
    fetchPositions();

    // 🔴 Abonnement Supabase Realtime
    const channel = supabase
      .channel("mission-positions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "position" },
        (payload) => {
          const newPos = payload.new;
          if (newPos && newPos.chauffeur_id === chauffeurId) {
            setPositions((prev) => [...prev, newPos]);
            setCenter([newPos.latitude, newPos.longitude]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chauffeurId]);

  async function fetchPositions() {
    const { data, error } = await supabase
      .from("position")
      .select("latitude, longitude, created_at")
      .eq("chauffeur_id", chauffeurId)
      .order("created_at", { ascending: true });

    if (!error && data?.length) {
      setPositions(data);
      setCenter([data[data.length - 1].latitude, data[data.length - 1].longitude]);
    }
  }

  const path = positions.map((pos) => [pos.latitude, pos.longitude]);

  return (
    <div className="w-full h-80 rounded-lg overflow-hidden shadow-inner border mt-4">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Départ */}
        {depart && (
          <Marker position={[depart.lat, depart.lng]}>
            <Popup>📍 Départ</Popup>
          </Marker>
        )}

        {/* Arrivée */}
        {arrivee && (
          <Marker position={[arrivee.lat, arrivee.lng]}>
            <Popup>🎯 Destination</Popup>
          </Marker>
        )}

        {/* Position actuelle */}
        {positions.length > 0 && (
          <Marker
            position={path[path.length - 1]}
            icon={truckIcon}
          >
            <Popup>🚚 Position actuelle</Popup>
          </Marker>
        )}

        {/* Trajet parcouru */}
        {path.length > 1 && (
          <Polyline positions={path} color="blue" weight={5} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
}
