// src/components/billing/InvoicesList.js
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
import { Search, FileText, Download, Edit, Plus, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabaseClient.js";
import { useToast } from "../ui/use-toast.js";

export default function InvoicesList({ invoices = [], refresh, onAdd }) {
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState(invoices || []);
  const { toast } = useToast();

  // 🔍 Filtrage intelligent
  useEffect(() => {
    setFiltered(
      (invoices || []).filter((inv) =>
        [inv?.client_name, inv?.amount, inv?.id, inv?.status]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, invoices]);

  // 💰 Format devise
  const currencyFormatter = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(Number(amount || 0));

  // 🎨 Statut coloré
  const renderStatut = (status) => {
    const baseClass = "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full";
    switch (status?.toLowerCase()) {
      case "payee":
      case "payée":
        return <span className={`${baseClass} bg-green-100 text-green-700`}><CheckCircle size={14}/> Payée</span>;
      case "en_attente":
        return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}><Clock size={14}/> En attente</span>;
      case "annulee":
      case "annulée":
        return <span className={`${baseClass} bg-gray-100 text-gray-700`}><XCircle size={14}/> Annulée</span>;
      default:
        return <span className={`${baseClass} bg-blue-100 text-blue-700`}>{status || "N/A"}</span>;
    }
  };

  // 🧾 PDF
  const generatePDF = (invoice) => {
    const doc = new jsPDF("p", "mm", "a4");
    const img = new Image();
    img.src = logo;

    const generate = () => {
      doc.addImage(img, "PNG", 14, 10, 40, 20);
      doc.setFontSize(22);
      doc.setTextColor("#1E3A8A");
      doc.setFont("helvetica", "bold");
      doc.text(`FACTURE N° ${invoice.id}`, 190, 20, { align: "right" });
      doc.line(14, 30, 196, 30);

      doc.setFontSize(12);
      doc.text("Facture à :", 14, 42);
      doc.setFont("helvetica", "bold");
      doc.text(invoice.client_name || "Client Inconnu", 14, 48);

      autoTable(doc, {
        startY: 65,
        head: [["Description", "Montant (FCFA)"]],
        body: [[invoice.description || "Service", currencyFormatter(invoice.amount)]],
        theme: "striped",
        styles: { fontSize: 11 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.text("TOTAL :", 140, finalY);
      doc.setTextColor("#10B981");
      doc.text(currencyFormatter(invoice.amount), 190, finalY, { align: "right" });
      doc.save(`facture-${invoice.id}.pdf`);
    };

    img.onload = generate;
    img.onerror = generate;
  };

  // ✅ Marquer comme payée
  const markAsPaid = async (id) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "payée" })
      .eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de marquer comme payée", variant: "destructive" });
    } else {
      toast({ title: "Facture mise à jour", description: "La facture a été marquée comme payée." });
      refresh();
    }
  };

  // 🗑️ Suppression
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: "Suppression impossible", variant: "destructive" });
    } else {
      toast({ title: "Supprimée", description: "La facture a été supprimée." });
      refresh();
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
      {/* Barre de recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
          <input
            type="text"
            placeholder="Rechercher une facture..."
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 transition w-full md:w-auto justify-center"
        >
          <Plus size={18}/> Nouvelle facture
        </button>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {(filtered || []).length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <FileText size={40} className="mx-auto text-gray-400 mb-3"/>
            <p className="text-gray-600 font-medium">Aucune facture trouvée.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Créée le</th>
                <th className="p-4">Échéance</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-blue-50/40 transition">
                  <td className="p-4 font-semibold text-gray-800">{inv.client_name || "N/A"}</td>
                  <td className="p-4 font-bold text-green-600 whitespace-nowrap">{currencyFormatter(inv.amount)}</td>
                  <td className="p-4 text-gray-600">{new Date(inv.date_created).toLocaleDateString("fr-FR")}</td>
                  <td className="p-4 text-gray-600">{new Date(inv.due_date).toLocaleDateString("fr-FR")}</td>
                  <td className="p-4">{renderStatut(inv.status)}</td>
                  <td className="p-4 text-center whitespace-nowrap space-x-1">
                    {/* PDF */}
                    <button
                      onClick={() => generatePDF(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                      title="Télécharger PDF"
                    >
                      <Download size={14}/> PDF
                    </button>
                    {/* Payée */}
                    <button
                      onClick={() => markAsPaid(inv.id)}
                      disabled={inv.status?.toLowerCase() === "payee" || inv.status?.toLowerCase() === "payée"}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border ${
                        inv.status?.toLowerCase().includes("pay") 
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                          : "border-green-600 text-green-700 hover:bg-green-50"
                      } transition`}
                      title="Marquer comme payée"
                    >
                      <CheckCircle size={14}/> Payée
                    </button>
                    {/* Supprimer */}
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-red-500 text-red-600 hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
