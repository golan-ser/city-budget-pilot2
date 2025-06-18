import React, { useState } from "react";
import BudgetItemsReport from "@/modules/reports/pages/BudgetItemsReport";
import TabarBudgetReport from "@/modules/reports/pages/TabarBudgetReport";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState("tabar");

  const renderReport = () => {
    switch (selectedReport) {
      case "tabar":
        return <TabarBudgetReport />;
      case "items":
        return <BudgetItemsReport />;
      default:
        return <div>בחר דוח מהתפריט מימין</div>;
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">מרכז דוחות</h1>
      <div className="flex gap-3 mt-4">
        <button
          className={`px-4 py-2 rounded ${selectedReport === "tabar" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setSelectedReport("tabar")}
        >
          דוח תב"ר
        </button>
        <button
          className={`px-4 py-2 rounded ${selectedReport === "items" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setSelectedReport("items")}
        >
          דוח סעיפים
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow border">
        {renderReport()}
      </div>
    </div>
  );
}
