// src/components/AlertesExpiration.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, Clock } from "lucide-react";

export default function AlertesExpiration() {
  const [alertes, setAlertes] = useState([]);
  const [search, setSearch] = useState("");

  // 🔹 Charger les alertes expirations
  useEffect(() => {
    const fetchAlertes = async () => {
      const { data, error } = await supabase
        .from("alertesExpirations")
        .select("*")
        .order("expirationDate", { ascending: true });

      if (error) console.error(error);
      else setAlertes(data || []);
    };

    fetchAlertes();
  }, []);

  // 🔹 Filtrer par recherche (chauffeur ou type)
  const filteredAlertes = alertes.filter((a) => {
    return (
      a.chauffeur?.toLowerCase().includes(search.toLowerCase()) ||
      a.type?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // 🔹 Calcul badge couleur
  const getBadge = (expiration) => {
    const today = new Date();
    const date = new Date(expiration);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "❌ Expiré";
    if (diff === 0) return "⚠ Expire aujourd'hui";
    if (diff <= 7) return `⚠ ${diff} jours`;
    return `${diff} jours`;
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Clock className="text-yellow-500" /> Alertes Expirations
      </h2>

      {/* 🔹 Barre de recherche */}
      <div className="relative w-full md:w-1/3 mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher par chauffeur ou document..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* 🔹 Tableau des expirations */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Chauffeur</th>
              <th className="p-3">Type document</th>
              <th className="p-3">Expiration</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlertes.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center p-6 text-gray-500 italic">
                  Aucune alerte d'expiration trouvée
                </td>
              </tr>
            ) : (
              filteredAlertes.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-semibold">{a.chauffeur || "Inconnu"}</td>
                  <td className="p-3">{a.type || "Document inconnu"}</td>
                  <td className="p-3">
                    {new Date(a.expirationDate).toLocaleDateString() || "-"}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                      {getBadge(a.expirationDate)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
