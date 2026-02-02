import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { Activity, Park, Category } from '../types';

export interface ReceiptData {
    activity: Activity;
    park: Park;
    category: Category;
    cashierName: string;
}

export const generateReceipt = (data: ReceiptData): void => {
    const { activity, park, category, cashierName } = data;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150], // Ticket format 80mm width
    });

    const pageWidth = 80;
    let y = 10;
    const lineHeight = 5;
    const margin = 5;

    // Header - Park Name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(park.name, pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;

    // Park Address (if available)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Abidjan, Côte d\'Ivoire', pageWidth / 2, y, { align: 'center' });
    y += lineHeight;

    // Separator line
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // Receipt Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DE CAISSE', pageWidth / 2, y, { align: 'center' });
    y += lineHeight + 2;

    // Date and Time
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const receiptDate = new Date(activity.activity_date);
    doc.text(`Date: ${formatDate(receiptDate)}`, margin, y);
    y += lineHeight;
    doc.text(`Heure: ${formatTime(receiptDate)}`, margin, y);
    y += lineHeight;

    // Receipt Number
    doc.text(`N°: ${activity.id.slice(-8).toUpperCase()}`, margin, y);
    y += lineHeight + 2;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // Item Details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Article', margin, y);
    doc.text('Montant', pageWidth - margin, y, { align: 'right' });
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    // Category/Item name
    const itemName = category?.name || 'Article';
    doc.text(itemName, margin, y);
    y += lineHeight;

    // Quantity and unit price
    doc.setFontSize(8);
    const unitPrice = activity.amount / (activity.quantity || 1);
    doc.text(`  ${activity.quantity || 1} x ${formatCurrency(unitPrice)}`, margin, y);
    doc.text(formatCurrency(activity.amount), pageWidth - margin, y, { align: 'right' });
    y += lineHeight + 2;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // Total
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margin, y);
    doc.text(formatCurrency(activity.amount), pageWidth - margin, y, { align: 'right' });
    y += lineHeight + 2;

    // Payment Method
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const paymentLabels: Record<string, string> = {
        cash: 'Espèces',
        wave: 'Wave',
        orange_money: 'Orange Money',
    };
    doc.text(`Paiement: ${paymentLabels[activity.payment_method] || activity.payment_method}`, margin, y);
    y += lineHeight + 2;

    // Separator
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // Cashier
    doc.setFontSize(7);
    doc.text(`Caissier: ${cashierName}`, margin, y);
    y += lineHeight + 3;

    // Thank you message
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Merci de votre visite !', pageWidth / 2, y, { align: 'center' });
    y += lineHeight;
    doc.text('À bientôt chez LaserPark', pageWidth / 2, y, { align: 'center' });

    // Save/Download
    const filename = `ticket_${activity.id.slice(-8)}_${formatDate(receiptDate).replace(/\//g, '-')}.pdf`;
    doc.save(filename);
};

// Open receipt in new window for print
export const printReceipt = (data: ReceiptData): void => {
    const { activity, park, category, cashierName } = data;

    // Create printable HTML
    const receiptDate = new Date(activity.activity_date);
    const paymentLabels: Record<string, string> = {
        cash: 'Espèces',
        wave: 'Wave',
        orange_money: 'Orange Money',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Ticket de Caisse</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            width: 80mm; 
            padding: 5mm;
            font-size: 12px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; }
        .subtitle { font-size: 10px; color: #666; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .total { font-size: 14px; font-weight: bold; margin: 8px 0; }
        .footer { text-align: center; margin-top: 10px; font-style: italic; }
        @media print {
            body { width: 80mm; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${park.name}</div>
        <div class="subtitle">Abidjan, Côte d'Ivoire</div>
    </div>
    <div class="separator"></div>
    <div style="text-align: center; font-weight: bold;">TICKET DE CAISSE</div>
    <div class="separator"></div>
    <div class="row"><span>Date:</span><span>${formatDate(receiptDate)}</span></div>
    <div class="row"><span>Heure:</span><span>${formatTime(receiptDate)}</span></div>
    <div class="row"><span>N°:</span><span>${activity.id.slice(-8).toUpperCase()}</span></div>
    <div class="separator"></div>
    <div class="row"><span>${category?.name || 'Article'}</span></div>
    <div class="row">
        <span>${activity.quantity || 1} x ${formatCurrency(activity.amount / (activity.quantity || 1))}</span>
        <span>${formatCurrency(activity.amount)}</span>
    </div>
    <div class="separator"></div>
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(activity.amount)}</span></div>
    <div class="row"><span>Paiement:</span><span>${paymentLabels[activity.payment_method]}</span></div>
    <div class="separator"></div>
    <div style="font-size: 10px;">Caissier: ${cashierName}</div>
    <div class="footer">
        <div>Merci de votre visite !</div>
        <div>À bientôt chez LaserPark</div>
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }
};
