import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "../ui/button.js";

export default function SummaryTableModal({ isOpen, onClose, onUpdate }) {
  const [rows, setRows] = useState([{ label: "", amount: "" }]);

  if (!isOpen) return null;

  const handleAddRow = () => setRows([...rows, { label: "", amount: "" }]);
  const handleChange = (idx, field, value) => {
    const newRows = [...rows];
    newRows[idx][field] = value;
    setRows(newRows);
  };
  const handleSave = () => {
    onUpdate(rows.map(r => ({ label: r.label, amount: Number(r.amount) || 0 })));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <Plus className="text-blue-600" /> Remplir Tableau Résumé
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border rounded-md"
                placeholder="Libellé"
                value={row.label}
                onChange={e => handleChange(idx, "label", e.target.value)}
              />
              <input
                type="number"
                className="w-32 p-2 border rounded-md"
                placeholder="Montant"
                value={row.amount}
                onChange={e => handleChange(idx, "amount", e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={handleAddRow} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Ajouter ligne
          </button>
          <Button onClick={handleSave} className="bg-blue-600 text-white">Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
