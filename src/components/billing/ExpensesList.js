import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient.js";

export default function ExpensesList({ expenses = [], refresh, onAdd }) {
  const [search, setSearch] = useState("");
  const [camions, setCamions] = useState([]);
  const [filtered, setFiltered] = useState(expenses || []);

  useEffect(() => {
    const fetchCamions = async () => {
      const { data } = await supabase.from("camions").select("id, immatriculation");
      setCamions(data || []);
    };
    fetchCamions();
  }, []);

  useEffect(() => {
    setFiltered(
      (expenses || []).filter((exp) => {
        const camion = camions.find((c) => c.id === exp?.camion_id);
        const immat = camion ? camion.immatriculation : "";
        return (
          (exp?.description || "").toLowerCase().includes(search.toLowerCase()) ||
          (immat || "").toLowerCase().includes(search.toLowerCase())
        );
      })
    );
  }, [search, expenses, camions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          className="border p-2 rounded w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={onAdd} className="bg-red-600 text-white px-4 py-2 rounded shadow">
          + Ajouter une dépense
        </button>
      </div>

      {(filtered || []).length === 0 ? (
        <p>Aucune dépense trouvée.</p>
      ) : (
        <table className="w-full border-collapse border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Camion</th>
              <th className="border px-3 py-2">Description</th>
              <th className="border px-3 py-2">Montant</th>
              <th className="border px-3 py-2">Date</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((exp) =>
              exp ? (
                <tr key={exp.id} className="text-sm">
                  <td className="border px-3 py-2">{camions.find((c) => c.id === exp.camion_id)?.immatriculation || "N/A"}</td>
                  <td className="border px-3 py-2">{exp.description}</td>
                  <td className="border px-3 py-2">{exp.amount} FCFA</td>
                  <td className="border px-3 py-2">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="border px-3 py-2 text-center">
                    <button className="px-2 py-1 text-xs border rounded">Voir</button>
                  </td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
