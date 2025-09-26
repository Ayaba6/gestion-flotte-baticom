import React, { useEffect, useState } from "react";
import Tabs from "../components/ui/tabs.js";
import InvoicesList from "../components/billing/InvoicesList.js";
import ExpensesList from "../components/billing/ExpensesList.js";
import FinanceChart from "../components/billing/FinanceChart.js";
import InvoiceForm from "../components/billing/InvoiceForm.js";
import ExpenseForm from "../components/billing/ExpenseForm.js";
import { supabase } from "../services/supabaseClient.js";

export default function BillingExpenses() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ invoices: 0, expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  // États pour modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: inv } = await supabase.from("invoices").select("*");
      const { data: exp } = await supabase.from("expenses").select("*");

      const invData = inv || [];
      const expData = exp || [];

      setInvoices(invData);
      setExpenses(expData);

      const totalInvoices = invData.reduce((acc, f) => acc + Number(f?.amount || 0), 0);
      const totalExpenses = expData.reduce((acc, d) => acc + Number(d?.amount || 0), 0);

      setTotals({
        invoices: totalInvoices,
        expenses: totalExpenses,
        balance: totalInvoices - totalExpenses,
      });
    } catch (err) {
      console.error("Erreur fetch billing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Facturation & Dépenses</h1>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-xl p-6 border">
          <h3 className="text-gray-500 text-sm">Total Factures</h3>
          <p className="text-2xl font-bold text-green-600">{totals.invoices.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 border">
          <h3 className="text-gray-500 text-sm">Total Dépenses</h3>
          <p className="text-2xl font-bold text-red-600">{totals.expenses.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 border">
          <h3 className="text-gray-500 text-sm">Solde Net</h3>
          <p className={`text-2xl font-bold ${totals.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {totals.balance.toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* Graphique */}
      {loading ? <p>Chargement des graphiques...</p> : <FinanceChart invoices={invoices} expenses={expenses} />}

      {/* Modals */}
      <InvoiceForm isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} refresh={fetchData} />
      <ExpenseForm isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} refresh={fetchData} camions={[]} />

      {/* Tabs Factures / Dépenses */}
      <Tabs
        defaultValue="invoices"
        tabs={[
          {
            label: "Factures",
            value: "invoices",
            content: invoices.length ? (
              <InvoicesList invoices={invoices} refresh={fetchData} onAdd={() => setIsInvoiceModalOpen(true)} />
            ) : (
              <p>Aucune facture disponible.</p>
            ),
          },
          {
            label: "Dépenses",
            value: "expenses",
            content: expenses.length ? (
              <ExpensesList expenses={expenses} refresh={fetchData} onAdd={() => setIsExpenseModalOpen(true)} />
            ) : (
              <p>Aucune dépense disponible.</p>
            ),
          },
        ]}
      />
    </div>
  );
}
