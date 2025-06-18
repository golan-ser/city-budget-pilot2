// src/modules/reports/pages/index.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, FileText, Milestone, TrendingUp, AlertTriangle, Calendar, Brain } from "lucide-react";
import pdfIcon from "../../assets/PDF.png";
import excelIcon from "../../assets/Excel.svg";

const reports = [
  {
    id: 1,
    title: "דוח סעיפי תקציב",
    description: "סיכום מפורט של סעיפי תקציב לפי מחלקות, סטטוס ביצוע ותקציב מוקצה",
    path: "/reports/budget-items",
    icon: FileText,
    status: "available",
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    title: "דוח תב״רים",
    description: "ריכוז מקיף של כל התב״רים במערכת לפי סטטוס, שנה תקציבית ומשרד אחראי",
    path: "/reports/tabar-budget",
    icon: BarChart3,
    status: "available",
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600"
  },
  {
    id: 7,
    title: "דוח תב״רים מלא",
    description: "דוח מתקדם וחכם של כל תב״רי העירייה עם סינון, מיון, ייצוא ופרטים מלאים",
    path: "/reports/full-tabar",
    icon: FileText,
    status: "available",
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600"
  },
  {
    id: 8,
    title: "מחולל דוחות חכם",
    description: "שאל אותי כל שאלה על התקציב בשפה חופשית - הבינה המלאכותית תבין ותציג את התוצאות",
    path: "/reports/smart-query",
    icon: Brain,
    status: "available",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "דוח אבני דרך",
    description: "מעקב התקדמות פרויקטים לפי אבני דרך מתוכננות ומועדי יעד",
    path: "/reports/milestone-progress",
    icon: Milestone,
    status: "available",
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600"
  },
  {
    id: 4,
    title: "דוח חריגות תקציביות",
    description: "זיהוי וניתוח פרויקטים עם חריגות תקציביות או עיכובים בלוח זמנים",
    path: "/reports/budget-exceptions",
    icon: AlertTriangle,
    status: "coming-soon",
    color: "bg-red-500",
    gradient: "from-red-500 to-red-600"
  },
  {
    id: 5,
    title: "דוח מגמות ותחזיות",
    description: "ניתוח טרנדים תקציביים ותחזיות לתקופות עתידיות",
    path: "/reports/trends-forecast",
    icon: TrendingUp,
    status: "coming-soon",
    color: "bg-indigo-500",
    gradient: "from-indigo-500 to-indigo-600"
  },
  {
    id: 6,
    title: "דוח ביצוע שנתי",
    description: "סיכום מקיף של ביצוע התקציב השנתי לפי רבעונים ומשרדים",
    path: "/reports/annual-execution",
    icon: Calendar,
    status: "coming-soon",
    color: "bg-teal-500",
    gradient: "from-teal-500 to-teal-600"
  }
];

export default function ReportsHome() {
  const navigate = useNavigate();

  const handleReportClick = (report: typeof reports[0]) => {
    if (report.status === "available") {
      navigate(report.path);
    } else {
      // Show toast or alert for coming soon reports
      alert(`הדוח "${report.title}" נמצא בבניה ויהיה זמין בקרוב`);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "available") {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✓ זמין
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          🔧 בבניה
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 p-6" dir="rtl">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            מרכז הדוחות
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            בחר דוח לצפייה, ניתוח או ייצוא. כל הדוחות זמינים בפורמטים מרובים ומותאמים לצרכים שלך
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">דוחות זמינים</p>
                <p className="text-3xl font-bold text-green-600">{reports.filter(r => r.status === "available").length}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">בפיתוח</p>
                <p className="text-3xl font-bold text-orange-600">{reports.filter(r => r.status === "coming-soon").length}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">סה״כ דוחות</p>
                <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            const isAvailable = report.status === "available";
            
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report)}
                className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden ${
                  isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
                }`}
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${report.gradient}`}></div>
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Header with Icon and Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 ${report.color} bg-opacity-10 rounded-lg`}>
                        <Icon className={`h-6 w-6 ${report.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="text-right">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {report.title}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 text-right">
                    {report.description}
                  </p>

                  {/* Export Options */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">ייצוא:</span>
                      <div className="flex gap-2">
                        <img src={excelIcon} alt="Excel" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity" />
                        <img src={pdfIcon} alt="PDF" className="w-6 h-6 opacity-70 hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    
                    {isAvailable && (
                      <div className="text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300">
                        לחץ לצפייה ←
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Effect */}
                {isAvailable && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          כל הדוחות מתעדכנים בזמן אמת ומבוססים על הנתונים העדכניים במערכת
        </p>
      </div>
    </div>
  );
}
