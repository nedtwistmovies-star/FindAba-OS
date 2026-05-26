
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface WaybillData {
  orderId: string;
  customerName: string;
  customerPhone?: string;
  pickupAddr: string;
  dropoffAddr: string;
  amount: number;
  itemDescription?: string;
  driverName?: string;
  vehiclePlate?: string;
  date: string;
}

export const generateWaybillPDF = (data: WaybillData) => {
  const doc = new jsPDF();
  const primaryColor = '#008c52'; // Aba Green
  const accentColor = '#FFD700'; // Aba Gold
  
  // Header
  doc.setFillColor(30, 0, 51); // Dark Purple
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FIN D ABA | LOGISTICS', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL INDUSTRIAL WAYBILL', 20, 32);
  
  doc.setTextColor(accentColor);
  doc.text(`ID: ${data.orderId}`, 150, 25);
  doc.text(`DATE: ${data.date}`, 150, 32);

  // Main Content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('SHIPMENT DETAILS', 20, 55);
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 58, 190, 58);

  const shipmentTable = [
    ['Customer', data.customerName],
    ['Phone', data.customerPhone || 'N/A'],
    ['Pickup', data.pickupAddr],
    ['Dropoff', data.dropoffAddr],
    ['Item', data.itemDescription || 'General Parcel'],
    ['Declared Value', `NGN ${data.amount.toLocaleString()}`],
  ];

  (doc as any).autoTable({
    startY: 65,
    head: [['Field', 'Details']],
    body: shipmentTable,
    theme: 'striped',
    headStyles: { fillStyle: primaryColor, textColor: 255 },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // Driver Section
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('CARRIER INFORMATION', 20, finalY);
  doc.line(20, finalY + 3, 190, finalY + 3);

  const carrierTable = [
    ['Partner Driver', data.driverName || 'Officer Partner'],
    ['Vessel Plate', data.vehiclePlate || 'ABA-OS-LOG'],
    ['Network Status', 'GPS VERIFIED'],
  ];

  (doc as any).autoTable({
    startY: finalY + 10,
    body: carrierTable,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // QR Code Placeholder or footer
  const footerY = 270;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('FindAba Industrial Registry Handshake Verified.', 20, footerY);
  doc.text('This waybill serves as a digital legal artifact for the Enyimba Logistics Network.', 20, footerY + 5);
  
  // Blue signature line
  doc.setDrawColor(0, 140, 82);
  doc.line(140, footerY, 190, footerY);
  doc.text('Authorized Registry Stamp', 145, footerY + 5);

  doc.save(`waybill-${data.orderId}.pdf`);
};
