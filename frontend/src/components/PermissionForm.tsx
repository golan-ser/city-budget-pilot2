import React, { useState } from "react";
import OcrUpload from "./OcrUpload";

const PermissionForm = () => {
  const [form, setForm] = useState({
    permission_number: "",
    ministry: "",
    amount: "",
    start_date: "",
    end_date: "",
    description: "",
    // ...שדות נוספים...
  });

  const handleOcrExtracted = (data: any) => {
    setForm((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // כאן תוכל לשגר ל־API את הנתונים
    alert("נשמר בהצלחה!\n" + JSON.stringify(form, null, 2));
  };

  return (
    <form className="p-4 bg-white rounded shadow max-w-xl mx-auto" dir="rtl" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold mb-4">יצירת הרשאה חדשה</h2>
      <OcrUpload onExtracted={handleOcrExtracted} />
      <div className="mb-2">
        <label>מספר הרשאה:</label>
        <input
          className="border rounded p-1 w-full"
          name="permission_number"
          value={form.permission_number}
          onChange={handleChange}
        />
      </div>
      <div className="mb-2">
        <label>משרד מממן:</label>
        <input
          className="border rounded p-1 w-full"
          name="ministry"
          value={form.ministry}
          onChange={handleChange}
        />
      </div>
      <div className="mb-2">
        <label>סכום הרשאה:</label>
        <input
          className="border rounded p-1 w-full"
          name="amount"
          value={form.amount}
          onChange={handleChange}
        />
      </div>
      <div className="mb-2">
        <label>תאריך התחלה:</label>
        <input
          className="border rounded p-1 w-full"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
        />
      </div>
      <div className="mb-2">
        <label>תאריך סיום:</label>
        <input
          className="border rounded p-1 w-full"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
        />
      </div>
      <div className="mb-2">
        <label>תיאור:</label>
        <input
          className="border rounded p-1 w-full"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-1 rounded mt-4"
      >
        שמור
      </button>
    </form>
  );
};

export default PermissionForm;
