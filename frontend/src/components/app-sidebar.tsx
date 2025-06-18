import React from "react"
import { 
  LayoutDashboard,
  FileText, 
  FolderKanban, 
  FileSpreadsheet,
  Settings,
  BarChartBig,
  PanelLeft
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"

const items = [
  { title: "דשבורד", url: "/dashboard", icon: LayoutDashboard },
  { title: "דיווחים", url: "/analytics", icon: FileText },
  { title: "ניהול פרויקטים", url: "/projects", icon: FolderKanban },
  { title: "תב\"רים", url: "/tabarim", icon: FileSpreadsheet },
  { title: "דוחות", url: "/reports", icon: BarChartBig },
  { title: "ניהול מערכת", url: "/admin", icon: Settings },
]

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const isActive = (path: string) => {
    return currentPath === path
  }

  const handleNavigation = (url: string) => {
    navigate(url)
  }

  return (
    <div className={`fixed top-0 right-0 h-full bg-slate-900 text-white transition-all duration-300 z-50 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-right">
            <h2 className="text-lg font-bold">מערכת תב"ר</h2>
            <p className="text-sm text-slate-300">ניהול פרויקטים</p>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-700 rounded"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Menu */}
      <div className="p-4">
        {!isCollapsed && (
          <h3 className="text-sm text-slate-400 mb-4 text-right">תפריט עיקרי</h3>
        )}
        
        <nav className="space-y-2">
          {items.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.url)
            
            return (
              <button
                key={index}
                onClick={() => handleNavigation(item.url)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right ${
                  active 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-700 text-slate-200'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 text-right">{item.title}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
