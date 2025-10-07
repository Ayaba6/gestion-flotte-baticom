import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png"; // ton logo
import { Search, FileText, Download, Edit, Plus, CheckCircle, Clock, XCircle } from "lucide-react"; // Import d'icônes

export default function InvoicesList({ invoices = [], refresh, onAdd }) {
    const [search, setSearch] = useState("");
    const [filtered, setFiltered] = useState(invoices || []);

    // 💡 Mise à jour des factures filtrées à chaque changement de 'invoices' ou 'search'
    useEffect(() => {
        setFiltered(
            (invoices || []).filter(
                (inv) =>
                    (inv?.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
                    (inv?.amount || "").toString().includes(search) ||
                    (inv?.id || "").toString().includes(search)
            )
        );
    }, [search, invoices]);

    // 💡 Formatage de la devise (FCFA) pour l'affichage
    const currencyFormatter = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(Number(amount || 0));
    };

    // 💡 Rendu du statut de la facture
    const renderStatut = (status) => {
        const baseClass = "inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full";
        switch (status?.toLowerCase()) {
            case "payee":
            case "payée":
                return <span className={`${baseClass} bg-green-100 text-green-700`}><CheckCircle size={14} /> Payée</span>;
            case "en_attente":
                return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}><Clock size={14} /> En attente</span>;
            case "annulee":
            case "annulée":
                return <span className={`${baseClass} bg-gray-100 text-gray-700`}><XCircle size={14} /> Annulée</span>;
            default:
                return <span className={`${baseClass} bg-blue-100 text-blue-700`}>{status || "N/A"}</span>;
        }
    };

    // 💡 Fonction de génération PDF (optimisée et stylée pour jspdf-autotable)
    const generatePDF = (invoice) => {
        const doc = new jsPDF("p", "mm", "a4");

        // Assurez-vous que l'image est chargée (important pour jsPDF)
        const img = new Image();
        img.src = logo;

        // Fonction pour continuer après le chargement du logo
        const generateContent = () => {
            // Logo
            doc.addImage(img, "PNG", 14, 10, 40, 20);

            // Titre Facture & Numéro
            doc.setFontSize(22);
            doc.setTextColor("#1E3A8A"); // Bleu foncé
            doc.setFont("helvetica", "bold");
            doc.text(`FACTURE N° ${invoice.id}`, 190, 20, { align: "right" });

            // Séparateur
            doc.setDrawColor("#D1D5DB");
            doc.line(14, 30, 196, 30);

            // Infos Client et Dates
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128); // Gris
            doc.setFont("helvetica", "normal");
            
            doc.text("FACTURE À:", 14, 40);
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(invoice.client_name || "Client Inconnu", 14, 45);

            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128); // Gris
            doc.text(`Date de création: ${new Date(invoice.date_created).toLocaleDateString()}`, 190, 40, { align: "right" });
            doc.text(`Date d'échéance: ${new Date(invoice.due_date).toLocaleDateString()}`, 190, 45, { align: "right" });
            doc.text(`Statut: ${invoice.status}`, 190, 50, { align: "right" });


            // Tableau des détails
            autoTable(doc, {
                startY: 65,
                head: [["Description", "Prix unitaire", "Qté", "Montant (FCFA)"]],
                body: [
                    [
                        invoice.details?.description || "Prestation de transport / services",
                        currencyFormatter(invoice.amount).replace('FCFA', ''), // Prix unitaire (simple pour le moment)
                        '1', // Quantité (simple pour le moment)
                        currencyFormatter(invoice.amount).replace('FCFA', '')
                    ]
                ],
                theme: "striped",
                headStyles: { 
                    fillColor: [30, 64, 175], // Bleu plus foncé
                    textColor: 255, 
                    fontStyle: 'bold'
                },
                styles: { 
                    textColor: 50, 
                    fontSize: 10,
                    cellPadding: 3
                },
                columnStyles: {
                    3: { halign: 'right' } // Alignement à droite pour le montant
                }
            });

            // Total
            const finalY = doc.lastAutoTable.finalY;
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            
            // Fond coloré pour le total
            doc.setFillColor(243, 244, 246); // Gris clair
            doc.rect(140, finalY + 5, 50, 10, 'F'); 

            doc.text("TOTAL :", 150, finalY + 11, { align: 'right' });
            doc.setTextColor("#10B981"); // Vert
            doc.text(
                `${currencyFormatter(invoice.amount)}`,
                190,
                finalY + 11,
                { align: 'right' }
            );

            // Sauvegarde
            doc.save(`facture-${invoice.client_name.replace(/\s/g, '_')}-${invoice.id}.pdf`);
        };

        // Gérer le chargement de l'image (pour éviter que l'image ne manque)
        if (img.complete) {
            generateContent();
        } else {
            img.onload = generateContent;
            img.onerror = () => {
                // Continuer même sans le logo si l'image ne charge pas
                console.error("Erreur de chargement du logo.");
                generateContent();
            };
        }
    };

    return (
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
            
            {/* Barre de recherche et bouton d'ajout */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-1/3 min-w-[250px]">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par client ou montant..."
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                
                {/* ⚠️ Le bouton onAdd est déjà géré dans BillingExpenses, mais on le garde ici pour flexibilité */}
                <button 
                    onClick={onAdd} 
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 transition w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> Ajouter une facture
                </button>
            </div>

            {/* Tableau des factures */}
            <div className="overflow-x-auto">
                {(filtered || []).length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <FileText size={40} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">
                            Aucune facture trouvée pour votre recherche ou pour la période.
                        </p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600 tracking-wider">
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
                            {(filtered || []).map((inv) =>
                                inv ? (
                                    <tr key={inv.id} className="text-sm hover:bg-blue-50/50 transition">
                                        
                                        {/* Client */}
                                        <td className="p-4 font-semibold text-gray-800">{inv.client_name || "N/A"}</td>
                                        
                                        {/* Montant */}
                                        <td className="p-4 font-bold text-green-600 whitespace-nowrap">
                                            {currencyFormatter(inv.amount)}
                                        </td>
                                        
                                        {/* Créée le */}
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(inv.date_created).toLocaleDateString('fr-FR')}
                                        </td>
                                        
                                        {/* Échéance */}
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                                        </td>
                                        
                                        {/* Statut */}
                                        <td className="p-4">
                                            {renderStatut(inv.status)}
                                        </td>
                                        
                                        {/* Actions */}
                                        <td className="p-4 text-center space-x-2 whitespace-nowrap">
                                            <button
                                                onClick={() => generatePDF(inv)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                                                title="Télécharger la facture en PDF"
                                            >
                                                <Download size={14} /> PDF
                                            </button>
                                            <button 
                                                // ⚠️ Remplacez 'Voir' par une fonction pour ouvrir un modal d'édition si besoin
                                                onClick={() => console.log('Ouvrir l\'édition pour:', inv.id)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                                                title="Modifier la facture"
                                            >
                                                <Edit size={14} /> Éditer
                                            </button>
                                        </td>
                                    </tr>
                                ) : null
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}