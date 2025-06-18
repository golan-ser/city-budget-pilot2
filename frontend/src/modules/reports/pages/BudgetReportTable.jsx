import React, { useEffect, useState } from "react";

export default function BudgetReportTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/report-schemas/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "budget_items",
        fields: ["id", "name", "budget", "spent"],
        filters: {}
      })
    })
    .then(res => res.json())
    .then(rows => {
      setData(rows);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>טוען נתונים...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">דוח ניצול תקציב לפי סעיף</h2>
      <table className="w-full border rounded shadow text-right">
        <thead className="bg-gray-100">
          <tr>
            <th>שם סעיף</th>
            <th>תקציב</th>
            <th>בוצע בפועל</th>
            <th>אחוז ניצול</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const budget = Number(row.budget);
            const spent = Number(row.spent);
            const percent = budget > 0 ? ((spent / budget) * 100).toFixed(0) : "0";
            return (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{budget.toLocaleString()} ₪</td>
                <td>{spent.toLocaleString()} ₪</td>
                <td style={{
                  color: budget > 0 && spent / budget >= 0.9 ? 'red' : 'green',
                  fontWeight: 'bold'
                }}>
                  {percent}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
