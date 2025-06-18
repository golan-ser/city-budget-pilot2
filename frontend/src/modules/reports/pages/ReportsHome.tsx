import React from "react";
import { useNavigate } from "react-router-dom";
import pdfIcon from "/src/assets/PDF.png";
import excelIcon from "/src/assets/Excel.svg";

const reports = [
  {
    title: "דוח סעיפי תקציב",
    description: "סיכום סעיפים לפי מחלקה וסטטוס",
    path: "/analytics/items",
    status: "מוכן"
  },
  {
    title: "דוח תב״ר",
    description: "רשימת תב״רים לפי משרד, שנה וסטטוס",
    path: "/analytics/tabar",
    status: "מוכן"
  },
  {
    title: "דוח חריגות",
    description: "פרויקטים עם ניצול מעל 100% או איחור בלו״ז",
    path: "#",
    status: "בבניה"
  },
  {
    title: "דוח אבני דרך",
    description: "מעקב התקדמות לפי אבני דרך",
    path: "#",
    status: "בבניה"
  },
  {
    title: "מחולל דוחות גמיש",
    description: "בחר שדות וסנן דוחות לפי קריטריונים",
    path: "#",
    status: "בבניה"
  }
];

export default function ReportsHome() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h2 className="text-3xl font-bold text-green-700">דוחות מערכת</h2>
      <p className="text-gray-600">בחר דוח לצפייה או יצירה</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, idx) => (
          <div
            key={idx}
            onClick={() => report.status === "מוכן" && navigate(report.path)}
            className={`cursor-pointer border rounded shadow p-4 hover:shadow-md transition ${
              report.status === "בבניה" ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">{report.title}</h3>
              {report.status === "מוכן" ? (
                <span className="text-green-600 text-sm">✓ מוכן</span>
              ) : (
                <span className="text-gray-500 text-sm">בבניה</span>
              )}
            </div>
            <p className="text-sm text-gray-700">{report.description}</p>
            <div className="flex gap-2 mt-4">
              <img src={pdfIcon} alt="PDF" className="w-6 h-6" />
              <img src={excelIcon} alt="Excel" className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
