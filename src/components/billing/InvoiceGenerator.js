// src/components/billing/InvoiceGenerator.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from '../../assets/logo_entete.png';

// Fonction simple pour convertir nombre en lettres (exemple basique, tu peux utiliser une librairie pour plus de précision)
function convertNumberToWords(amount) {
  // Pour l'exemple, on met un texte fixe, mais tu peux utiliser une vraie fonction
  return "Quatre millions sept cent quatre-vingt-six mille deux cent quarante-trois";
}

export function generateInvoicePDF(invoiceData) {
  const doc = new jsPDF();

  // --- Logo et en-tête entreprise ---
  doc.addImage(logo, "PNG", 14, 10, 50, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const infoText = "BP 9342 OUAGA 06 | Tel: 25 50 81 89 / 70 00 80 24 | Mail: contact@baticom.bf";
  doc.text(infoText, 105, 35, { align: "center" });

  // --- Trait de séparation ---
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // --- Date à droite ---
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.setFontSize(11);
  doc.text(`Ouagadougou, le ${formattedDate}`, 196, 42, { align: "right" });

  // --- Titre FACTURE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FACTURE", 105, 52, { align: "center" });

  // --- Informations client ---
  let startY = 60;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.invoiceNumber, 14, startY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Doit : ${invoiceData.clientName}`, 14, startY + 6);
  let infoY = startY + 14;
  doc.text(`${invoiceData.clientAddress}, RCCM: ${invoiceData.clientRCCM}`, 14, infoY);
  infoY += 5;
  doc.text(`IFU: ${invoiceData.clientIFU}  Tel: ${invoiceData.clientTel}`, 14, infoY);
  infoY += 5;
  doc.text(`Objet: ${invoiceData.objet}`, 14, infoY);
  infoY += 5;
  doc.text(`Période: ${invoiceData.periode}`, 14, infoY);
  infoY += 10;

  // --- TABLEAU RÉSUMÉ ---
  if(invoiceData.summaryData?.length) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 128); // bleu pour libellé
    doc.text("Détails de paiement", 14, infoY);
    infoY += 5;

    autoTable(doc, {
      startY: infoY,
      head: [["Libellé", "Montant (XOF)"]],
      body: invoiceData.summaryData.map(row => [
        row.label,
        Number(row.amount)?.toLocaleString('fr-FR') || "0"
      ]),
      theme: "grid",
      headStyles: { fillColor: [220, 230, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60, halign: "center" } // chiffre centré
      },
    });

    infoY = doc.lastAutoTable.finalY + 10;
  }

  // --- TABLEAU DÉTAILS ---
  if(invoiceData.itemsData?.length) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 128); // bleu pour libellé
    doc.text("Détails contractuels", 14, infoY);
    infoY += 5;

    autoTable(doc, {
      startY: infoY,
      head: [["Description", "Prix Unitaire (XOF)", "Quantité", "Total (XOF)"]],
      body: invoiceData.itemsData.map(row => [
        row.description,
        Number(row.unitPrice)?.toLocaleString('fr-FR') || "0",
        Number(row.quantity) || "0",
        Number(row.total)?.toLocaleString('fr-FR') || "0"
      ]),
      theme: "grid",
      headStyles: { fillColor: [220, 230, 255], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 40, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 40, halign: "center" },
      },
    });

    infoY = doc.lastAutoTable.finalY + 10;
  }

  // --- TEXTE DE FIN ---
  const totalAmount = invoiceData.summaryData
    .reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  const totalInWords = convertNumberToWords(totalAmount);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 128);
  doc.text("Arrêtée la présente facture à la somme HTVA de :", 14, infoY);

  doc.setFont("helvetica", "normal");
  doc.text(`${totalInWords} (${totalAmount.toLocaleString("fr-FR")}) francs CFA.`, 14, infoY + 6);

  return doc;
}
