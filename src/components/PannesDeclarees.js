// src/components/PannesDeclarees.js
import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, CheckCircle, Clock } from "lucide-react";

export default function PannesDeclarees() {
  const [pannes, setPannes] = useState([]);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");

  // 🔹 Charger les pannes avec info chauffeur et position
  useEffect(() => {
    const fetchPannes = async () => {
      const { data, error } = await supabase
        .from("alertesPannes")
        .select(`
          *,
          chauffeur:users(id, email)
        `)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setPannes(data);
    };
    fetchPannes();
  }, []);

  // 🔹 Filtrage par statut et recherche
  const filteredPannes = pannes.filter((p) => {
    const matchFilter = filter === "toutes" ? true : p.statut === filter;
    const matchSearch =
      p.camion?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.typePanne?.toLowerCase().includes(search.toLowerCase()) ||
      p.chauffeur?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // 🔹 Mettre à jour le statut d’une panne
  const updateStatut = async (id, newStatut) => {
    const { error } = await supabase
      .from("alertesPannes")
      .update({ statut: newStatut })
      .eq("id", id);

    if (error) console.error(error);
    else {
      setPannes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, statut: newStatut } : p))
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">🚨 Pannes déclarées</h2>

      {/* 🔹 Barre de filtres et recherche */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Filtres */}
        <div className="flex gap-3">
          {["toutes", "en_cours", "resolu"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-semibold border transition ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "toutes"
                ? "Toutes"
                : f === "en_cours"
                ? "En cours"
                : "Résolues"}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une panne..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* 🔹 Tableau des pannes */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Camion</th>
              <th className="p-3">Chauffeur</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Position GPS</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPannes.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-6 text-gray-500 italic">
                  Aucune panne trouvée
                </td>
              </tr>
            ) : (
              filteredPannes.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-semibold">{p.camion || "N/A"}</td>
                  <td className="p-3">{p.chauffeur?.email || "Inconnu"}</td>
                  <td className="p-3">{p.typePanne}</td>
                  <td className="p-3">{p.description}</td>
                  <td className="p-3">
                    {p.latitude && p.longitude
                      ? `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`
                      : "Non renseignée"}
                  </td>
                  <td className="p-3">
                    {p.statut === "resolu" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <CheckCircle size={14} /> Résolu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                        <Clock size={14} /> En cours
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {p.statut !== "resolu" && (
                      <button
                        onClick={() => updateStatut(p.id, "resolu")}
                        className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                      >
                        Marquer résolu
                      </button>
                    )}
                    {p.statut !== "en_cours" && (
                      <button
                        onClick={() => updateStatut(p.id, "en_cours")}
                        className="ml-2 px-3 py-1 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 text-sm"
                      >
                        Remettre en cours
                      </button>
                    )}
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
