import { Upload, FilePlus, X } from "lucide-react";
import React, { useState, ChangeEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type ExtraDoc = { id: number; file: File | null };

const CreateTabarModal = ({ open, onClose, onCreated }: Props) => {
  // State הטופס כולל מספר הרשאה/בקשה
  const [form, setForm] = useState({
    year: "",
    tabar_number: "",
    permission_number: "", // <--- שדה חדש!
    name: "",
    ministry: "",
    total_authorized: "",
    municipal_participation: "",
    additional_funders: "",
    open_date: "",
    close_date: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);
  const [permissionFile, setPermissionFile] = useState<File | null>(null);
  const [approvalFile, setApprovalFile] = useState<File | null>(null);
  const [extraDocs, setExtraDocs] = useState<ExtraDoc[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [createProject, setCreateProject] = useState(false); // תיבת סימון לפרויקט

  // שדה טקסט רגיל
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // שינוי קובץ הרשאה/אישור
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  // שינוי במסמכים נוספים
  const handleExtraDocChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    setExtraDocs((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, file: e.target.files?.[0] || null } : doc))
    );
  };

  const addExtraDoc = () => {
    setExtraDocs((prev) => [...prev, { id: Date.now(), file: null }]);
  };

  const removeExtraDoc = (id: number) => {
    setExtraDocs((prev) => prev.filter((doc) => doc.id !== id));
  };

  // חילוץ אוטומטי מה־PDF (כולל מספר הרשאה)
  const handleExtractFromPdf = async () => {
    if (!permissionFile) return;
    setExtracting(true);
    const formData = new FormData();
    formData.append("file", permissionFile);

    try {
      const res = await fetch(`/api/tabarim/ocr`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        tabar_number: data.tabar_number || prev.tabar_number,
        permission_number: data.permission_number || prev.permission_number,
        name: data.project_name || prev.name,
        ministry: data.ministry || prev.ministry,
        total_authorized: data.amount || prev.total_authorized,
        status: data.status || prev.status,
        year: data.year || prev.year,
      }));
    } catch (err) {
      alert("אירעה שגיאה בזיהוי המסמך");
    }
    setExtracting(false);
  };

  // שליחת טופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. שליחת נתוני טופס (ללא קבצים)
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => formData.append(key, val));

    let tabarId: string | number | null = null;
    let newTabar: any = null;
    try {
      const res = await fetch(`/api/tabarim`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("שגיאה ביצירת תב'ר");
      const data = await res.json();
      newTabar = data;
      tabarId = data.id || data.tabar_id || data.tabarId;
      if (!tabarId) throw new Error("לא התקבל מזהה תב'ר");
    } catch (err) {
      alert("שגיאה ביצירת תב'ר. ודא שכל השדות מולאו כראוי.");
      setLoading(false);
      return;
    }

    // 2. שליחת קבצים (אם יש)
    const filesFormData = new FormData();
    if (permissionFile) filesFormData.append("permission_file", permissionFile);
    if (approvalFile) filesFormData.append("approval_file", approvalFile);
    extraDocs.forEach((doc, idx) => {
      if (doc.file) filesFormData.append(`extra_file_${idx + 1}`, doc.file);
    });

    // שלח קבצים רק אם יש לפחות קובץ אחד
    if (permissionFile || approvalFile || extraDocs.some(doc => doc.file)) {
      try {
        const resFiles = await fetch(`/api/tabarim/${tabarId}/document`, {
          method: "POST",
          body: filesFormData,
        });
        if (!resFiles.ok) throw new Error("שגיאה בהעלאת קבצים");
      } catch (err) {
        alert("שגיאה בהעלאת קבצים. ניתן להעלות קבצים ידנית לאחר מכן.");
        // לא עוצר את התהליך, רק מתריע
      }
    }

    // 3. יצירת פרויקט בניהול פרויקטים (אם נבחר)
    if (createProject && newTabar) {
      try {
        // יצירת פרויקט חדש עם נתוני התב"ר
        const projectData = {
          tabar_id: tabarId,
          name: newTabar.name,
          description: `פרויקט עבור תב"ר ${newTabar.tabar_number} - ${newTabar.name}`,
          start_date: newTabar.open_date,
          end_date: newTabar.close_date,
          managers: [] // רשימה ריקה של מנהלים
        };

        const projectRes = await fetch(`/api/projects/from-tabar`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectData),
        });

        if (projectRes.ok) {
          const projectResult = await projectRes.json();
          const projectId = projectResult.id;
          
          // פתיחת טאב חדש עם דף ניהול הפרויקטים
          const projectUrl = `${window.location.origin}/projects/${projectId}`;
          window.open(projectUrl, '_blank');
        } else {
          console.error('שגיאה ביצירת פרויקט:', await projectRes.text());
          alert("התב\"ר נוצר בהצלחה, אך הייתה שגיאה ביצירת הפרויקט. ניתן ליצור פרויקט ידנית.");
        }
      } catch (err) {
        console.error('שגיאה ביצירת פרויקט:', err);
        alert("התב\"ר נוצר בהצלחה, אך הייתה שגיאה ביצירת הפרויקט. ניתן ליצור פרויקט ידנית.");
      }
    }

    setLoading(false);
    if (onCreated) onCreated();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-fade-in border border-gray-200 overflow-y-auto max-h-[90vh]">
        <form
          className="flex flex-col gap-6"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          <h2 className="text-2xl font-extrabold text-center mb-2 text-[#2b344a] tracking-tight">
            יצירת תב"ר חדש
          </h2>
          <hr className="mb-2" />

          {/* העלאת מסמך הרשאה */}
          <div>
            <label className="font-bold flex items-center gap-2 mb-1 text-[#495580]">
              <Upload className="w-5 h-5" /> מסמך הרשאה (PDF)
            </label>
            <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c6d2ee] rounded-xl bg-[#f6fafd] hover:bg-[#eaf1fb] transition">
              <FilePlus className="w-8 h-8 mb-2 text-[#6e91ff]" />
              <span className="text-sm font-medium text-[#7384ad]">
                {permissionFile ? permissionFile.name : "בחר קובץ או גרור לכאן"}
              </span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange(e, setPermissionFile)}
                className="hidden"
              />
            </label>
            {permissionFile && (
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg px-4 py-2 shadow hover:scale-105 transition"
                onClick={handleExtractFromPdf}
                disabled={extracting}
              >
                <Upload className="w-4 h-4" />
                {extracting ? "מחלץ..." : "חלץ מידע מתוך הרשאה"}
              </button>
            )}
          </div>

          {/* העלאת מסמך אישור תב"ר */}
          <div>
            <label className="font-bold flex items-center gap-2 mb-1 text-[#495580]">
              <Upload className="w-5 h-5" /> מסמך אישור תב"ר (PDF)
            </label>
            <label className="cursor-pointer flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c6d2ee] rounded-xl bg-[#f6fafd] hover:bg-[#eaf1fb] transition">
              <FilePlus className="w-8 h-8 mb-2 text-[#6e91ff]" />
              <span className="text-sm font-medium text-[#7384ad]">
                {approvalFile ? approvalFile.name : "בחר קובץ או גרור לכאן"}
              </span>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange(e, setApprovalFile)}
                className="hidden"
              />
            </label>
          </div>

          {/* מסמכים נוספים */}
          <div>
            <label className="font-bold flex items-center gap-2 mb-1 text-[#495580]">
              <FilePlus className="w-5 h-5" /> מסמכים נוספים
            </label>
            {extraDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 mb-2">
                <label className="flex-1 cursor-pointer flex items-center p-2 border-2 border-dashed border-gray-200 rounded-xl bg-[#f8fafc]">
                  <FilePlus className="w-5 h-5 mr-2 text-[#6e91ff]" />
                  <span className="text-xs font-medium text-[#7384ad]">
                    {doc.file ? doc.file.name : "בחר מסמך"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => handleExtraDocChange(doc.id, e)}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  className="text-red-600 hover:bg-red-100 rounded-full p-1"
                  onClick={() => removeExtraDoc(doc.id)}
                  title="הסר מסמך"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1 bg-[#e0eafe] text-[#4767a7] px-3 py-1 rounded-lg font-semibold hover:bg-[#cfe0fd] transition"
              onClick={addExtraDoc}
            >
              <FilePlus className="w-4 h-4" />
              הוסף מסמך
            </button>
          </div>

          <hr className="my-2" />

          {/* תיבת סימון ליצירת פרויקט */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <input
              type="checkbox"
              id="createProject"
              checked={createProject}
              onChange={(e) => setCreateProject(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="createProject" className="text-sm font-medium text-blue-900 cursor-pointer">
              צור גם פרויקט בניהול פרויקטים (יפתח טאב חדש אחרי השמירה)
            </label>
          </div>

          <hr className="my-2" />

          {/* שדות טופס רגילים */}
          <div className="flex flex-col gap-3">
            <input
              name="permission_number"
              className="input"
              placeholder="מספר הרשאה/בקשה"
              value={form.permission_number}
              onChange={handleChange}
            />
            <input
              name="year"
              type="number"
              className="input"
              placeholder="שנה"
              value={form.year}
              onChange={handleChange}
              required
            />
            <input
              name="tabar_number"
              className="input"
              placeholder='מספר תב"ר'
              value={form.tabar_number}
              onChange={handleChange}
              required
            />
            <input
              name="name"
              className="input"
              placeholder="שם פרויקט"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="ministry"
              className="input"
              placeholder="משרד מממן"
              value={form.ministry}
              onChange={handleChange}
            />
            <input
              name="total_authorized"
              className="input"
              placeholder="סכום הרשאה"
              value={form.total_authorized}
              onChange={handleChange}
            />
            <input
              name="municipal_participation"
              className="input"
              placeholder="סכום רשות"
              value={form.municipal_participation}
              onChange={handleChange}
            />
            <input
              name="additional_funders"
              className="input"
              placeholder="ממנים נוספים"
              value={form.additional_funders}
              onChange={handleChange}
            />
            <input
              name="open_date"
              type="date"
              className="input"
              placeholder="תאריך פתיחה"
              value={form.open_date}
              onChange={handleChange}
            />
            <input
              name="close_date"
              type="date"
              className="input"
              placeholder="תאריך סגירה"
              value={form.close_date}
              onChange={handleChange}
            />
            <input
              name="status"
              className="input"
              placeholder="סטטוס"
              value={form.status}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl px-6 py-2 shadow-lg hover:scale-105 hover:from-green-600 hover:to-emerald-700 transition"
              disabled={loading}
            >
              {loading ? "יוצר..." : "שמור"}
            </button>
            <button
              type="button"
              className="bg-gray-200 text-gray-600 font-bold rounded-xl px-6 py-2 shadow hover:bg-gray-300 transition"
              onClick={onClose}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTabarModal;
