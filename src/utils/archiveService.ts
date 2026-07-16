import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';

const BACKEND_URL = 'https://adventconnect-7jfq.onrender.com';

export const exportSermonArchive = async (roomId: string, messages: any[], user: string) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  doc.setFontSize(22);
  doc.setTextColor(25, 118, 210);
  doc.text('ADVENTCONNECT: SERVICE ARCHIVE', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Room: ${roomId} | Date: ${date} | Archived by: ${user}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Time', 'Member', 'Message']],
    body: messages.map(m => [
      new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      m.sender, 
      m.text
    ]),
    theme: 'striped',
    headStyles: { fillColor: [25, 118, 210] }
  });

  doc.save(`Sermon_Archive_${roomId}.pdf`);

  const pdfBlob = doc.output('blob');
  const formData = new FormData();
  formData.append('pdf', pdfBlob, `Archive_${roomId}.pdf`);
  formData.append('roomId', roomId);
  formData.append('title', `Service Archive: ${roomId}`);
  formData.append('archivedBy', user);

  try {
    await axios.post(`${BACKEND_URL}/api/meetings/upload-archive`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log("Archive synced to Sanctuary Cloud.");
  } catch (err) {
    console.error("Cloud Sync Failed:", err);
  }
};