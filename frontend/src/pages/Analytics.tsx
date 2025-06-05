import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, Plus } from "lucide-react"

const mockAnalyticsData = [
  {
    id: "1",
    projectName: "שיפוץ בית ספר יסודי",
    tavarNumber: "2024-001",
    ministry: "חינוך",
    budget: 500000,
    used: 325000,
    utilization: 65,
    status: "פעיל",
    lastReport: "15/11/2024"
  },
  {
    id: "2",
    projectName: "בניית גן ילדים חדש", 
    tavarNumber: "2024-002",
    ministry: "חינוך",
    budget: 800000,
    used: 750000,
    utilization: 94,
    status: "מעוכב",
    lastReport: "10/11/2024"
  },
  {
    id: "3",
    projectName: "שדרוג מתקני ספורט",
    tavarNumber: "2024-003",
    ministry: "ספורט",
    budget: 300000,
    used: 120000,
    utilization: 40,
    status: "בהמתנה",
    lastReport: "01/11/2024"
  },
  {
    id: "4",
    projectName: "תשתית דיגיטלית",
    tavarNumber: "2024-004",
    ministry: "טכנולוגיות",
    budget: 450000,
    used: 450000,
    utilization: 100,
    status: "הושלם",
    lastReport: "03/11/2024"
  }
]

export default function Analytics() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-primary">דוחות וניתוחים</h1>
        <p className="text-muted-foreground mt-2">הפקת דוחות מתקדמים וניתוח נתונים</p>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">הגדרות דוח</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="בחר שנה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="משרד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="education">חינוך</SelectItem>
                <SelectItem value="sports">ספורט</SelectItem>
                <SelectItem value="culture">תרבות</SelectItem>
                <SelectItem value="welfare">רווחה</SelectItem>
                <SelectItem value="technology">טכנולוגיות</SelectItem>
              </SelectContent>
            </Select>
            
            <Select>
              <SelectTrigger className="text-right">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">פעיל</SelectItem>
                <SelectItem value="pending">בהמתנה</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
                <SelectItem value="delayed">מעוכב</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="חיפוש..." className="pr-10 text-right" />
            </div>
            
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              הפק דוח
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-right">
            <div className="text-2xl font-bold text-primary">₪2,050,000</div>
            <div className="text-sm text-muted-foreground">סך כל התקציב</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-right">
            <div className="text-2xl font-bold text-accent">₪1,645,000</div>
            <div className="text-sm text-muted-foreground">תקציב נוצל</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-right">
            <div className="text-2xl font-bold text-warning">80%</div>
            <div className="text-sm text-muted-foreground">אחוז ניצול ממוצע</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-right">
            <div className="text-2xl font-bold text-destructive">3</div>
            <div className="text-sm text-muted-foreground">פרויקטים ללא דיווח</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Table */}
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
            <CardTitle className="text-right">נתונים מפורטים</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">דיווח אחרון</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">% ניצול</TableHead>
                <TableHead className="text-right">נוצל</TableHead>
                <TableHead className="text-right">תקציב</TableHead>
                <TableHead className="text-right">משרד</TableHead>
                <TableHead className="text-right">תב"ר</TableHead>
                <TableHead className="text-right">שם פרויקט</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAnalyticsData.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/50">
                  <TableCell className="text-right">{project.lastReport}</TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'פעיל' ? 'bg-accent/20 text-accent' :
                      project.status === 'הושלם' ? 'bg-green-100 text-green-700' :
                      project.status === 'מעוכב' ? 'bg-destructive/20 text-destructive' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {project.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${
                      project.utilization > 90 ? 'text-destructive' :
                      project.utilization > 70 ? 'text-warning' :
                      'text-accent'
                    }`}>
                      {project.utilization}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">₪{project.used.toLocaleString()}</TableCell>
                  <TableCell className="text-right">₪{project.budget.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{project.ministry}</TableCell>
                  <TableCell className="text-right font-medium">{project.tavarNumber}</TableCell>
                  <TableCell className="text-right font-medium">{project.projectName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">תבניות דוחות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <h4 className="font-semibold">דוח ניצול תקציב</h4>
                <p className="text-sm text-muted-foreground mt-1">סיכום ניצול לפי משרדים ופרויקטים</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
                <h4 className="font-semibold">דוח התקדמות</h4>
                <p className="text-sm text-muted-foreground mt-1">מעקב אחר השלמת אבני דרך</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-warning mx-auto mb-2" />
                <h4 className="font-semibold">דוח חריגות</h4>
                <p className="text-sm text-muted-foreground mt-1">פרויקטים מעוכבים וחריגי תקציב</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
