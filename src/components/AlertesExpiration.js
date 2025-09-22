// src/components/AlertesExpiration.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, Clock, Filter } from "lucide-react";

export default function AlertesExpiration() {
  const [alertes, setAlertes] = useState([]);
  const [chauffeurs, setChauffeurs] = useState({});
  const [camions, setCamions] = useState({});
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | chauffeurs | camions

  useEffect(() => {
    const fetchData = async () => {
      // 1. Récup alertes
      const { data: alertesData, error: alertesError } = await supabase
        .from("alertesexpiration")
        .select("*")
        .order("expirationdate", { ascending: true });

      if (alertesError) {
        console.error(alertesError);
        return;
      }

      // 2. Récup chauffeurs
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email");

      // 3. Récup camions
      const { data: camionsData } = await supabase
        .from("camions")
        .select("id, immatriculation");

      // 4. Maps
      const chauffeurMap = {};
      (usersData || []).forEach((u) => {
        chauffeurMap[u.id] = u.name || u.email || "Chauffeur inconnu";
      });

      const camionMap = {};
      (camionsData || []).forEach((c) => {
        camionMap[c.id] = c.immatriculation || "Camion inconnu";
      });

      setChauffeurs(chauffeurMap);
      setCamions(camionMap);
      setAlertes(alertesData || []);
    };

    fetchData();
  }, []);

  const filteredAlertes = alertes.filter((a) => {
    const label =
      chauffeurs[a.chauffeurid] || camions[a.camionid] || "Inconnu";

    // 1. Appliquer filtre type
    if (filterType === "chauffeurs" && !a.chauffeurid) return false;
    if (filterType === "camions" && !a.camionid) return false;

    // 2. Appliquer recherche texte
    return (
      label.toLowerCase().includes(search.toLowerCase()) ||
      (a.type || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const getBadge = (expiration) => {
    const today = new Date();
    const date = new Date(expiration);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: "❌ Expiré", color: "bg-red-600 text-white" };
    if (diff <= 30)
      return { text: `⚠ ${diff} jours`, color: "bg-red-100 text-red-700" };
    if (diff <= 60)
      return { text: `⚠ ${diff} jours`, color: "bg-yellow-100 text-yellow-700" };
    return { text: `✓ ${diff} jours`, color: "bg-green-100 text-green-700" };
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Clock className="text-yellow-500" /> Alertes Expirations
      </h2>

      {/* Barre de recherche + filtre */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par chauffeur, camion ou document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Sélecteur de filtre */}
        <div className="flex items-center gap-2">
          <Filter className="text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded-xl px-3 py-2 focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">Tous</option>
            <option value="chauffeurs">Chauffeurs</option>
            <option value="camions">Camions</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Chauffeur / Camion</th>
              <th className="p-3">Type document</th>
              <th className="p-3">Expiration</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlertes.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center p-6 text-gray-500 italic"
                >
                  Aucune alerte d'expiration trouvée
                </td>
              </tr>
            ) : (
              filteredAlertes.map((a) => {
                const badge = getBadge(a.expirationdate);
                const label =
                  chauffeurs[a.chauffeurid] || camions[a.camionid] || "Inconnu";

                return (
                  <tr key={a.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-semibold">{label}</td>
                    <td className="p-3">{a.type || "Document inconnu"}</td>
                    <td className="p-3">
                      {new Date(a.expirationdate).toLocaleDateString() || "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
