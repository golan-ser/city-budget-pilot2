import React from "react";
import BudgetMovementsTable from "./BudgetMovementsTable";

export default function TabarSupervision({ data }: { data: any }) {
  // הגנה: אם אין תנועות
  if (!data.transactions || !Array.isArray(data.transactions)) {
    return <div>אין נתוני תנועות להצגה</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">פיקוח תקציבי</h2>
      {/* === כרטסת תנועות עם ייצוא אקסל + PDF וסיכומים === */}
      <BudgetMovementsTable movements={data.transactions} />

      {/* כאן אפשר להוסיף טבלאות: הזמנות, חוזים, מקורות מימון וכו' */}
    </div>
  );
}
