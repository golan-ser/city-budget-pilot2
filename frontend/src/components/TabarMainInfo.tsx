import React from "react";

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString("he-IL");
  } catch {
    return date;
  }
}

export default function TabarMainInfo({ data }: { data: any }) {
  const tabar = data.tabar;
  if (!tabar) return <div>אין נתוני תב"ר להצגה</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">פרטי תב"ר</h2>
      <table className="w-full text-lg mb-8 border-separate border-spacing-y-2">
        <tbody>
          <tr>
            <td className="font-bold text-gray-800 w-44">מספר תב"ר:</td>
            <td className="text-blue-900">{tabar.tabar_number || tabar.number}</td>
            <td className="font-bold text-gray-800 w-44">שם תב"ר:</td>
            <td>{tabar.name}</td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">שנה:</td>
            <td>{tabar.year}</td>
            <td className="font-bold text-gray-800">מס' הרשאה:</td>
            <td>{tabar.permission_number}</td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">תאריך פתיחה:</td>
            <td>{formatDate(tabar.open_date)}</td>
            <td className="font-bold text-gray-800">תאריך הרשאה:</td>
            <td>{formatDate(tabar.permission_date)}</td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">תאריך סגירה:</td>
            <td>{formatDate(tabar.close_date)}</td>
            <td className="font-bold text-gray-800">סכום הרשאה:</td>
            <td>{(tabar.sum || tabar.total_authorized)?.toLocaleString()}</td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">סכום מאצ'ינג:</td>
            <td>{(tabar.matching || tabar.municipal_participation)?.toLocaleString()}</td>
            <td className="font-bold text-gray-800">משרד מממן:</td>
            <td>{tabar.ministry}</td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">סטטוס:</td>
            <td colSpan={3}>
              <span className="inline-block px-3 py-1 rounded-xl bg-green-100 text-green-800 text-base font-bold">
                {tabar.status}
              </span>
            </td>
          </tr>
          <tr>
            <td className="font-bold text-gray-800">מחלקה:</td>
            <td>{tabar.department}</td>
            <td className="font-bold text-gray-800">קרן/גוף מממן נוסף:</td>
            <td>{tabar.additional_funders}</td>
          </tr>
        </tbody>
      </table>

      <div className="font-bold mb-2 text-xl">סעיפים תקציביים</div>
      <table className="w-full border text-lg rounded-xl overflow-hidden mb-4">
        <thead>
          <tr className="bg-blue-50 text-blue-800 text-base">
            <th className="py-2 px-2 font-bold">סעיף</th>
            <th className="py-2 px-2 font-bold">סוג</th>
            <th className="py-2 px-2 font-bold">ניצול</th>
            <th className="py-2 px-2 font-bold">יתרה</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item: any) => (
            <tr key={item.code}>
              <td className="py-1 px-2">{item.code}</td>
              <td className="py-1 px-2">{item.type}</td>
              <td className="py-1 px-2">{item.used?.toLocaleString?.() || item.used}</td>
              <td className="py-1 px-2">{item.balance?.toLocaleString?.() || item.balance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
