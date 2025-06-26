import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, DollarSign, Building2, FileText, Users, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabarimService } from '@/services/tabarimService';

type TabarDetailsProps = {
  id: number | string;
  onClose: () => void;
};

export default function TabarDetails({ id, onClose }: TabarDetailsProps) {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"main" | "supervision">("main");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTabarDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await TabarimService.fetchTabarDetails(id);
        setData(data);
      } catch (error) {
        console.error('Error fetching tabar details:', error);
        setError('שגיאה בטעינת פרטי התב"ר');
      } finally {
        setLoading(false);
      }
    };

    fetchTabarDetails();
  }, [id]);

  if (!data) return (
    <div className="flex justify-center items-center min-h-40">טוען נתונים...</div>
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          className={`rounded-xl px-4 py-2 text-base font-bold border transition ${
            tab === "main"
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-white text-gray-600 border-gray-200"
          }`}
          onClick={() => setTab("main")}
        >
          תצוגה
        </button>
        <button
          className={`rounded-xl px-4 py-2 text-base font-bold border transition ${
            tab === "supervision"
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-white text-gray-600 border-gray-200"
          }`}
          onClick={() => setTab("supervision")}
        >
          פיקוח תקציבי
        </button>
        <button
          className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-2 text-base"
          onClick={onClose}
        >
          סגור
        </button>
      </div>
      {tab === "main" ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            פרטי תב"ר: {data.tabar.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="font-bold">מספר תב"ר:</td><td>{data.tabar.number}</td></tr>
                <tr><td className="font-bold">שנה:</td><td>{data.tabar.year}</td></tr>
                <tr><td className="font-bold">מס' הרשאה:</td><td>{data.tabar.permission_number}</td></tr>
                <tr><td className="font-bold">תאריך פתיחה:</td><td>{data.tabar.open_date}</td></tr>
                <tr><td className="font-bold">תאריך הרשאה:</td><td>{data.tabar.permission_date}</td></tr>
                <tr><td className="font-bold">תאריך סגירה:</td><td>{data.tabar.close_date}</td></tr>
                <tr><td className="font-bold">סכום הרשאה:</td><td>{data.tabar.sum?.toLocaleString()}</td></tr>
                <tr><td className="font-bold">סכום מאצ'ינג:</td><td>{data.tabar.matching?.toLocaleString()}</td></tr>
                <tr><td className="font-bold">משרד מממן:</td><td>{data.tabar.ministry}</td></tr>
                <tr><td className="font-bold">סטטוס:</td>
                  <td>
                    <span className="px-2 py-1 rounded-xl bg-green-100 text-green-800 text-xs font-bold">
                      {data.tabar.status}
                    </span>
                  </td>
                </tr>
                <tr><td className="font-bold">מחלקה:</td><td>{data.tabar.department}</td></tr>
              </tbody>
            </table>
            <div>
              <div className="mb-2 font-bold">מסמכים:</div>
              <ul className="list-disc list-inside space-y-1">
                {data.documents.map((doc: any) => (
                  <li key={doc.id}>
                    <a href={doc.url} className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">{doc.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="font-bold mb-2">סעיפים תקציביים</div>
            <table className="w-full border text-sm rounded-xl overflow-hidden mb-4">
              <thead>
                <tr className="bg-blue-50 text-blue-800">
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
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-blue-900">פיקוח תקציבי תב"ר {data.tabar.number}</h2>
          <div className="font-bold mb-1 mt-2">כרטסת תנועות</div>
          <table className="w-full border text-sm rounded-xl overflow-hidden mb-6">
            <thead>
              <tr className="bg-blue-50 text-blue-800">
                <th className="py-2 px-2 font-bold">תאריך</th>
                <th className="py-2 px-2 font-bold">מספר תנועה</th>
                <th className="py-2 px-2 font-bold">סוג</th>
                <th className="py-2 px-2 font-bold">סעיף</th>
                <th className="py-2 px-2 font-bold">סכום</th>
                <th className="py-2 px-2 font-bold">חובה/זכות</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx: any, i: number) => (
                <tr key={i}>
                  <td className="py-1 px-2">{tx.transaction_date}</td>
                  <td className="py-1 px-2">{tx.id}</td>
                  <td className="py-1 px-2">{tx.type}</td>
                  <td className="py-1 px-2">{tx.section}</td>
                  <td className="py-1 px-2">{tx.sum?.toLocaleString?.() || tx.sum}</td>
                  <td className="py-1 px-2">{tx.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* הוסף כאן סיכומים, הזמנות, חוזים וכו' לפי נתונים מה־API */}
        </>
      )}
    </div>
  );
}
