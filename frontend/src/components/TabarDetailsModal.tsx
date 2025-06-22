import React, { useState } from "react";
import TabarMainInfo from "./TabarMainInfo";
import TabarSupervision from "./TabarSupervision";
import TabarDocuments from "./TabarDocuments";
import UploadDocumentModal from "./UploadDocumentModal";

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleUploadDocument = (category: string) => {
    setSelectedCategory(category);
    setShowUploadModal(true);
  };

  const handleUpload = async (documentData: any) => {
    const formData = new FormData();
    formData.append('file', documentData.file);
    formData.append('type', documentData.type);
    formData.append('title', documentData.title);
    formData.append('date', documentData.date);
    formData.append('reported', documentData.reported.toString());
    
    if (documentData.supplier) {
      formData.append('supplier', documentData.supplier);
    }
    if (documentData.amount) {
      formData.append('amount', documentData.amount.toString());
    }

    const response = await fetch(`/api/tabarim/${data.tabar.id}/documents`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('שגיאה בהעלאת המסמך');
    }

    // רענון המסמכים
    if ((window as any).refreshTabarDocuments) {
      (window as any).refreshTabarDocuments();
    }
  };

  const handleUploadSuccess = () => {
    // רענון המסמכים
    if ((window as any).refreshTabarDocuments) {
      (window as any).refreshTabarDocuments();
    }
    setShowUploadModal(false);
  };

  if (!open) return null;

  return (
    <>
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
              <TabarDocuments 
                tabarId={data.tabar.id} 
                documents={data.documents}
                onUploadDocument={handleUploadDocument}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal להעלאת מסמכים */}
      {showUploadModal && (
        <UploadDocumentModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={async (documentData) => {
            const formData = new FormData();
            formData.append('file', documentData.file);
            formData.append('type', documentData.type);
            formData.append('title', documentData.title);
            formData.append('date', documentData.date);
            formData.append('reported', documentData.reported.toString());
            
            if (documentData.supplier) {
              formData.append('supplier', documentData.supplier);
            }
            if (documentData.amount) {
              formData.append('amount', documentData.amount.toString());
            }

            const response = await fetch(`/api/tabarim/${data.tabar.id}/documents`, {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('שגיאה בהעלאת המסמך');
            }

            // רענון המסמכים
            if ((window as any).refreshTabarDocuments) {
              (window as any).refreshTabarDocuments();
            }
          }}
          projectId={data.tabar.id}
          initialCategory={selectedCategory}
        />
      )}
    </>
  );
}
