import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Loader2 } from "lucide-react";
import { OpenAIStatus } from "@/components/OpenAIStatus";

// דוגמאות לערכים אפשריים (ניתן לשלוף גם מה-DB)
const years = [2023, 2024, 2025];
const statuses = ["פעיל", "הסתיים", "מתעכב"];
const ministries = [
  { name: "משרד החינוך" },
  { name: "משרד התחבורה" },
  { name: "פיתוח הפריפריה הנגב והגליל" }
];

type Tabar = {
  id: number;
  tabar_number: number;
  name: string;
  year: number;
  status: string;
  ministry: string;
  total_authorized: number;
};

export default function Analytics() {
  // סינון
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string | "">("");
  const [selectedMinistry, setSelectedMinistry] = useState<string | "">("");

  const [data, setData] = useState<Tabar[]>([]);
  const [loading, setLoading] = useState(true);

  // KPIs
  const [totalBudget, setTotalBudget] = useState(0);

  // פילטרים דינמיים
  const buildFilters = () => {
    const filters: any = {};
    if (selectedYear) filters.year = selectedYear;
    if (selectedStatus) filters.status = selectedStatus;
    if (selectedMinistry) filters.ministry = selectedMinistry;
    return filters;
  };

  useEffect(() => {
    setLoading(true);
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/report-schemas/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "tabarim",
        fields: [
          "id",
          "tabar_number",
          "name",
          "year",
          "status",
          "ministry",
          "total_authorized"
        ],
        filters: buildFilters()
      }),
    })
      .then(res => res.json())
      .then((rows) => {
        const safeRows = Array.isArray(rows) ? rows : [];
        setData(safeRows);
        if (safeRows.length > 0) {
          const sumBudget = safeRows.reduce((acc, cur) => acc + Number(cur.total_authorized), 0);
          setTotalBudget(sumBudget);
        } else {
          setTotalBudget(0);
        }
        setLoading(false);
      })
      .catch(() => {
        setData([]);
        setTotalBudget(0);
        setLoading(false);
      });
  }, [selectedYear, selectedStatus, selectedMinistry]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-primary">דוחות וניתוח ניצול תקציב</h1>
        <p className="text-muted-foreground mt-2">סיכומי תקציב ונתונים לפי תב"רים/פרויקטים</p>
      </div>

      {/* טופס סינון דינמי */}
      <div className="flex flex-wrap gap-4 justify-end items-center mb-4">
        <select
          className="border rounded p-2"
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">כל השנים</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">כל הסטטוסים</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={selectedMinistry}
          onChange={e => setSelectedMinistry(e.target.value)}
        >
          <option value="">כל המשרדים</option>
          {ministries.map(m => (
            <option key={m.name} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-right">
            <div className="text-2xl font-bold text-primary">
              ₪{totalBudget.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">סך כל התקציב המאושר</div>
          </CardContent>
        </Card>
        
        {/* OpenAI Status */}
        <div className="md:col-span-2">
          <OpenAIStatus />
        </div>
      </div>

      {/* טבלת דוח ניצול תקציב */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                ייצוא Excel
              </Button>
              <Button variant="outline" size="sm">
                ייצוא PDF
              </Button>
            </div>
            <CardTitle className="text-right">תקציב לפי תב"ר / פרויקט</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">מספר תב"ר</TableHead>
                  <TableHead className="text-right">שם פרויקט</TableHead>
                  <TableHead className="text-right">שנה</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">משרד</TableHead>
                  <TableHead className="text-right">תקציב מאושר</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(data) && data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-right">{item.tabar_number}</TableCell>
                    <TableCell className="text-right">{item.name}</TableCell>
                    <TableCell className="text-right">{item.year}</TableCell>
                    <TableCell className="text-right">{item.status}</TableCell>
                    <TableCell className="text-right">{item.ministry}</TableCell>
                    <TableCell className="text-right">₪{Number(item.total_authorized).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
