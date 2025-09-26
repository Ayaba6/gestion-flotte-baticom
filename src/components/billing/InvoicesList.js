import React, { useState, useEffect } from "react";

export default function InvoicesList({ invoices = [], refresh, onAdd }) {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(invoices || []);

  useEffect(() => {
    setFiltered(
      (invoices || []).filter(
        (inv) =>
          (inv?.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (inv?.amount || "").toString().includes(search)
      )
    );
  }, [search, invoices]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher une facture..."
          className="border p-2 rounded w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={onAdd} className="bg-green-600 text-white px-4 py-2 rounded shadow">
          + Ajouter une facture
        </button>
      </div>

      {(filtered || []).length === 0 ? (
        <p>Aucune facture trouvée.</p>
      ) : (
        <table className="w-full border-collapse border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Client</th>
              <th className="border px-3 py-2">Montant</th>
              <th className="border px-3 py-2">Date</th>
              <th className="border px-3 py-2">Statut</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filtered || []).map((inv) =>
              inv ? (
                <tr key={inv.id} className="text-sm">
                  <td className="border px-3 py-2">{inv.client_name}</td>
                  <td className="border px-3 py-2">{inv.amount} FCFA</td>
                  <td className="border px-3 py-2">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="border px-3 py-2">{inv.status}</td>
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
