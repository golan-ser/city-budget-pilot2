import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import CreateTabarModal from "./CreateTabarModal"; // ייבוא הטופס

type Tabar = {
  id: number;
  year: number;
  tabar_number: string;
  name: string;
  ministry?: string;
  total_authorized?: number;
  municipal_participation?: number;
  additional_funders?: any;
  open_date?: string;
  close_date?: string;
  status?: string;
  created_at?: string;
};

const statusColors: Record<string, string> = {
  "מאושר": "bg-green-600 text-white",
  "נשלח": "bg-blue-900 text-white",
  "טיוטה": "bg-blue-200 text-gray-900",
  "נדחה": "bg-red-500 text-white",
};

const Tabarim = () => {
  const [tabarim, setTabarim] = useState<Tabar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [sortKey, setSortKey] = useState<keyof Tabar | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedTabarId, setSelectedTabarId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // פרטי תב"ר
  const [tabarDetails, setTabarDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchTabarim();
  }, []);

  const fetchTabarim = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tabarim`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setTabarim(data);
    } catch (err) {
      setError("שגיאה בטעינת התב\"רים");
    }
    setLoading(false);
  };

  // חיפוש, סינון, מיון
  const filteredTabarim = tabarim
    .filter((t) =>
      (!filterYear || String(t.year) === filterYear) &&
      (searchTerm === "" ||
        Object.values(t).some(
          (val) =>
            val !== null &&
            val !== undefined &&
            val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );

  const sortedTabarim = [...filteredTabarim].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === undefined || bVal === undefined) return 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === "asc"
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });

  // הצגת כרטסת תב"ר
  const handleShowDetails = async (id: number) => {
    setSelectedTabarId(id);
    setTabarDetails(null);
    setDetailsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tabarim/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTabarDetails(data);
    } catch {
      setTabarDetails(null);
    }
    setDetailsLoading(false);
  };

  // ייצוא לאקסל
  const handleExportToExcel = () => {
    if (!tabarDetails) return;
    const data = tabarDetails.transactions.map((tr: any) => ({
      "תאריך": tr.transaction_date ? new Date(tr.transaction_date).toLocaleDateString() : "",
      "סעיף": tr.item_id,
      "סוג": tr.transaction_type,
      "חובה/זכות": tr.direction,
      "סכום": tr.amount,
      "מס' הזמנה": tr.order_number,
      "סטטוס": tr.status,
      "פירוט": tr.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "כרטסת");
    XLSX.writeFile(workbook, `כרטסת_תבר_${tabarDetails.tabar.tabar_number}.xlsx`);
  };

  // ייצוא ל־PDF
  const handleExportToPdf = () => {
    if (!tabarDetails) return;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text(`כרטסת תב"ר: ${tabarDetails.tabar.name} (מס' ${tabarDetails.tabar.tabar_number})`, 15, 15);
    const columns = [
      { header: "תאריך", dataKey: "date" },
      { header: "סעיף", dataKey: "item" },
      { header: "סוג", dataKey: "type" },
      { header: "חובה/זכות", dataKey: "direction" },
      { header: "סכום", dataKey: "amount" },
      { header: "מס' הזמנה", dataKey: "order" },
      { header: "סטטוס", dataKey: "status" },
      { header: "פירוט", dataKey: "desc" },
    ];
    const rows = tabarDetails.transactions.map((tr: any) => ({
      date: tr.transaction_date ? new Date(tr.transaction_date).toLocaleDateString() : "",
      item: tr.item_id,
      type: tr.transaction_type,
      direction: tr.direction,
      amount: tr.amount,
      order: tr.order_number,
      status: tr.status,
      desc: tr.description,
    }));
    // @ts-ignore
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey])),
      startY: 25,
      styles: { font: "helvetica", fontStyle: "normal", halign: "right" },
      headStyles: { fillColor: [52, 102, 183], textColor: 255 },
    });
    doc.save(`כרטסת_תבר_${tabarDetails.tabar.tabar_number}.pdf`);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen" dir="rtl">
      {/* מודאל יצירת תב"ר */}
      <CreateTabarModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTabarim}
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#151F2D] mb-1">ניהול תב"רים</h1>
          <p className="text-gray-400">מעקב, ייצוא וניהול תב"רים ותקציבים</p>
        </div>
        <button
          className="bg-green-500 text-white rounded-xl px-6 py-2 font-bold text-lg shadow hover:bg-green-600 transition"
          onClick={() => setShowCreate(true)}
        >
          + תב"ר חדש
        </button>
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl shadow">
        <input
          type="text"
          placeholder="חיפוש חופשי בכל שדה..."
          className="border border-gray-200 rounded-xl px-4 py-2 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded-xl px-3 py-2"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        >
          <option value="">כל השנים</option>
          {[...new Set(tabarim.map((t) => t.year))]
            .sort((a, b) => b - a)
            .map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
        </select>
      </div>
      {loading ? (
        <p>טוען נתונים...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl shadow px-4 py-3 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey("tabar_number");
                    setSortOrder(
                      sortKey === "tabar_number" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                >
                  מס' תב"ר {sortKey === "tabar_number" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="border p-2">שנה</th>
                <th className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey("name");
                    setSortOrder(
                      sortKey === "name" && sortOrder === "asc"
                        ? "desc"
                        : "asc"
                    );
                  }}
                >
                  שם תב"ר {sortKey === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="border p-2">משרד מממן</th>
                <th className="border p-2">סכום הרשאה</th>
                <th className="border p-2">סכום רשות</th>
                <th className="border p-2">סטטוס</th>
                <th className="border p-2">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedTabarim.map((tabar) => (
                <tr key={tabar.id} className="hover:bg-gray-50 text-center">
                  <td className="border p-2">{tabar.tabar_number}</td>
                  <td className="border p-2">{tabar.year}</td>
                  <td className="border p-2">{tabar.name}</td>
                  <td className="border p-2">{tabar.ministry}</td>
                  <td className="border p-2">{tabar.total_authorized?.toLocaleString()}</td>
                  <td className="border p-2">{tabar.municipal_participation?.toLocaleString()}</td>
                  <td className="border p-2">
                    <span className={`rounded-xl px-3 py-1 font-bold text-sm ${statusColors[tabar.status ?? ""] || "bg-gray-300 text-gray-700"}`}>
                      {tabar.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleShowDetails(tabar.id)}
                    >
                      כרטסת
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedTabarim.length === 0 && (
            <div className="text-center text-gray-400 py-6">לא נמצאו תב"רים</div>
          )}
        </div>
      )}

      {/* --- כרטסת/Modal --- */}
      {selectedTabarId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl w-full shadow-lg relative overflow-auto" style={{ maxHeight: "90vh" }}>
            <button
              className="absolute top-2 left-2 text-gray-500"
              onClick={() => {
                setSelectedTabarId(null);
                setTabarDetails(null);
              }}
            >
              סגור
            </button>
            {detailsLoading ? (
              <p>טוען...</p>
            ) : tabarDetails ? (
              <>
                <div className="flex gap-2 mb-4">
                  <button className="bg-blue-700 text-white rounded px-4 py-1 hover:bg-blue-800" onClick={handleExportToExcel}>
                    ייצוא ל־Excel
                  </button>
                  <button className="bg-red-700 text-white rounded px-4 py-1 hover:bg-red-800" onClick={handleExportToPdf}>
                    ייצוא ל־PDF
                  </button>
                  <a
                    className="bg-green-600 text-white rounded px-4 py-1 hover:bg-green-700"
                    href={`mailto:?subject=כרטסת תב"ר&body=מצורף קובץ כרטסת תב"ר. נא לצרף את הקובץ שהורדת`}
                  >
                    שלח במייל
                  </a>
                </div>
                <h2 className="text-lg font-bold mb-4">
                  כרטסת תב"ר: {tabarDetails.tabar.name} (מס' {tabarDetails.tabar.tabar_number})
                </h2>
                <div className="mb-2">משרד: {tabarDetails.tabar.ministry} | סכום הרשאה: {tabarDetails.tabar.total_authorized?.toLocaleString()} ₪ | סכום רשות: {tabarDetails.tabar.municipal_participation?.toLocaleString()} ₪</div>
                <h3 className="font-semibold mb-1">סעיפים:</h3>
                <ul className="mb-4 flex flex-wrap gap-4">
                  {tabarDetails.items.map((item: any) => (
                    <li key={item.id} className="border rounded p-2 bg-gray-50">
                      [{item.item_type}] {item.budget_item_code} - {item.budget_item_name}: {item.amount?.toLocaleString()} ₪
                    </li>
                  ))}
                </ul>
                <h3 className="font-semibold mb-1 mt-4">כרטסת תנועות:</h3>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full border-collapse border border-gray-300 text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">תאריך</th>
                        <th className="border p-2">סעיף</th>
                        <th className="border p-2">סוג</th>
                        <th className="border p-2">חובה/זכות</th>
                        <th className="border p-2">סכום</th>
                        <th className="border p-2">מס' הזמנה</th>
                        <th className="border p-2">סטטוס</th>
                        <th className="border p-2">פירוט</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabarDetails.transactions.map((tr: any) => (
                        <tr key={tr.id}>
                          <td className="border p-2">{tr.transaction_date ? new Date(tr.transaction_date).toLocaleDateString() : ""}</td>
                          <td className="border p-2">{tr.item_id}</td>
                          <td className="border p-2">{tr.transaction_type}</td>
                          <td className="border p-2">{tr.direction}</td>
                          <td className="border p-2">{tr.amount?.toLocaleString()}</td>
                          <td className="border p-2">{tr.order_number}</td>
                          <td className="border p-2">{tr.status}</td>
                          <td className="border p-2">{tr.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold mb-1">הרשאות:</h3>
                  <ul>
                    {tabarDetails.permissions.map((p: any) => (
                      <li key={p.id}>
                        מס' הרשאה: {p.permission_number}, משרד: {p.ministry}, סכום: {p.amount?.toLocaleString()} ₪
                        {p.document_url && (
                          <a href={p.document_url} className="ml-2 text-blue-600 underline" target="_blank" rel="noreferrer">
                            צפה במסמך
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p>לא נמצאו פרטים</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tabarim;
