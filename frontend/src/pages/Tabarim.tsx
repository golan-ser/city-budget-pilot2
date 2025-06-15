import React, { useEffect, useState } from "react";
import { FileText, Edit3, Search, Plus } from "lucide-react";
import CreateTabarModal from "./CreateTabarModal";
import TabarDetailsModal from "../components/TabarDetailsModal";
import excelLogo from "../assets/Excel.svg";
import pdfLogo from "../assets/PDF.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// טיפוס עזר – אפשר לעדכן בהתאם למבנה שלך
type Tabar = {
  id: number;
  tabar_number: string;
  name: string;
  permission_number: string;
  total_authorized: string;
  execution_amount?: string;
  balance?: string;
  status: string;
  year: string;
  ministry: string;
};

const statusColors: Record<string, string> = {
  פעיל: "bg-green-500",
  סגור: "bg-gray-400",
  מוקפא: "bg-yellow-400",
};

const Tabarim: React.FC = () => {
  const [tabarim, setTabarim] = useState<Tabar[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [q, setQ] = useState("");
  const [ministry, setMinistry] = useState("");
  const [status, setStatus] = useState("");
  const [year, setYear] = useState("");
  const [selectedTabar, setSelectedTabar] = useState<any | null>(null);

  // חישוב רשימות לסינון
  const unique = (arr: string[]) => Array.from(new Set(arr)).filter(Boolean);
  const ministries = unique(tabarim.map((t) => t.ministry));
  const years = unique(tabarim.map((t) => t.year)).sort((a, b) => Number(b) - Number(a));
  const statuses = unique(tabarim.map((t) => t.status));

  const fetchTabarim = async () => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (ministry) params.append("ministry", ministry);
    if (status) params.append("status", status);
    if (year) params.append("year", year);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tabarim?${params}`);
    const data = await res.json();
    setTabarim(
      data.map((t: Tabar) => ({
        ...t,
        execution_amount: t.execution_amount || (
          Math.floor(Number(t.total_authorized) * 0.65)
        ).toLocaleString(),
        balance:
          t.balance ||
          (
            Number(t.total_authorized) - Math.floor(Number(t.total_authorized) * 0.65)
          ).toLocaleString(),
      }))
    );
  };

  useEffect(() => {
    fetchTabarim();
    // eslint-disable-next-line
  }, [q, ministry, status, year, showCreate]);

  // ========================== ייצוא לאקסל ==========================
  const handleExportExcel = () => {
    const exportData = tabarim.map((t) => ({
      "משרד": t.ministry,
      "שנה": t.year,
      "סטטוס": t.status,
      "יתרה": t.balance,
      "ביצוע": t.execution_amount,
      "סכום הרשאה": t.total_authorized,
      "מס' הרשאה": t.permission_number,
      "שם תב\"ר": t.name,
      "מס' תב\"ר": t.tabar_number,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet["!dir"] = "rtl";
    XLSX.utils.sheet_add_aoa(worksheet, [["מערכת ניהול תב\"רים - רשימת תב\"רים"]], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tabarim");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "tabarim.xlsx");
  };

  // ========================== ייצוא ל-PDF ==========================
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("מערכת ניהול תב\"רים", 280, 18, { align: "right" });
    doc.setFontSize(11);
    doc.text("רשימת תב\"רים", 280, 26, { align: "right" });
    const headers = [
      "משרד", "שנה", "סטטוס", "יתרה", "ביצוע", "סכום הרשאה", "מס' הרשאה", "שם תב\"ר", "מס' תב\"ר"
    ];
    const exportData = tabarim.map((t) => [
      t.ministry, t.year, t.status, t.balance, t.execution_amount,
      t.total_authorized, t.permission_number, t.name, t.tabar_number,
    ]);
    autoTable(doc, {
      head: [headers],
      body: exportData,
      styles: { font: "helvetica", fontSize: 10, halign: "right" },
      margin: { top: 35, right: 8, left: 8 },
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: "right" },
      bodyStyles: { halign: "right" },
    });
    doc.save("tabarim.pdf");
  };

  return (
    <div className="p-6">
      {/* סרגל חיפוש, סינון וכפתורי ייצוא */}
      <div className="flex flex-wrap items-center justify-between bg-white shadow-md rounded-2xl px-4 py-3 mb-6 border border-gray-100">
        {/* חיפוש וסינון */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f6fafd] rounded-xl px-3 py-1 gap-2 border">
            <Search className="w-5 h-5 text-[#4667a8]" />
            <input
              type="text"
              placeholder="חפש לפי תב”ר, שם, משרד, הרשאה..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent focus:outline-none min-w-[120px] w-40 text-sm"
            />
          </div>
          <select
            className="bg-[#f6fafd] rounded-xl border px-2 py-1 text-sm"
            value={ministry}
            onChange={(e) => setMinistry(e.target.value)}
          >
            <option value="">כל המשרדים</option>
            {ministries.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            className="bg-[#f6fafd] rounded-xl border px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">כל הסטטוסים</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="bg-[#f6fafd] rounded-xl border px-2 py-1 text-sm"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">כל השנים</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {/* כפתורי ייצוא */}
        <div className="flex gap-2 items-center">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-100 shadow-sm transition"
            title="ייצוא לאקסל"
          >
            <img src={excelLogo} alt="Excel" className="w-5 h-5" />
            <span className="font-semibold text-base">אקסל</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white hover:bg-gray-100 shadow-sm transition"
            title="ייצוא ל-PDF"
          >
            <img src={pdfLogo} alt="PDF" className="w-5 h-5" />
            <span className="font-semibold text-base">PDF</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 bg-[#181F34] hover:bg-[#243056] text-white rounded-xl px-5 py-2 font-bold shadow transition-all duration-150 text-base"
          >
            <Plus className="w-5 h-5" />
            תב"ר חדש
          </button>
        </div>
      </div>
      {/* טבלת תב"רים */}
      <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-100 bg-white">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-gradient-to-r from-[#f5f8fc] to-[#e9f0fa] text-[#2c3657] text-sm">
              <th className="p-2">מס' תב"ר</th>
              <th className="p-2">שם תב"ר</th>
              <th className="p-2">מס' הרשאה</th>
              <th className="p-2">סכום הרשאה</th>
              <th className="p-2">ביצוע</th>
              <th className="p-2">יתרה</th>
              <th className="p-2">סטטוס</th>
              <th className="p-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tabarim.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-400">
                  אין תב"רים להצגה
                </td>
              </tr>
            ) : (
              tabarim.map((t) => (
                <tr
                  key={t.id}
                  className="border-b last:border-none hover:bg-[#f6fafd] transition text-[15px]"
                >
                  <td className="p-2 font-mono">{t.tabar_number}</td>
                  <td className="p-2">{t.name}</td>
                  <td className="p-2 font-mono">{t.permission_number}</td>
                  <td className="p-2 font-mono">{Number(t.total_authorized).toLocaleString()}</td>
                  <td className="p-2 text-blue-800">{t.execution_amount}</td>
                  <td className="p-2 text-blue-800 font-bold">{t.balance}</td>
                  <td className="p-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-white rounded-xl ${
                        statusColors[t.status] || "bg-gray-300"
                      }`}
                      style={{ minWidth: "50px", justifyContent: "center" }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-2 flex gap-1 justify-center">
                    <button
                      className="bg-[#e9efff] hover:bg-[#d5e1ff] text-[#1e40af] p-2 rounded-lg shadow transition flex items-center"
                      title="כרטסת"
                      onClick={async () => {
                        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tabarim/${t.id}`);
                        const data = await res.json();
                        setSelectedTabar(data);
                      }}
                    >
                      <FileText size={18} />
                    </button>
                    <button
                      className="bg-[#f3f4f6] hover:bg-[#e6e6ed] text-[#6d788e] p-2 rounded-lg shadow transition flex items-center"
                      title="עריכה / הצגה"
                    >
                      <Edit3 size={17} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateTabarModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          fetchTabarim();
        }}
      />

      {selectedTabar && (
        <TabarDetailsModal
          open={!!selectedTabar}
          data={selectedTabar}
          onClose={() => setSelectedTabar(null)}
        />
      )}
    </div>
  );
};

export default Tabarim;
