import React, { useEffect, useState } from "react";
import Tabs from "../components/ui/tabs.js";
import InvoicesList from "../components/billing/InvoicesList.js";
import ExpensesList from "../components/billing/ExpensesList.js";
import FinanceChart from "../components/billing/FinanceChart.js";
import InvoiceForm from "../components/billing/InvoiceForm.js";
import ExpenseForm from "../components/billing/ExpenseForm.js";
import { supabase } from "../services/supabaseClient.js";
// Import des icônes pour un style amélioré
import { DollarSign, TrendingUp, TrendingDown, LayoutDashboard, Plus } from "lucide-react";

// ⚠️ Simulation d'un composant de chargement pour l'UX
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
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [camions, setCamions] = useState([]);
    const [totals, setTotals] = useState({ invoices: 0, expenses: 0, balance: 0 });
    const [loading, setLoading] = useState(true);

    // États pour modals
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Récupération simultanée pour optimiser
            const [
                { data: inv, error: invError },
                { data: exp, error: expError },
                { data: veh, error: vehError },
            ] = await Promise.all([
                supabase.from("invoices").select("*"),
                supabase.from("expenses").select("*"),
                supabase.from("camions").select("id, immatriculation"),
            ]);

            if (invError) console.error("Erreur fetch invoices:", invError);
            if (expError) console.error("Erreur fetch expenses:", expError);
            if (vehError) console.error("Erreur fetch camions:", vehError);

            const invData = inv || [];
            const expData = exp || [];

            setInvoices(invData);
            setExpenses(expData);
            setCamions(veh || []);

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

    const currencyFormatter = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF', // Code ISO pour le Franc CFA Ouest-Africain
        minimumFractionDigits: 0
    });

    // 💡 Composant Card de Synthèse réutilisable
    const StatCard = ({ title, value, colorClass, icon: Icon, description }) => (
        <div className={`bg-white shadow-xl rounded-2xl p-6 border-l-4 ${colorClass}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
                    <p className={`mt-1 text-3xl font-extrabold ${colorClass.replace('border-l-4 ', '').replace('border-', 'text-')}`}>
                        {currencyFormatter.format(value)}
                    </p>
                </div>
                <div className={`p-3 rounded-full ${colorClass.replace('border-l-4 border-', 'bg-')} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${colorClass.replace('border-l-4 border-', 'text-')}`} />
                </div>
            </div>
            {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
        </div>
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen space-y-8">
            
            {/* EN-TÊTE ET ACTIONS */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3 mb-4 md:mb-0">
                    <LayoutDashboard className="w-8 h-8 text-blue-600" /> Gestion Financière
                </h1>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 transition"
                    >
                        <Plus size={18} /> Ajouter Facture
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 transition"
                    >
                        <Plus size={18} /> Ajouter Dépense
                    </button>
                </div>
            </div>

            {/* CARTES DE SYNTHÈSE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Factures (Revenus)" 
                    value={totals.invoices} 
                    colorClass="border-green-600" 
                    icon={TrendingUp}
                    description="Total des montants facturés pour la période."
                />
                <StatCard 
                    title="Total Dépenses" 
                    value={totals.expenses} 
                    colorClass="border-red-600" 
                    icon={TrendingDown}
                    description="Somme de toutes les dépenses enregistrées."
                />
                <StatCard 
                    title="Solde Net (Bénéfice)" 
                    value={totals.balance} 
                    colorClass={totals.balance >= 0 ? "border-blue-600" : "border-red-600"} 
                    icon={DollarSign}
                    description="Calcul : Factures - Dépenses."
                />
            </div>

            {/* GRAPHIQUE OU CHARGEMENT */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Aperçu Financier</h3>
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <FinanceChart invoices={invoices} expenses={expenses} />
                )}
            </div>
            
            {/* TABS FACTURES / DÉPENSES */}
            <div className="pt-4">
                <Tabs
                    defaultValue="invoices"
                    tabs={[
                        {
                            label: "Factures",
                            value: "invoices",
                            content: loading ? <LoadingSpinner /> : invoices.length ? (
                                <InvoicesList
                                    invoices={invoices}
                                    refresh={fetchData}
                                    onAdd={() => setIsInvoiceModalOpen(true)} // Ne sert plus car bouton en haut
                                />
                            ) : (
                                <div className="p-6 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                                    <p className="text-gray-500 mb-4">Aucune facture enregistrée pour le moment.</p>
                                    <button 
                                        onClick={() => setIsInvoiceModalOpen(true)}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Cliquez ici pour ajouter la première facture.
                                    </button>
                                </div>
                            ),
                        },
                        {
                            label: "Dépenses",
                            value: "expenses",
                            content: loading ? <LoadingSpinner /> : expenses.length ? (
                                <ExpensesList
                                    expenses={expenses}
                                    refresh={fetchData}
                                    onAdd={() => setIsExpenseModalOpen(true)} // Ne sert plus car bouton en haut
                                />
                            ) : (
                                <div className="p-6 bg-white rounded-lg border border-dashed border-gray-300 text-center">
                                    <p className="text-gray-500 mb-4">Aucune dépense enregistrée pour le moment.</p>
                                    <button 
                                        onClick={() => setIsExpenseModalOpen(true)}
                                        className="text-blue-600 font-medium hover:underline"
                                    >
                                        Cliquez ici pour enregistrer la première dépense.
                                    </button>
                                </div>
                            ),
                        },
                    ]}
                />
            </div>

            {/* MODALS */}
            <InvoiceForm
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                refresh={fetchData}
            />
            <ExpenseForm
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                refresh={fetchData}
                camions={camions} 
            />
        </div>
    );
}