import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Plus } from "lucide-react"

const mockUsers = [
  { id: 1, name: "יעל כהן", email: "yael@example.com", role: "מנהל פרויקטים", department: "חינוך", lastActive: "15/11/2024" },
  { id: 2, name: "משה לוי", email: "moshe@example.com", role: "מדווח", department: "תרבות", lastActive: "14/11/2024" },
  { id: 3, name: "רחל אברהם", email: "rachel@example.com", role: "מאשר", department: "רווחה", lastActive: "13/11/2024" },
  { id: 4, name: "דוד שמיר", email: "david@example.com", role: "מנהל מערכת", department: "IT", lastActive: "16/11/2024" }
]

const mockAlerts = [
  { id: 1, type: "הרשאה", message: "הרשאה של יעל כהן תפוג בעוד 5 ימים", priority: "high", date: "16/11/2024" },
  { id: 2, type: "תקציב", message: "פרויקט תב\"ר 2024-002 ללא ניצול תקציב 30 יום", priority: "medium", date: "15/11/2024" },
  { id: 3, type: "דיווח", message: "פרויקט שדרוג מתקני ספורט ללא דיווח 45 יום", priority: "high", date: "14/11/2024" },
  { id: 4, type: "מערכת", message: "גיבוי נתונים הושלם בהצלחה", priority: "low", date: "16/11/2024" }
]

const mockMinistries = [
  { id: 1, name: "משרד החינוך", code: "EDU", status: "active" },
  { id: 2, name: "משרד הספורט", code: "SPT", status: "active" },
  { id: 3, name: "משרד התרבות", code: "CUL", status: "active" },
  { id: 4, name: "משרד הרווחה", code: "WEL", status: "inactive" }
]

export default function Admin() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-primary">ניהול מערכת</h1>
        <p className="text-muted-foreground mt-2">הגדרות מערכת, משתמשים והרשאות</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">משתמשים</TabsTrigger>
          <TabsTrigger value="alerts">התראות</TabsTrigger>
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
          <TabsTrigger value="integration">התממשקות</TabsTrigger>
        </TabsList>
        
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">פעולות</TableHead>
                    <TableHead className="text-right">פעילות אחרונה</TableHead>
                    <TableHead className="text-right">מחלקה</TableHead>
                    <TableHead className="text-right">תפקיד</TableHead>
                    <TableHead className="text-right">אימייל</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm">ערוך</Button>
                          <Button variant="outline" size="sm">הרשאות</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{user.lastActive}</TableCell>
                      <TableCell className="text-right">{user.department}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{user.email}</TableCell>
                      <TableCell className="text-right font-medium">{user.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">התראות מערכת</h3>
          
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <Card key={alert.id} className={`border-r-4 ${
                alert.priority === 'high' ? 'border-r-destructive' :
                alert.priority === 'medium' ? 'border-r-warning' :
                'border-r-muted'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <Badge variant={
                        alert.priority === 'high' ? 'destructive' :
                        alert.priority === 'medium' ? 'secondary' :
                        'outline'
                      }>
                        {alert.priority === 'high' ? 'דחוף' :
                         alert.priority === 'medium' ? 'בינוני' :
                         'נמוך'}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{alert.date}</p>
                    </div>
                    <div className="text-right flex-1">
                      <h4 className="font-semibold text-sm">{alert.type}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">טבלאות עזר</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-right">משרדים ממשלתיים</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockMinistries.map((ministry) => (
                    <div key={ministry.id} className="flex justify-between items-center p-2 rounded-lg border">
                      <Badge variant={ministry.status === 'active' ? 'default' : 'secondary'}>
                        {ministry.status === 'active' ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium">{ministry.name}</p>
                        <p className="text-sm text-muted-foreground">{ministry.code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-right">סוגי תב"ר</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 rounded-lg border">
                    <Badge>פעיל</Badge>
                    <div className="text-right">
                      <p className="font-medium">תשתיות</p>
                      <p className="text-sm text-muted-foreground">INF</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg border">
                    <Badge>פעיל</Badge>
                    <div className="text-right">
                      <p className="font-medium">חינוך ותרבות</p>
                      <p className="text-sm text-muted-foreground">EDC</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg border">
                    <Badge>פעיל</Badge>
                    <div className="text-right">
                      <p className="font-medium">רווחה ובריאות</p>
                      <p className="text-sm text-muted-foreground">WEL</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="integration" className="space-y-4">
          <h3 className="text-xl font-semibold text-right">התממשקות עם מערכות חיצוניות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">מערכת מרכבה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">סטטוס חיבור:</p>
                  <Badge variant="default" className="mt-1">מחובר</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">סנכרון אחרון:</p>
                  <p className="text-sm font-medium">16/11/2024 14:30</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm">בדוק חיבור</Button>
                  <Button size="sm">הגדר API</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-right">ייצוא Excel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">פורמט ברירת מחדל:</p>
                  <p className="text-sm font-medium">XLSX עם עיצוב RTL</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">תבנית דוח:</p>
                  <p className="text-sm font-medium">תקנית רשות מקומית</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm">ערוך תבנית</Button>
                  <Button size="sm">הגדרות ייצוא</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
