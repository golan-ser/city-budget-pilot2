import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Analytics from "./Analytics";
import Projects from "./Projects";
import Admin from "./Admin";
import Tabarim from "./Tabarim";
import ReportsHome from "@/modules/reports";

// 🆕 דוחות מתוך מודול reports
import TabarBudgetReport from "../modules/reports/pages/TabarBudgetReport";
import BudgetItemsReport from "../modules/reports/pages/BudgetItemsReport";
import FullTabarReport from "../modules/reports/pages/FullTabarReport";
import SmartQueryReport from "../modules/smart-query-engine/SmartQueryReport";

function AppContent() {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "דשבורד";
      case "/analytics":
        return "דיווחים";
      case "/projects":
        return "ניהול פרויקטים";
      case "/tabarim":
        return "תב\"רים";
      case "/reports":
        return "דוחות";
      case "/reports/budget-items":
        return "דוח סעיפי תקציב";
      case "/reports/tabar-budget":
        return "דוח תב\"רים";
      case "/reports/full-tabar":
        return "דוח תב\"רים מלא";
      case "/reports/smart-query":
        return "מחולל דוחות חכם";
      case "/admin":
        return "ניהול מערכת";
      default:
        return "מערכת תב\"ר";
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 transition-all duration-500">
      <AppSidebar />
      <main className="flex-1 flex flex-col mr-64">
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Sidebar trigger removed since we have our own toggle */}
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold text-gradient-primary">{getPageTitle()}</h1>
              <p className="text-xs text-muted-foreground/80">מערכת ניהול תב\"ר ופרויקטים</p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tabarim" element={<Tabarim />} />
            <Route path="/reports" element={<ReportsHome />} />
            <Route path="/reports/budget-items" element={<BudgetItemsReport />} />
            <Route path="/reports/tabar-budget" element={<TabarBudgetReport />} />
            <Route path="/reports/full-tabar" element={<FullTabarReport />} />
            <Route path="/reports/smart-query" element={<SmartQueryReport />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const Index = () => {
  return <AppContent />;
};

export default Index;
