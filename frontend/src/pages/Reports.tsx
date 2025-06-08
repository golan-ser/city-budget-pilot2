import React, { useEffect, useState } from "react";

type Report = {
  id: number;
  project_id: number;
  report_date?: string;
  status?: string;
  notes?: string;
  created_by?: number;
  created_at?: string;
  order_id?: number;
  order_description?: string;
  amount?: number;
  budget_item_id?: number;
  budget_item_name?: string;
  supply_date?: string;
  supply_location?: string;
  contract_id?: number;
  quote?: string;
  ministry_id?: number;
  tabar_id?: number;
  project_stage?: string;
  requesting_department_id?: number;
};

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReport, setNewReport] = useState<Partial<Report>>({ status: "טיוטה" });
  const [isAdding, setIsAdding] = useState(false);

  // סינון, חיפוש, מיון
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<keyof Report | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // details & edit
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editReport, setEditReport] = useState<Partial<Report> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      setError("שגיאה בטעינת הדוחות");
    }
    setLoading(false);
  };

  // מחיקת דוח
  const handleDelete = async (id: number) => {
    if (!window.confirm("האם למחוק את הדוח?")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${id}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        setReports(reports.filter((r) => r.id !== id));
      } else {
        alert("שגיאה במחיקה");
      }
    } catch {
      alert("שגיאה במחיקה");
    }
  };

  // הצגת פרטי דוח
  const handleShowDetails = async (id: number) => {
    setDetailsLoading(true);
    setDetailsError('');
    setShowDetails(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedReport(data);
    } catch {
      setDetailsError('שגיאה בטעינת פרטי הדוח');
    }
    setDetailsLoading(false);
    setEditMode(false);
  };

  // פתיחת טופס עריכה
  const handleEdit = () => {
    setEditReport(selectedReport);
    setEditMode(true);
  };

  // שליחת עדכון דוח
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReport || !editReport.id) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/${editReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editReport),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedReport(data);
      setReports((prev) => prev.map(r => r.id === data.id ? data : r));
      setEditMode(false);
    } catch {
      alert("שגיאה בעדכון הדוח");
    }
    setSaving(false);
  };

  // פתיחת טופס הוספה
  const openAddForm = () => {
    setNewReport({ status: "טיוטה" });
    setShowAddForm(true);
  };

  // שינוי שדות בטופס הוספה
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewReport({ ...newReport, [name]: value });
  };

  // שינוי שדות בטופס עריכה
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editReport) return;
    const { name, value } = e.target;
    setEditReport({ ...editReport, [name]: value });
  };

  // שליחת טופס יצירה
  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      });
      if (!res.ok) throw new Error("שגיאה ביצירת הדוח");
      const added = await res.json();
      setReports([added, ...reports]);
      setShowAddForm(false);
    } catch {
      setError("שגיאה ביצירת הדוח");
    }
    setIsAdding(false);
  };

  // --- חיפוש וסינון ---
  const filteredReports = reports
    .filter(r =>
      (!filterStatus || r.status === filterStatus) &&
      (searchTerm === '' || Object.values(r).some(val =>
        val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );

  // --- מיון ---
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal === undefined || bVal === undefined) return 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortOrder === 'asc'
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });

  // --- UI ---
  return (
    <div className="p-4" dir="rtl">
      <h1 className="text-xl font-bold mb-4">רשימת דוחות</h1>

      <div className="mb-3">
        <button
          className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 transition"
          onClick={openAddForm}
        >
          + דוח חדש
        </button>
      </div>

      {/* --- חיפוש וסינון --- */}
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="חפש מילה חופשית בכל שדה..."
          className="border rounded p-2 w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded p-2"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">כל הסטטוסים</option>
          <option value="טיוטה">טיוטה</option>
          <option value="נשלח">נשלח</option>
          <option value="מאושר">מאושר</option>
          <option value="נדחה">נדחה</option>
        </select>
      </div>

      {/* טופס הוספת דוח חדש */}
      {showAddForm && (
        <form
          className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200 shadow max-w-xl"
          onSubmit={handleAddReport}
        >
          <h2 className="font-semibold mb-3">הוספת דוח חדש</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              className="border p-2 rounded w-44"
              type="number"
              name="project_id"
              placeholder="מספר פרויקט"
              required
              value={newReport.project_id || ""}
              onChange={handleFormChange}
            />
            <input
              className="border p-2 rounded w-44"
              type="date"
              name="report_date"
              placeholder="תאריך דיווח"
              required
              value={newReport.report_date || ""}
              onChange={handleFormChange}
            />
            <select
              className="border p-2 rounded w-44"
              name="status"
              value={newReport.status || ""}
              onChange={handleFormChange}
              required
            >
              <option value="טיוטה">טיוטה</option>
              <option value="נשלח">נשלח</option>
              <option value="מאושר">מאושר</option>
              <option value="נדחה">נדחה</option>
            </select>
            <input
              className="border p-2 rounded w-44"
              type="text"
              name="notes"
              placeholder="הערות"
              value={newReport.notes || ""}
              onChange={handleFormChange}
            />
            <input
              className="border p-2 rounded w-44"
              type="number"
              name="created_by"
              placeholder="נוצר ע״י (מזהה משתמש)"
              value={newReport.created_by || ""}
              onChange={handleFormChange}
            />
          </div>
          <div className="mt-3 flex gap-3">
            <button
              className="bg-blue-600 text-white rounded px-4 py-1 hover:bg-blue-700"
              type="submit"
              disabled={isAdding}
            >
              {isAdding ? "מוסיף..." : "הוסף"}
            </button>
            <button
              className="bg-gray-200 rounded px-4 py-1 hover:bg-gray-300"
              type="button"
              onClick={() => setShowAddForm(false)}
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>טוען נתונים...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey('id');
                    setSortOrder(sortKey === 'id' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  ID {sortKey === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey('project_id');
                    setSortOrder(sortKey === 'project_id' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  פרויקט {sortKey === 'project_id' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey('status');
                    setSortOrder(sortKey === 'status' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  סטטוס {sortKey === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="border p-2">מס' הזמנה</th>
                <th className="border p-2">תיאור הזמנה</th>
                <th className="border p-2">סכום</th>
                <th className="border p-2">סעיף תקציבי</th>
                <th className="border p-2">שם סעיף תקציבי</th>
                <th
                  className="border p-2 cursor-pointer select-none"
                  onClick={() => {
                    setSortKey('created_at');
                    setSortOrder(sortKey === 'created_at' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  תאריך יצירה {sortKey === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="border p-2">תאריך אספקה</th>
                <th className="border p-2">מקום אספקה</th>
                <th className="border p-2">ע"פ חוזה</th>
                <th className="border p-2">הצעת מחיר</th>
                <th className="border p-2">משרד ממשלתי</th>
                <th className="border p-2">מס' תב"ר</th>
                <th className="border p-2">שלב פרויקט</th>
                <th className="border p-2">מחלקה מזמינה</th>
                <th className="border p-2">הערות</th>
                <th className="border p-2">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 text-center">
                  <td className="border p-2">{report.id}</td>
                  <td className="border p-2">{report.project_id}</td>
                  <td className="border p-2">
                    <span
                      className={
                        "rounded px-2 py-1 text-xs font-bold " +
                        (report.status === "מאושר"
                          ? "bg-green-100 text-green-700"
                          : report.status === "נשלח"
                          ? "bg-blue-100 text-blue-700"
                          : report.status === "נדחה"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700")
                      }
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="border p-2">{report.order_id}</td>
                  <td className="border p-2">{report.order_description}</td>
                  <td className="border p-2">{report.amount}</td>
                  <td className="border p-2">{report.budget_item_id}</td>
                  <td className="border p-2">{report.budget_item_name}</td>
                  <td className="border p-2">
                    {report.created_at
                      ? new Date(report.created_at).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="border p-2">
                    {report.supply_date
                      ? new Date(report.supply_date).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="border p-2">{report.supply_location}</td>
                  <td className="border p-2">{report.contract_id}</td>
                  <td className="border p-2">{report.quote}</td>
                  <td className="border p-2">{report.ministry_id}</td>
                  <td className="border p-2">{report.tabar_id}</td>
                  <td className="border p-2">{report.project_stage}</td>
                  <td className="border p-2">{report.requesting_department_id}</td>
                  <td className="border p-2">{report.notes}</td>
                  <td className="border p-2">
                    <button
                      className="text-gray-600 hover:underline mr-2"
                      onClick={() => handleShowDetails(report.id)}
                    >
                      פרטים
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(report.id)}
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modal לפרטי דוח ועריכה --- */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-lg relative">
            <button className="absolute top-2 left-2 text-gray-500"
              onClick={() => { setShowDetails(false); setSelectedReport(null); setEditMode(false); }}>
              סגור
            </button>
            {detailsLoading ? (
              <p>טוען...</p>
            ) : detailsError ? (
              <p className="text-red-500">{detailsError}</p>
            ) : selectedReport && !editMode ? (
              <>
                <h2 className="text-lg font-bold mb-4">פרטי דוח #{selectedReport.id}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-semibold">סטטוס:</span>
                  <span>{selectedReport.status}</span>
                  <span className="font-semibold">פרויקט:</span>
                  <span>{selectedReport.project_id}</span>
                  <span className="font-semibold">מס' הזמנה:</span>
                  <span>{selectedReport.order_id}</span>
                  <span className="font-semibold">סכום:</span>
                  <span>{selectedReport.amount}</span>
                  <span className="font-semibold">תאריך דיווח:</span>
                  <span>{selectedReport.report_date ? new Date(selectedReport.report_date).toLocaleDateString() : ''}</span>
                  <span className="font-semibold">הערות:</span>
                  <span>{selectedReport.notes}</span>
                  {/* הוסף עוד שדות שתרצה להציג כאן */}
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleEdit}>
                    ערוך
                  </button>
                </div>
              </>
            ) : editMode && editReport ? (
              <form onSubmit={handleSaveEdit} className="space-y-2">
                <h2 className="text-lg font-bold mb-4">עריכת דוח #{editReport.id}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label>סטטוס:</label>
                  <select
                    className="border p-1 rounded"
                    name="status"
                    value={editReport.status || ""}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="טיוטה">טיוטה</option>
                    <option value="נשלח">נשלח</option>
                    <option value="מאושר">מאושר</option>
                    <option value="נדחה">נדחה</option>
                  </select>
                  <label>הערות:</label>
                  <input
                    className="border p-1 rounded"
                    name="notes"
                    value={editReport.notes || ""}
                    onChange={handleEditFormChange}
                  />
                  {/* הוסף עוד שדות לעריכה לפי הצורך */}
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <button className="bg-gray-200 rounded px-4 py-1" type="button" onClick={() => setEditMode(false)}>
                    ביטול
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-1 rounded" type="submit" disabled={saving}>
                    שמור
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
