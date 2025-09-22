// src/components/ResumeSection.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Truck, Users, ClipboardList, AlertCircle, FileText } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";

const isValidPosition = (pos) =>
  pos && typeof pos.lat === "number" && typeof pos.lng === "number";

export default function ResumeSection() {
  const navigate = useNavigate();

  const [camions, setCamions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [alertesPannes, setAlertesPannes] = useState([]);
  const [alertesExpirations, setAlertesExpirations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: camionsData } = await supabase.from("camions").select("*");
      setCamions(camionsData || []);

      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .eq("role", "chauffeur");
      setChauffeurs(usersData || []);

      const { data: missionsData } = await supabase.from("missions").select("*");
      setMissions(missionsData || []);

      const { data: pannesData } = await supabase
        .from("alertesPannes")
        .select("*, chauffeur:users(id, email)")
        .order("created_at", { ascending: false });
      setAlertesPannes(pannesData || []);

      const { data: expirationsData } = await supabase.from("alertesExpirations").select("*");
      setAlertesExpirations(expirationsData || []);
    };

    fetchData();
  }, []);

  const missionsEnCours = missions.filter((m) => m.statut === "en_cours");
  const missionsTerminees = missions.filter((m) => m.statut === "terminee");

  return (
    <div className="space-y-8 mx-[15px]">
      <h2 className="text-3xl font-bold mb-4">Résumé Superviseur</h2>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.05 }} className="bg-blue-100 p-6 rounded-2xl shadow-md text-center border border-gray-200">
          <Truck className="mx-auto text-blue-600" size={32} />
          <h3 className="text-xl font-semibold mt-2">Camions</h3>
          <p className="text-3xl text-blue-600 mt-1">{camions.length}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="bg-green-100 p-6 rounded-2xl shadow-md text-center border border-gray-200">
          <Users className="mx-auto text-green-600" size={32} />
          <h3 className="text-xl font-semibold mt-2">Chauffeurs</h3>
          <p className="text-3xl text-green-600 mt-1">{chauffeurs.length}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="bg-purple-100 p-6 rounded-2xl shadow-md text-center border border-gray-200">
          <ClipboardList className="mx-auto text-purple-600" size={32} />
          <h3 className="text-xl font-semibold mt-2">Missions en cours</h3>
          <p className="text-3xl text-purple-600 mt-1">{missionsEnCours.length}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100 p-6 rounded-2xl shadow-md text-center border border-gray-200">
          <ClipboardList className="mx-auto text-gray-600" size={32} />
          <h3 className="text-xl font-semibold mt-2">Missions terminées</h3>
          <p className="text-3xl text-gray-600 mt-1">{missionsTerminees.length}</p>
        </motion.div>
      </div>

      {/* Alertes Pannes et Expirations côte à côte avec hover dynamique et icônes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertes Pannes */}
        <div
          className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-blue-50"
          onClick={() => navigate("/pannesdeclarees")}
        >
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <AlertCircle size={24} className="text-red-500" /> Alertes Pannes
          </h3>
          <ul className="space-y-2">
            {alertesPannes.length === 0 ? (
              <li className="text-gray-500">Aucune panne récente</li>
            ) : (
              <>
                {alertesPannes.slice(0, 3).map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span className="font-semibold">{a.typePanne || "Panne"}</span>
                    <span className="text-gray-500 text-sm">{a.description}</span>
                  </li>
                ))}
                {alertesPannes.length > 3 && (
                  <li className="text-blue-600 text-sm text-right">Voir toutes les pannes →</li>
                )}
              </>
            )}
          </ul>
        </div>

        {/* Alertes Documents / Expirations */}
        <div
          className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-green-50"
          onClick={() => navigate("/alertes-expirations")}
        >
          <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
            <FileText size={24} className="text-green-600" /> Alertes Documents
          </h3>
          <ul className="space-y-2">
            {alertesExpirations.length === 0 ? (
              <li className="text-gray-500">Aucune expiration récente</li>
            ) : (
              <>
                {alertesExpirations.slice(0, 3).map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{a.chauffeur}</span>
                    <span className="text-gray-500 text-sm">{a.message}</span>
                  </li>
                ))}
                {alertesExpirations.length > 3 && (
                  <li className="text-blue-600 text-sm text-right">Voir toutes les expirations →</li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Carte des missions */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold mb-4">📍 Position des camions</h3>
        <MapContainer center={[12.3714, -1.5197]} zoom={12} className="h-[400px] w-full rounded-xl shadow-md">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {missionsEnCours.map((m) => {
            if (!isValidPosition(m.position)) return null;
            return (
              <Marker
                key={`mission-${m.id}`}
                position={[m.position.lat, m.position.lng]}
                icon={L.icon({
                  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
                  iconSize: [30, 30],
                })}
              >
                <Popup>
                  <strong>{m.chauffeur || "Chauffeur inconnu"}</strong>
                  <br />
                  Camion: {m.camion || "Inconnu"}
                  <br />
                  Statut: 🚚 En mission
                </Popup>
              </Marker>
            );
          })}
          {camions.map((c) => {
            if (!isValidPosition(c.position)) return null;
            return (
              <Marker
                key={`camion-${c.id}`}
                position={[c.position.lat, c.position.lng]}
                icon={L.icon({
                  iconUrl: "https://cdn-icons-png.flaticon.com/512/1995/1995500.png",
                  iconSize: [25, 25],
                })}
              >
                <Popup>
                  <strong>{c.nom || "Camion inconnu"}</strong>
                  <br />
                  Statut: 🅿️ Stationné
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
