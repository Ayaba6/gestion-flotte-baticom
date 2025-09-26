import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient.js";

export default function ExpenseForm({ isOpen, onClose, refresh, camions = [] }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [camionId, setCamionId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDescription("");
      setAmount("");
      setDate("");
      setCamionId("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !date || !camionId)
      return alert("Veuillez remplir tous les champs");

    setLoading(true);
    const { error } = await supabase.from("expenses").insert([
      {
        description,
        amount: Number(amount),
        date,
        camion_id: camionId,
      },
    ]);
    setLoading(false);

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message);
    } else {
      refresh();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 text-lg font-bold"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Nouvelle dépense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border p-2 rounded"
          />

          {/* Select Camion */}
          <select
            value={camionId}
            onChange={(e) => setCamionId(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">Sélectionner un camion</option>
            {camions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.immatriculation || `Camion ${c.id}`}{" "}
                {c.modele ? `- ${c.modele}` : ""}
              </option>
            ))}
          </select>

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
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {loading ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
