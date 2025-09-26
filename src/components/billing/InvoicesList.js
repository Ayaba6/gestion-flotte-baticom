import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png"; // ton logo

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

  const generatePDF = (invoice) => {
    const doc = new jsPDF("p", "mm", "a4");

    // Logo
    const img = new Image();
    img.src = logo; // URL ou importé
    img.onload = () => {
      doc.addImage(img, "PNG", 14, 10, 40, 20);

      // Titre
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text("FACTURE", 150, 20, { align: "right" });

      // Infos client
      doc.setFontSize(12);
      doc.text(`Client: ${invoice.client_name}`, 14, 40);
      doc.text(`Date création: ${new Date(invoice.date_created).toLocaleDateString()}`, 14, 48);
      doc.text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, 56);
      doc.text(`Statut: ${invoice.status}`, 14, 64);

      // Tableau
      autoTable(doc, {
        startY: 75,
        head: [["Description", "Montant (FCFA)"]],
        body: [
          [
            invoice.details?.description || "—",
            `${Number(invoice.amount).toLocaleString()}`
          ]
        ],
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        bodyStyles: { textColor: 50 },
      });

      // Total
      doc.setFontSize(14);
      doc.text(
        `Total: ${Number(invoice.amount).toLocaleString()} FCFA`,
        14,
        doc.lastAutoTable.finalY + 10
      );

      // Sauvegarde
      doc.save(`facture-${invoice.id}.pdf`);
    };
  };

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
                  <td className="border px-3 py-2">{Number(inv.amount).toLocaleString()} FCFA</td>
                  <td className="border px-3 py-2">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="border px-3 py-2">{inv.status}</td>
                  <td className="border px-3 py-2 text-center space-x-2">
                    <button
                      onClick={() => generatePDF(inv)}
                      className="px-2 py-1 text-xs border rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      PDF
                    </button>
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
