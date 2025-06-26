import React from "react"
import { 
  LayoutDashboard,
  FileText, 
  FolderKanban, 
  FileSpreadsheet,
  Settings,
  BarChartBig,
  PanelLeft,
  LogOut,
  User
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { usePermissions } from "../hooks/usePermissions"
import { Button } from "./ui/button"
import { ErrorHandler } from "../utils/errorHandling"

// Define menu items with their corresponding page IDs from database
interface MenuItem {
  title: string;
  url: string;
  icon: any;
  pageId: number;
}

const MENU_ITEMS: MenuItem[] = [
  { title: "דשבורד", url: "/dashboard", icon: LayoutDashboard, pageId: 1 },
  { title: "דיווחים", url: "/reports-management", icon: FileText, pageId: 11 },
  { title: "ניהול פרויקטים", url: "/projects", icon: FolderKanban, pageId: 2 },
  { title: "תב\"רים", url: "/tabarim", icon: FileSpreadsheet, pageId: 3 },
  { title: "דוחות", url: "/reports", icon: BarChartBig, pageId: 4 },
  { title: "ניהול מערכת", url: "/admin", icon: Settings, pageId: 25 },
];

export function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const { user, logout } = useAuth()
  const { canAccessPage, loading: permissionsLoading } = usePermissions()
  
  // Filter menu items based on user permissions using safe filter
  const visibleItems = ErrorHandler.safeFilter<MenuItem>(MENU_ITEMS, (item: MenuItem) => {
    if (permissionsLoading) return false; // Hide all items while loading permissions
    try {
      // Convert pageId to string for consistency with permissions system
      return canAccessPage(item.pageId.toString());
    } catch (error) {
      console.warn(`Error checking permissions for page ${item.pageId}:`, error);
      return false;
    }
  });

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

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-slate-700">
          {!isCollapsed ? (
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-slate-300" />
                <span className="text-sm font-medium text-white">{user.full_name}</span>
              </div>
              <div className="text-xs text-slate-400">{user.tenant_name}</div>
              <div className="text-xs text-blue-300">{user.role_name}</div>
              {permissionsLoading && (
                <div className="text-xs text-yellow-300 mt-1">טוען הרשאות...</div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <User className="h-6 w-6 text-slate-300" />
            </div>
          )}
        </div>
      )}

      {/* Menu */}
      <div className="p-4">
        {!isCollapsed && (
          <h3 className="text-sm text-slate-400 mb-4 text-right">תפריט עיקרי</h3>
        )}
        
        {permissionsLoading ? (
          <div className="text-center text-slate-400 py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            {!isCollapsed && <span className="text-sm">טוען הרשאות...</span>}
          </div>
        ) : (
        <nav className="space-y-2">
            {visibleItems.length === 0 ? (
              <div className="text-center text-slate-400 py-4">
                {!isCollapsed && <span className="text-sm">אין הרשאות זמינות</span>}
              </div>
            ) : (
              visibleItems.map((item, index) => {
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
              })
            )}
        </nav>
        )}

        {/* Logout Button */}
        <div className="mt-8 pt-4 border-t border-slate-700">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right hover:bg-red-600 text-slate-200 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
            title={isCollapsed ? 'התנתק' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="flex-1 text-right">התנתק</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
