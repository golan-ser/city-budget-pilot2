import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // קריאה לדאטה אמיתי מה־API
  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/users`).then(res => res.json()),
      fetch(`${import.meta.env.VITE_API_URL}/api/departments`).then(res => res.json())
    ])
      .then(([users, departments]) => {
        setUsers(users);
        setDepartments(departments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getDepartmentName = (id) => departments.find((dep) => dep.id === id)?.name || "";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      <div className="text-right">
        <h1 className="text-3xl font-bold text-primary">ניהול מערכת</h1>
        <p className="text-muted-foreground mt-2">הגדרות מערכת, משתמשים והרשאות</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="users">משתמשים</TabsTrigger>
          <TabsTrigger value="alerts">התראות</TabsTrigger>
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
          <TabsTrigger value="integration">התממשקות</TabsTrigger>
        </TabsList>

        {/* לשונית ניהול משתמשים */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף משתמש
            </Button>
            <h3 className="text-xl font-semibold">ניהול משתמשים</h3>
          </div>

          <Card>
            <CardContent>
              {loading ? (
                <p>טוען נתונים...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">פעולות</TableHead>
                      <TableHead className="text-right">תפקיד</TableHead>
                      <TableHead className="text-right">מחלקה</TableHead>
                      <TableHead className="text-right">אימייל</TableHead>
                      <TableHead className="text-right">שם</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm">ערוך</Button>
                            <Button variant="outline" size="sm">הרשאות</Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{user.role}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{getDepartmentName(user.department_id)}</TableCell>
                        <TableCell className="text-right">{user.email}</TableCell>
                        <TableCell className="text-right font-medium">{user.full_name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* לשונית התראות — אפשר להוסיף קריאה אמיתית ל־API */}
        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">התראות מערכת</h3>
          <p>תצוגת התראות (להשלים בעתיד לפי API).</p>
        </TabsContent>

        {/* הגדרות, התממשקות — להוסיף בהמשך לפי קצב הפיתוח */}
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">טבלאות עזר</h3>
          <p>כאן אפשר להוסיף רשימות משרדים, סוגי תב"ר, הרשאות וכד'</p>
        </TabsContent>
        <TabsContent value="integration" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">התממשקות עם מערכות חיצוניות</h3>
          <p>כאן אפשר להוסיף סטטוס התממשקות, חיבורים חיצוניים, ייצוא וכו'</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
