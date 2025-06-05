
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Dashboard from "./Dashboard"
import Reports from "./Reports" 
import Projects from "./Projects"
import Analytics from "./Analytics"
import Admin from "./Admin"

function AppContent() {
  const location = useLocation()
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'דשבורד'
      case '/reports': return 'דיווחים'
      case '/projects': return 'ניהול פרויקטים'
      case '/analytics': return 'דוחות'
      case '/admin': return 'ניהול מערכת'
      default: return 'מערכת תב"ר'
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 transition-all duration-500">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Enhanced Top Header */}
          <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary hover:bg-muted/50 transition-colors duration-200" />
            </div>
            
            <div className="text-right flex items-center gap-4">
              <div>
                <h1 className="text-lg font-bold text-gradient-primary">{getPageTitle()}</h1>
                <p className="text-xs text-muted-foreground/80">מערכת ניהול תב"ר ופרויקטים</p>
              </div>
              <ThemeToggle />
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

const Index = () => {
  return <AppContent />
}

export default Index
