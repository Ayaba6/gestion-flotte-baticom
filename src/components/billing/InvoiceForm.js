// src/components/billing/InvoiceForm.js
import React, { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import { generateInvoicePDF } from "./InvoiceGenerator.js";
import SummaryTableModal from "./SummaryTableModal.js";
import ItemsTableModal from "./ItemsTableModal.js";
import { Button } from "../ui/button.js";

export default function InvoiceForm({ isOpen, onClose }) {
  // Infos facture
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientRCCM, setClientRCCM] = useState("");
  const [clientIFU, setClientIFU] = useState("");
  const [clientTel, setClientTel] = useState("");
  const [objet, setObjet] = useState("");
  const [periode, setPeriode] = useState("");

  // Données des tableaux
  const [summaryData, setSummaryData] = useState([]);
  const [itemsData, setItemsData] = useState([]);

  // Modals des tableaux
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);

  // URL PDF pour prévisualisation
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // --- HOOK DE GÉNÉRATION PDF ---
  useEffect(() => {
    if (!isOpen) return; // On ne fait rien si modal fermé
    if (invoiceNumber || clientName || summaryData.length || itemsData.length) {
      const invoiceData = {
        invoiceNumber,
        clientName,
        clientAddress,
        clientRCCM,
        clientIFU,
        clientTel,
        objet,
        periode,
        summaryData,
        itemsData,
      };
      const doc = generateInvoicePDF(invoiceData);
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
    }
  }, [
    isOpen,
    invoiceNumber,
    clientName,
    clientAddress,
    clientRCCM,
    clientIFU,
    clientTel,
    objet,
    periode,
    summaryData,
    itemsData,
  ]);

  if (!isOpen) return null;

  const handleGeneratePDF = () => {
    const invoiceData = {
      invoiceNumber,
      clientName,
      clientAddress,
      clientRCCM,
      clientIFU,
      clientTel,
      objet,
      periode,
      summaryData,
      itemsData,
    };
    const doc = generateInvoicePDF(invoiceData);
    doc.save(`${invoiceNumber || "facture"}.pdf`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh]">
        {/* En-tête */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
            <FileText className="text-blue-600" /> Nouvelle Facture
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
            <X size={22} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Numéro de facture</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: N001-08/BAT/2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Nom du client</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: ETS NAABISSIS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Adresse complète</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Ex: 07 BP 5710 OUAGADOUGOU 07"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">RCCM</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={clientRCCM}
                onChange={(e) => setClientRCCM(e.target.value)}
                placeholder="Ex: BF OUA 01 2023 AIO 04307"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">IFU</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={clientIFU}
                onChange={(e) => setClientIFU(e.target.value)}
                placeholder="Ex: 00200091L"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Téléphone</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={clientTel}
                onChange={(e) => setClientTel(e.target.value)}
                placeholder="Ex: 76 11 04 21 / 70 54 09 55"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Objet</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
              placeholder="Ex: Transport de Minerai Ore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Période</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              placeholder="Ex: 26/07/2025 au 25/08/2025"
            />
          </div>

          {/* Boutons modals */}
          <div className="flex flex-wrap gap-3 pt-3">
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Remplir Tableau Résumé
            </button>
            <button
              onClick={() => setIsItemsModalOpen(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Remplir Tableau Détails
            </button>
          </div>
        </div>

        {/* Bouton génération PDF */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={handleGeneratePDF}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Générer le PDF
          </Button>
          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Aperçu PDF
            </a>
          )}
        </div>

        {/* Modals */}
        <SummaryTableModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          onUpdate={setSummaryData}
        />
        <ItemsTableModal
          isOpen={isItemsModalOpen}
          onClose={() => setIsItemsModalOpen(false)}
          onUpdate={setItemsData}
        />
      </div>
    </div>
  );
}
