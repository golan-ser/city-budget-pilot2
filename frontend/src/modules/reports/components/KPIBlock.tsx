import React from "react";

export const KPIBlock = ({ data, loading }: { data: any[]; loading: boolean }) => {
  if (loading || !data.length) return null;
  const total = data.reduce((sum, row) => sum + (Number(row.total_authorized) || 0), 0);

  return (
    <div className="bg-white shadow rounded-xl p-4 text-right">
      <div className="text-gray-500">סך התקציב המאושר</div>
      <div className="text-2xl font-bold text-blue-600">₪{total.toLocaleString()}</div>
    </div>
  );
};
