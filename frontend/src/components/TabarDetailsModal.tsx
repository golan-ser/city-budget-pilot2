import React, { useState } from "react";
import TabarMainInfo from "./TabarMainInfo";
import TabarSupervision from "./TabarSupervision";
import TabarDocuments from "./TabarDocuments";

type TabarDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  data: any; // הנתונים של התב"ר (כולל הכל)
};

const tabs = [
  { key: "main", label: "פרטי תב\"ר" },
  { key: "supervision", label: "פיקוח תקציבי" },
  { key: "documents", label: "מסמכים" },
];

export default function TabarDetailsModal({ open, onClose, data }: TabarDetailsModalProps) {
  const [tab, setTab] = useState("main");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="text-xl font-bold text-blue-900">תב"ר: {data.tabar.name}</div>
          <button
            className="text-lg font-bold bg-gray-200 hover:bg-gray-300 rounded-full w-10 h-10"
            onClick={onClose}
            aria-label="סגור"
          >×</button>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-2 bg-blue-50">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`px-4 py-2 rounded-t-xl text-base font-bold transition ${
                tab === t.key
                  ? "bg-white border-b-2 border-blue-500 text-blue-900"
                  : "bg-blue-50 text-blue-700"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* תוכן הטאב הנבחר */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {tab === "main" && <TabarMainInfo data={data} />}
          {tab === "supervision" && <TabarSupervision data={data} />}
          {tab === "documents" && (
            <TabarDocuments tabarId={data.tabar.id} documents={data.documents} />
          )}
        </div>
      </div>
    </div>
  );
}
