import { useEffect, useState } from "react";

export function useReports(module: string, fields: string[], filters: any) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token') || 'DEMO_SECURE_TOKEN_2024';
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/report-schemas/run`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ module, fields, filters })
        });

        if (!res.ok) throw new Error("Fetch failed");

        const json = await res.json();
        setData(json.data || []);
      } catch (e) {
        console.error("שגיאה בטעינת הדוח", e);
        setData([]);
      }
      setLoading(false);
    };

    fetchData();
  }, [JSON.stringify(filters)]);

  return { data, loading };
}
