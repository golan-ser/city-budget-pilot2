import React from "react";
import { useNavigate } from "react-router-dom";

export default function ReportsDashboard() {
  const navigate = useNavigate();

  const reports = [
    {
      title: "דוח תב\"ר",
      description: "סקירה של תב\"רים לפי סטטוס, משרד ושנה",
      path: "tabar",
    },
    {
      title: "דוח סעיפי תקציב",
      description: "ניתוח סעיפים לפי מחלקה וסטטוס ביצוע",
      path: "budget-items",
    },
    // אפשר להוסיף כאן דוחות נוספים
  ];

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800">דוחות</h1>
      <p className="text-gray-600">בחר דוח לצפייה וניתוח נתונים</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.path}
            onClick={() => navigate(report.path)}
            className="cursor-pointer p-6 border rounded-lg shadow hover:shadow-md hover:bg-gray-50 transition"
          >
            <h2 className="text-xl font-semibold text-green-700">{report.title}</h2>
            <p className="text-gray-600 mt-2">{report.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
