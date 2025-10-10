// src/pages/BillingExpenses.js
import React, { useEffect, useState } from "react";
import Tabs from "../components/ui/tabs.js";
import { supabase } from "../services/supabaseClient.js";
import InvoicesList from "../components/billing/InvoicesList.js";
import ExpensesList from "../components/billing/ExpensesList.js";
import FinanceChart from "../components/billing/FinanceChart.js";
import InvoiceForm from "../components/billing/InvoiceForm.js";
import ExpenseForm from "../components/billing/ExpenseForm.js";
import { DollarSign, TrendingUp, TrendingDown, LayoutDashboard, Plus, File, FileText } from "lucide-react";
import { Button } from "../components/ui/button.js";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../components/ui/use-toast.js";

// Loading spinner pour UX
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-10 bg-white rounded-xl shadow-lg min-h-[200px]">
    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span className="ml-3 text-gray-600">Chargement des données financières...</span>
  </div>
);

export default function BillingExpenses() {
  const { toast } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [camions, setCamions] = useState([]);
  const [totals, setTotals] = useState({ invoices: 0, expenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: inv }, { data: exp }, { data: veh }] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("camions").select("id, immatriculation"),
      ]);

      setInvoices(inv || []);
      setExpenses(exp || []);
      setCamions(veh || []);

      const totalInvoices = (inv || []).reduce((acc, f) => acc + Number(f?.amount || 0), 0);
      const totalExpenses = (exp || []).reduce((acc, d) => acc + Number(d?.amount || 0), 0);

      setTotals({
        invoices: totalInvoices,
        expenses: totalExpenses,
        balance: totalInvoices - totalExpenses,
      });
    } catch (err) {
      console.error("Erreur fetch billing:", err);
      toast({ title: "Erreur", description: "Impossible de charger les données financières", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencyFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  });

  // 📊 Cartes de synthèse
  const StatCard = ({ title, value, colorClass, icon: Icon, description }) => (
    <div className={`bg-white shadow-xl rounded-2xl p-6 border-l-4 ${colorClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className={`mt-1 text-3xl font-extrabold ${colorClass.replace("border-l-4 ", "").replace("border-", "text-")}`}>
            {currencyFormatter.format(value)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClass.replace("border-l-4 border-", "bg-")} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${colorClass.replace("border-l-4 border-", "text-")}`} />
        </div>
      </div>
      {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
  );

  // 📤 Export Excel
  const exportExcel = () => {
    const wsData = [...invoices.map(i => ({ Type: "Facture", ...i })), ...expenses.map(e => ({ Type: "Dépense", ...e }))];
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finance");
    XLSX.writeFile(wb, "finance.xlsx");
    toast({ title: "Export Excel", description: "Fichier exporté avec succès." });
  };

  // 📄 Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Finance - Factures & Dépenses", 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Type", "Montant", "Camion", "Date", "Description"]],
      body: [
        ...invoices.map(i => ["Facture", currencyFormatter.format(i.amount), i.camionid || "-", new Date(i.created_at).toLocaleDateString(), i.description || "-"]),
        ...expenses.map(e => ["Dépense", currencyFormatter.format(e.amount), e.camionid || "-", new Date(e.created_at).toLocaleDateString(), e.description || "-"])
      ],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [240, 240, 240] }
    });
    doc.save("finance.pdf");
    toast({ title: "Export PDF", description: "Document généré avec succès." });
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-8">
      
      {/* EN-TÊTE & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3 mb-4 md:mb-0">
          <LayoutDashboard className="w-8 h-8 text-blue-600" /> Gestion Financière
        </h1>
        <div className="flex gap-3">
          <Button className="flex items-center gap-2 bg-green-600 text-white" onClick={() => setIsInvoiceModalOpen(true)}><Plus size={18}/> Ajouter Facture</Button>
          <Button className="flex items-center gap-2 bg-red-600 text-white" onClick={() => setIsExpenseModalOpen(true)}><Plus size={18}/> Ajouter Dépense</Button>
          <Button className="flex items-center gap-2 border border-gray-300 text-gray-700" onClick={exportExcel}><File size={16}/> Excel</Button>
          <Button className="flex items-center gap-2 border border-gray-300 text-gray-700" onClick={exportPDF}><FileText size={16}/> PDF</Button>
        </div>
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Factures" value={totals.invoices} colorClass="border-green-600" icon={TrendingUp} description="Total des revenus facturés." />
        <StatCard title="Total Dépenses" value={totals.expenses} colorClass="border-red-600" icon={TrendingDown} description="Somme des dépenses." />
        <StatCard title="Solde Net" value={totals.balance} colorClass={totals.balance >= 0 ? "border-blue-600" : "border-red-600"} icon={DollarSign} description="Factures - Dépenses." />
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Aperçu Financier</h3>
        {loading ? <LoadingSpinner /> : <FinanceChart invoices={invoices} expenses={expenses} />}
      </div>

      {/* Tabs Factures / Dépenses */}
      <Tabs
        defaultValue="invoices"
        tabs={[
          {
            label: "Factures",
            value: "invoices",
            content: loading ? <LoadingSpinner /> : (
              invoices.length ? <InvoicesList invoices={invoices} refresh={fetchData} /> :
              <div className="p-6 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-4">Aucune facture enregistrée.</p>
                <button onClick={() => setIsInvoiceModalOpen(true)} className="text-blue-600 font-medium hover:underline">Ajouter votre première facture</button>
              </div>
            ),
          },
          {
            label: "Dépenses",
            value: "expenses",
            content: loading ? <LoadingSpinner /> : (
              expenses.length ? <ExpensesList expenses={expenses} refresh={fetchData} /> :
              <div className="p-6 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                <p className="text-gray-500 mb-4">Aucune dépense enregistrée.</p>
                <button onClick={() => setIsExpenseModalOpen(true)} className="text-blue-600 font-medium hover:underline">Ajouter votre première dépense</button>
              </div>
            ),
          },
        ]}
      />

      {/* Modals */}
      <InvoiceForm isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} refresh={fetchData} />
      <ExpenseForm isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} refresh={fetchData} camions={camions} />
    </div>
  );
}
