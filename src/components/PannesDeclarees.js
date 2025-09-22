import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { Search, CheckCircle, Clock, Bell, X } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

export default function PannesDeclarees() {
  const [pannes, setPannes] = useState([]);
  const [filter, setFilter] = useState("toutes");
  const [search, setSearch] = useState("");
  const [newCount, setNewCount] = useState(0);
  const [selectedPanne, setSelectedPanne] = useState(null); // 🔹 Pour le modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    const fetchPannes = async () => {
      const { data, error } = await supabase
        .from("alertespannes")
        .select(`*, chauffeur:users(id,email)`)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setPannes(data);
    };
    fetchPannes();

    const pannesChannel = supabase
      .channel("pannes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alertespannes" },
        (payload) => {
          setPannes(prev => [payload.new, ...prev]);
          setNewCount(prev => prev + 1);
          toast(`Nouvelle panne déclarée par ${payload.new.chauffeur_id}`, { duration: 5000 });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(pannesChannel);
  }, []);

  const updateStatut = async (id, newStatut) => {
    const { error } = await supabase
      .from("alertespannes")
      .update({ statut: newStatut })
      .eq("id", id);

    if (error) console.error(error);
    else setPannes(prev => prev.map(p => (p.id === id ? { ...p, statut: newStatut } : p)));
  };

  const openPhotoModal = (panne) => {
    setSelectedPanne(panne);
    setShowPhotoModal(true);
  };

  const filteredPannes = pannes.filter((p) => {
    const matchFilter = filter === "toutes" ? true : p.statut === filter;
    const matchSearch =
      (p.mission_id?.toString() || "").includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.typepanne || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.chauffeur?.email || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-red-600" /> Pannes déclarées
        </h2>
        {newCount > 0 && (
          <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm">
            {newCount} nouvelles
          </span>
        )}
      </div>

      {/* Barre de filtres et recherche */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-3">
          {["toutes", "en_cours", "resolu"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-semibold border transition ${
                filter === f
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {f === "toutes" ? "Toutes" : f === "en_cours" ? "En cours" : "Résolues"}
            </button>
          ))}
        </div>

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

      {/* Tableau */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-200">
        <table className="min-w-full">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Mission</th>
              <th className="p-3">Chauffeur</th>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">Position GPS</th>
              <th className="p-3">Photo</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPannes.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500 italic">
                  Aucune panne trouvée
                </td>
              </tr>
            ) : (
              filteredPannes.map(p => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-semibold">{p.mission_id || "N/A"}</td>
                  <td className="p-3">{p.chauffeur?.email || "Inconnu"}</td>
                  <td className="p-3">{p.typepanne}</td>
                  <td className="p-3">{p.description}</td>
                  <td className="p-3">
                    {p.latitude && p.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                      </a>
                    ) : "Non renseignée"}
                  </td>
                  <td className="p-3">
                    {p.photo ? (
                      <img
                        src={supabase.storage.from("pannes").getPublicUrl(p.photo).data.publicUrl}
                        alt="Panne"
                        className="w-20 h-20 object-cover rounded cursor-pointer"
                        onClick={() => openPhotoModal(p)}
                      />
                    ) : "Non fournie"}
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

      {/* Modal photo */}
      {showPhotoModal && selectedPanne && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full relative">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-2 right-2 text-gray-700 hover:text-gray-900"
            >
              <X size={24} />
            </button>
            <img
              src={supabase.storage.from("pannes").getPublicUrl(selectedPanne.photo).data.publicUrl}
              alt="Panne"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
