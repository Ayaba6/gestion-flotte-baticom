// src/components/billing/InvoiceForm.js
import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient.js";

export default function InvoiceForm({ isOpen, onClose, refresh }) {
  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !amount || !dueDate) return alert("Veuillez remplir tous les champs");

    setLoading(true);
    const { error } = await supabase.from("invoices").insert([
      { client_name: clientName, amount: Number(amount), due_date: dueDate, status: "pending" }
    ]);

    setLoading(false);

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message);
    } else {
      setClientName("");
      setAmount("");
      setDueDate("");
      onClose();
      refresh(); // rafraîchir la liste
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 text-lg"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Nouvelle facture</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom du client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {loading ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
