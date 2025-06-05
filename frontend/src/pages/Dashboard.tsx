
import { StatusCard } from "@/components/StatusCard"
import { ProjectCard } from "@/components/ProjectCard"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { EnhancedTable } from "@/components/ui/enhanced-table"
import { MiniChart } from "@/components/ui/mini-chart"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { ProgressRing } from "@/components/ui/progress-ring"
import { SmartSearch } from "@/components/ui/smart-search"
import { Plus, Download, Eye, TrendingUp, Users, Calendar, Building2 } from "lucide-react"

const Dashboard = () => {
  // Sample data for the enhanced table
  const reportsData = [
    {
      id: "2024-001",
      name: "דוח רבעוני Q1",
      date: "2024-03-15",
      status: "completed",
      budget: 500000,
      actual: 325000,
      progress: 65,
      lastUpdate: "2024-06-03"
    },
    {
      id: "2024-002", 
      name: "פרויקט תשתיות",
      date: "2024-02-28",
      status: "active",
      budget: 800000,
      actual: 750000,
      progress: 94,
      lastUpdate: "2024-06-02"
    },
    {
      id: "2024-003",
      name: "שדרוג מערכות מידע",
      date: "2024-01-20",
      status: "pending", 
      budget: 300000,
      actual: 120000,
      progress: 40,
      lastUpdate: "2024-06-01"
    },
    {
      id: "2024-004",
      name: "פרויקט דיגיטציה",
      date: "2024-04-10",
      status: "completed",
      budget: 450000,
      actual: 450000,
      progress: 100,
      lastUpdate: "2024-05-30"
    }
  ]

  const tableColumns = [
    { key: 'name', title: 'שם הפרויקט', sortable: true, type: 'text' as const },
    { key: 'id', title: 'מספר', sortable: true, type: 'text' as const },
    { key: 'date', title: 'תאריך', sortable: true, type: 'date' as const },
    { key: 'status', title: 'סטטוס', sortable: true, filterable: true, type: 'status' as const },
    { key: 'budget', title: 'תקציב', sortable: true, type: 'currency' as const },
    { key: 'actual', title: 'בוצע', sortable: true, type: 'currency' as const },
    { key: 'progress', title: '% ביצוע', sortable: true, type: 'number' as const },
    { key: 'lastUpdate', title: 'עדכון אחרון', sortable: true, type: 'date' as const },
  ]

  // Sample chart data for mini charts
  const chartData = [
    [{ date: "2024-06-01", value: 175000 }, { date: "2024-06-02", value: 180000 }, { date: "2024-06-03", value: 175000 }],
    [{ date: "2024-06-01", value: 325000 }, { date: "2024-06-02", value: 320000 }, { date: "2024-06-03", value: 325000 }],
    [{ date: "2024-06-01", value: 500000 }, { date: "2024-06-02", value: 510000 }, { date: "2024-06-03", value: 500000 }],
    [{ date: "2024-06-01", value: 65 }, { date: "2024-06-02", value: 68 }, { date: "2024-06-03", value: 65 }]
  ]

  const searchSuggestions = [
    { id: "1", text: "דוח רבעוני Q1", category: "דוחות" },
    { id: "2", text: "פרויקט תשתיות", category: "פרויקטים" },
    { id: "3", text: "שדרוג מערכות מידע", category: "פרויקטים" },
    { id: "4", text: "פרויקט דיגיטציה", category: "פרויקטים" },
    { id: "5", text: "תקציב 2024", category: "כללי" },
    { id: "6", text: "סטטוס פעיל", category: "סטטוס" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6 space-y-8">
      {/* Enhanced Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="heading-display text-gradient-primary">דשבורד ניהול תב"ר</h1>
          <p className="body-large text-muted-foreground">מעקב ובקרה על פרויקטים ותקציבים</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <SmartSearch 
            suggestions={searchSuggestions}
            placeholder="חיפוש פרויקטים, דוחות..."
            className="w-full sm:w-80"
          />
          <div className="flex gap-2">
            <EnhancedButton 
              variant="default" 
              className="gradient-primary hover-lift"
            >
              <Plus className="h-4 w-4 mr-2" />
              פרויקט חדש
            </EnhancedButton>
            <EnhancedButton 
              variant="outline" 
              className="hover-glow"
            >
              <Download className="h-4 w-4 mr-2" />
              ייצא נתונים
            </EnhancedButton>
          </div>
        </div>
      </div>

      {/* Enhanced Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedCard variant="glass" className="hover-lift">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <MiniChart data={chartData[0]} />
            </div>
            <div className="space-y-1">
              <p className="caption">הכנסות חודשיות</p>
              <p className="currency-large financial-positive">₪175,000</p>
              <p className="text-xs text-green-600 dark:text-green-400">+12% מהחודש הקודם</p>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard variant="neumorphic" className="hover-lift">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <MiniChart data={chartData[1]} />
            </div>
            <div className="space-y-1">
              <p className="caption">תקציב מנוצל</p>
              <p className="currency-large financial-positive">₪325,000</p>
              <p className="text-xs text-red-600 dark:text-red-400">-5% מהיעד</p>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard variant="glass" className="hover-lift">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <MiniChart data={chartData[2]} />
            </div>
            <div className="space-y-1">
              <p className="caption">תקציב כולל</p>
              <p className="currency-large financial-neutral">₪500,000</p>
              <p className="text-xs text-green-600 dark:text-green-400">+8% מהרבעון הקודם</p>
            </div>
          </div>
        </EnhancedCard>

        <EnhancedCard variant="neumorphic" className="hover-lift">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <ProgressRing value={65} size={60} />
            </div>
            <div className="space-y-1">
              <p className="caption">השלמת פרויקטים</p>
              <p className="currency-large">65%</p>
              <p className="text-xs text-green-600 dark:text-green-400">+15% מהחודש הקודם</p>
            </div>
          </div>
        </EnhancedCard>
      </div>

      {/* Enhanced Reports Table Section */}
      <EnhancedCard variant="glass" className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="heading-medium">דוחות אחרונים</h2>
          <div className="flex gap-2">
            <EnhancedButton variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              הצג הכל
            </EnhancedButton>
            <EnhancedButton variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              ייצא PDF
            </EnhancedButton>
          </div>
        </div>
        
        <EnhancedTable
          columns={tableColumns}
          data={reportsData}
          title="נתונים מעודכנים"
          searchable={true}
          className="financial-table"
        />
      </EnhancedCard>

      {/* Projects Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="heading-medium">פרויקטים פעילים</h2>
          <EnhancedButton 
            variant="outline" 
            className="hover-lift"
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף פרויקט
          </EnhancedButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard 
            id="1"
            name="שיפוץ בית ספר יסודי"
            tavarNumber="2024-001"
            budget={450000}
            used={337500}
            status="active"
            ministry="משרד החינוך"
            lastUpdate="15/12/2024"
          />
          <ProjectCard 
            id="2"
            name="פיתוח מערכת דיגיטלית"
            tavarNumber="2024-002"
            budget={280000}
            used={126000}
            status="pending"
            ministry="משרד הפנים"
            lastUpdate="30/01/2025"
          />
          <ProjectCard 
            id="3"
            name="שדרוג תשתיות תקשורת"
            tavarNumber="2024-003"
            budget={620000}
            used={558000}
            status="active"
            ministry="משרד התקשורת"
            lastUpdate="10/11/2024"
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
