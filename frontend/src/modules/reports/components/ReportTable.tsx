import React from "react";

interface Column {
  key: string;
  header: string;
  render?: (value: any) => React.ReactNode;
}

interface ReportTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
}

const ReportTable = ({ data, columns, loading = false }: ReportTableProps) => {
  if (loading) return <div className="p-4">טוען נתונים...</div>;
  if (!data || data.length === 0)
    return <div className="p-4">לא נמצאו נתונים להצגה.</div>;

  return (
    <div className="overflow-x-auto" dir="rtl">
      <table className="w-full border-collapse border text-right shadow rounded text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="border p-2">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="border p-2">
                  {col.render
                    ? col.render(row[col.key])
                    : row[col.key]?.toString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable; // ← השורה הכי חשובה!
