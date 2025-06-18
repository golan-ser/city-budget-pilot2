import React from "react";

export default function BudgetItemsControls({ filters, setFilters, onExportPDF, onExportExcel }) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between mb-4" dir="rtl">
      <div className="flex gap-2">
        <select
          className="border rounded p-2"
          value={filters.status || ""}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">כל הסטטוסים</option>
          <option value="פעיל">פעיל</option>
          <option value="לא פעיל">לא פעיל</option>
        </select>

        <select
          className="border rounded p-2"
          value={filters.department || ""}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">כל המחלקות</option>
          <option value="הנדסה">הנדסה</option>
          <option value="תחזוקה">תחזוקה</option>
          <option value="חינוך">חינוך</option>
          <option value="רווחה">רווחה</option>
          <option value="כספים">כספים</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button className="bg-red-600 text-white px-4 py-1 rounded" onClick={onExportPDF}>
          PDF
        </button>
        <button className="bg-green-600 text-white px-4 py-1 rounded" onClick={onExportExcel}>
          Excel
        </button>
      </div>
    </div>
  );
}
