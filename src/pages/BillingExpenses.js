import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import Tabs from "../components/ui/tabs.js";

export default function BillingExpenses() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pour les formulaires
  const [newInvoice, setNewInvoice] = useState({
    mission_id: "",
    client_name: "",
    due_date: "",
    amount: "",
  });

  const [newExpense, setNewExpense] = useState({
    camion_id: "",
    category: "",
    amount: "",
    description: "",
  });

  // Charger factures et dépenses
  const fetchData = async () => {
    setLoading(true);
    const { data: invData } = await supabase
      .from("invoices")
      .select("*")
      .order("date_created", { ascending: false });
    const { data: expData } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });

    setInvoices(invData || []);
    setExpenses(expData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ajouter une facture
  const handleAddInvoice = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("invoices").insert([{
      mission_id: Number(newInvoice.mission_id),
      client_name: newInvoice.client_name,
      due_date: newInvoice.due_date,
      amount: Number(newInvoice.amount),
      status: "pending"
    }]);
    if (!error) {
      setNewInvoice({ mission_id: "", client_name: "", due_date: "", amount: "" });
      fetchData();
    } else {
      alert("Erreur lors de l'ajout de la facture");
    }
  };

  // Ajouter une dépense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("expenses").insert([{
      camion_id: newExpense.camion_id,
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description
    }]);
    if (!error) {
      setNewExpense({ camion_id: "", category: "", amount: "", description: "" });
      fetchData();
    } else {
      alert("Erreur lors de l'ajout de la dépense");
    }
  };

  if (loading) return <p className="p-4">Chargement...</p>;

  const InvoicesList = () => (
    <div className="space-y-4">
      <form onSubmit={handleAddInvoice} className="mb-4 p-4 border rounded space-y-2">
        <h3 className="font-bold mb-2">Ajouter une facture</h3>
        <input type="text" placeholder="Mission ID" className="border p-1 w-full"
          value={newInvoice.mission_id} onChange={(e) => setNewInvoice({...newInvoice, mission_id: e.target.value})} />
        <input type="text" placeholder="Nom du client" className="border p-1 w-full"
          value={newInvoice.client_name} onChange={(e) => setNewInvoice({...newInvoice, client_name: e.target.value})} />
        <input type="date" placeholder="Date d'échéance" className="border p-1 w-full"
          value={newInvoice.due_date} onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})} />
        <input type="number" placeholder="Montant" className="border p-1 w-full"
          value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Ajouter</button>
      </form>

      {invoices.length === 0 ? (
        <p>Aucune facture enregistrée.</p>
      ) : (
        invoices.map((inv) => (
          <div key={inv.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <p className="font-bold">{inv.client_name}</p>
              <p className="text-sm">Montant : {inv.amount} • Statut : {inv.status}</p>
              <p className="text-xs text-gray-500">Créée le {new Date(inv.date_created).toLocaleDateString()}</p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">Détails</button>
          </div>
        ))
      )}
    </div>
  );

  const ExpensesList = () => (
    <div className="space-y-4">
      <form onSubmit={handleAddExpense} className="mb-4 p-4 border rounded space-y-2">
        <h3 className="font-bold mb-2">Ajouter une dépense</h3>
        <input type="text" placeholder="Camion ID" className="border p-1 w-full"
          value={newExpense.camion_id} onChange={(e) => setNewExpense({...newExpense, camion_id: e.target.value})} />
        <input type="text" placeholder="Catégorie" className="border p-1 w-full"
          value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})} />
        <input type="number" placeholder="Montant" className="border p-1 w-full"
          value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
        <input type="text" placeholder="Description" className="border p-1 w-full"
          value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Ajouter</button>
      </form>

      {expenses.length === 0 ? (
        <p>Aucune dépense enregistrée.</p>
      ) : (
        expenses.map((exp) => (
          <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <p className="font-bold">{exp.category}</p>
              <p className="text-sm">Montant : {exp.amount} • {exp.description}</p>
              <p className="text-xs text-gray-500">Le {new Date(exp.date).toLocaleDateString()}</p>
            </div>
            <button className="px-3 py-1 border rounded text-sm">Détails</button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Facturation & Dépenses</h1>

      <Tabs
        defaultValue="invoices"
        tabs={[
          { label: "Factures", value: "invoices", content: <InvoicesList /> },
          { label: "Dépenses", value: "expenses", content: <ExpensesList /> },
        ]}
      />
    </div>
  );
}
