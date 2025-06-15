import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import excelLogo from "../assets/Excel.svg";
import pdfLogo from "../assets/PDF.png";

type Movement = {
  id: number;
  transaction_date: string;
  transaction_type: string;
  budget_item_name?: string;
  amount: number;
  direction: string;
  description?: string;
  order_number?: string;
  status?: string;
};

type Props = {
  movements: Movement[];
};

export default function BudgetMovementsTable({ movements }: Props) {
  // נוסחאות סיכום
  const totalIn = movements.filter(tx => tx.direction === "זכות").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalOut = movements.filter(tx => tx.direction === "חייב" || tx.direction === "חובה").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const net = totalIn - totalOut;

  // ייצוא אקסל
  const exportMovementsToExcel = () => {
    const exportData = movements.map(tx => ({
      "תאריך": new Date(tx.transaction_date).toLocaleDateString("he-IL"),
      "סוג תנועה": tx.transaction_type,
      "סכום": tx.amount,
      "חובה/זכות": tx.direction,
      "הערה": tx.description,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!dir"] = "rtl";
    XLSX.utils.sheet_add_aoa(worksheet, [["כרטסת תנועות תקציביות"]], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movements");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "כרטסת_תנועות.xlsx");
  };

  // ייצוא PDF
  const exportMovementsToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("כרטסת תנועות תקציביות", 270, 18, { align: "right" });
    autoTable(doc, {
      head: [["תאריך", "סוג תנועה", "סכום", "חובה/זכות", "הערה"]],
      body: movements.map(tx => [
        new Date(tx.transaction_date).toLocaleDateString("he-IL"),
        tx.transaction_type, tx.amount, tx.direction, tx.description
      ]),
      styles: { font: "helvetica", fontSize: 10, halign: "right" },
      margin: { top: 25, right: 10, left: 10 },
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: "right" },
      bodyStyles: { halign: "right" },
    });
    doc.save("כרטסת_תנועות.pdf");
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4 justify-end">
        <button onClick={exportMovementsToExcel} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-100 shadow-sm transition">
          <img src={excelLogo} alt="Excel" className="w-6 h-6" />
          <span className="font-semibold text-base">אקסל</span>
        </button>
        <button onClick={exportMovementsToPDF} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-100 shadow-sm transition">
          <img src={pdfLogo} alt="PDF" className="w-6 h-6" />
          <span className="font-semibold text-base">PDF</span>
        </button>
      </div>
      <table className="w-full text-lg border rounded-xl overflow-hidden mb-2 text-right">
        <thead>
          <tr className="bg-blue-50 text-blue-800">
            <th>תאריך</th>
            <th>סוג תנועה</th>
            <th>סכום</th>
            <th>חובה/זכות</th>
            <th>הערה</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((tx, i) => (
            <tr key={i}>
              <td>{new Date(tx.transaction_date).toLocaleDateString("he-IL")}</td>
              <td>{tx.transaction_type}</td>
              <td>{tx.amount?.toLocaleString()}</td>
              <td>{tx.direction}</td>
              <td>{tx.description}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50 font-bold">
            <td colSpan={2}>סה"כ זכות:</td>
            <td>{totalIn.toLocaleString()}</td>
            <td colSpan={2}></td>
          </tr>
          <tr className="bg-blue-50 font-bold">
            <td colSpan={2}>סה"כ חובה:</td>
            <td>{totalOut.toLocaleString()}</td>
            <td colSpan={2}></td>
          </tr>
          <tr className="bg-blue-100 font-bold text-lg">
            <td colSpan={2}>יתרה:</td>
            <td>{net.toLocaleString()}</td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
