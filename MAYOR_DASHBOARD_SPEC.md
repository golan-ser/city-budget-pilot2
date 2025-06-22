# מפרט טכני: דשבורד ראש העיר - מערכת ניהול תב"רים ופרויקטים

## 🎯 Overview
פיתוח דשבורד מתקדם לראש העיר המציג תמונת מצב מלאה ומדויקת של כלל הפרויקטים והתב"רים בעיר, עם דגש על קריאות, אינטראקטיביות וייצוא מקצועי.

---

## 📊 KPI Cards - אינדיקטורים עיקריים

### 1. מדדי תקציב מרכזיים

| מדד | נוסחה SQL | תצוגה | קוד צבע |
|------|-----------|--------|----------|
| **סה"כ תקציב מאושר** | `SELECT SUM(total_authorized) FROM tabarim WHERE status != 'בוטל'` | ₪12,345,678 | `#2563EB` (כחול) |
| **תקציב מנוצל** | `SELECT SUM(total_amount) FROM tabar_transactions WHERE transaction_type = 'expense'` | ₪8,234,567 | `#059669` (ירוק) |
| **יתרת תקציב** | `(total_authorized - total_utilized)` | ₪4,111,111 | `#DC2626` (אדום אם שלילי) |
| **אחוז ניצול כללי** | `(total_utilized / total_authorized) * 100` | 67% | `#F59E0B` (כתום) |

### 2. מדדי פרויקטים

```sql
-- סטטוס פרויקטים
SELECT 
    status,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tabarim)), 1) as percentage
FROM tabarim 
WHERE status IS NOT NULL
GROUP BY status;

-- פרויקטים קריטיים
SELECT COUNT(*) as critical_projects
FROM tabarim t
LEFT JOIN tabar_transactions tt ON t.tabar_number = tt.tabar_number
WHERE (
    t.close_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY) OR
    (SELECT SUM(total_amount) FROM tabar_transactions WHERE tabar_number = t.tabar_number) = 0 OR
    (SELECT SUM(total_amount) FROM tabar_transactions WHERE tabar_number = t.tabar_number) > t.total_authorized * 1.1
);
```

---

## 📈 Data Visualization Components

### 1. Pie Chart - התפלגות סטטוס פרויקטים
**טכנולוגיה:** `recharts` או `chart.js`
```javascript
const statusDistribution = {
    data: [
        { name: 'פעיל', value: 45, color: '#059669' },
        { name: 'בהמתנה', value: 23, color: '#F59E0B' },
        { name: 'הושלם', value: 28, color: '#2563EB' },
        { name: 'מושהה', value: 4, color: '#DC2626' }
    ],
    config: {
        responsive: true,
        rtl: true,
        tooltip: {
            format: '{name}: {value} פרויקטים ({percentage}%)'
        }
    }
}
```

### 2. Line Chart - מגמת ניצול תקציב חודשי
```sql
-- נתוני מגמה חודשית (12 חודשים אחרונים)
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as month,
    SUM(total_amount) as monthly_utilization,
    COUNT(DISTINCT tabar_number) as active_projects
FROM tabar_transactions 
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND transaction_type = 'expense'
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month;
```

### 3. Bar Chart - ניצול תקציב לפי משרדים
```sql
SELECT 
    t.government_office as ministry,
    SUM(t.total_authorized) as authorized,
    COALESCE(SUM(tt.total_amount), 0) as utilized,
    ROUND((COALESCE(SUM(tt.total_amount), 0) / SUM(t.total_authorized)) * 100, 1) as utilization_rate
FROM tabarim t
LEFT JOIN tabar_transactions tt ON t.tabar_number = tt.tabar_number
WHERE t.status = 'פעיל'
GROUP BY t.government_office
ORDER BY authorized DESC
LIMIT 10;
```

### 4. Progress Ring - אחוז השלמת יעדי שנה
```javascript
const yearlyTargets = {
    totalBudgetTarget: 50000000, // 50M
    projectsCompletionTarget: 85, // 85%
    utilizationTarget: 75 // 75%
}
```

---

## 🔔 Smart Alerts System

### אלגוריתמי התראות חכמות

```sql
-- התראה 1: פרויקטים ללא דיווח (90+ ימים)
SELECT t.tabar_number, t.project_name, 
       DATEDIFF(CURDATE(), t.last_report_date) as days_without_report
FROM tabarim t
WHERE t.status = 'פעיל' 
  AND (t.last_report_date IS NULL OR t.last_report_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY));

-- התראה 2: חריגת תקציב (>110%)
SELECT t.tabar_number, t.project_name, t.total_authorized,
       SUM(tt.total_amount) as total_spent,
       ROUND((SUM(tt.total_amount) / t.total_authorized) * 100, 1) as over_budget_percent
FROM tabarim t
JOIN tabar_transactions tt ON t.tabar_number = tt.tabar_number
GROUP BY t.tabar_number
HAVING (SUM(tt.total_amount) / t.total_authorized) > 1.1;

-- התראה 3: פרויקטים הקרבים לסיום (60 ימים)
SELECT tabar_number, project_name, close_date,
       DATEDIFF(close_date, CURDATE()) as days_remaining
FROM tabarim 
WHERE close_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
  AND status = 'פעיל';
```

---

## 🎨 UX/UI Specifications

### Design System
```css
:root {
    /* Primary Colors */
    --primary-blue: #2563EB;
    --success-green: #059669;
    --warning-orange: #F59E0B;
    --danger-red: #DC2626;
    --neutral-gray: #6B7280;
    
    /* Background Gradients */
    --kpi-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --alert-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    
    /* Typography */
    --font-primary: 'Assistant', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --font-numbers: 'Roboto Mono', monospace;
    
    /* Spacing */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
}
```

### Component Architecture
```javascript
// KPI Card Component Structure
const KPICard = ({
    title,
    value,
    formatter = 'currency', // 'currency' | 'percentage' | 'number'
    trend = null, // { value: 5.2, direction: 'up' | 'down' }
    color = 'primary',
    tooltip,
    onClick
}) => {
    return (
        <Card className={`kpi-card kpi-card--${color}`}>
            <CardHeader>
                <Tooltip content={tooltip}>
                    <h3>{title}</h3>
                </Tooltip>
            </CardHeader>
            <CardContent>
                <div className="kpi-value">
                    {formatValue(value, formatter)}
                </div>
                {trend && (
                    <div className={`kpi-trend kpi-trend--${trend.direction}`}>
                        <TrendIcon direction={trend.direction} />
                        {trend.value}%
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
```

### Responsive Breakpoints
```css
/* Mobile First Approach */
.dashboard-grid {
    display: grid;
    gap: var(--spacing-md);
    
    /* Mobile: Single column */
    grid-template-columns: 1fr;
    
    /* Tablet: 2 columns */
    @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
    
    /* Desktop: 4 columns for KPIs */
    @media (min-width: 1024px) {
        grid-template-columns: repeat(4, 1fr);
    }
    
    /* Large screens: Maintain 4 columns with max-width */
    @media (min-width: 1280px) {
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

---

## 📋 Data Tables

### טבלת פרויקטים קריטיים
```sql
-- שאילתה מרכזת לטבלת פרויקטים קריטיים
SELECT 
    t.tabar_number,
    t.project_name,
    t.government_office,
    t.total_authorized,
    COALESCE(SUM(tt.total_amount), 0) as total_utilized,
    ROUND((COALESCE(SUM(tt.total_amount), 0) / t.total_authorized) * 100, 1) as utilization_percent,
    t.status,
    t.close_date,
    DATEDIFF(t.close_date, CURDATE()) as days_remaining,
    CASE 
        WHEN COALESCE(SUM(tt.total_amount), 0) = 0 THEN 'no_utilization'
        WHEN COALESCE(SUM(tt.total_amount), 0) > t.total_authorized * 1.1 THEN 'over_budget'
        WHEN DATEDIFF(t.close_date, CURDATE()) <= 60 THEN 'closing_soon'
        ELSE 'normal'
    END as alert_type
FROM tabarim t
LEFT JOIN tabar_transactions tt ON t.tabar_number = tt.tabar_number
WHERE t.status = 'פעיל'
GROUP BY t.tabar_number
HAVING alert_type != 'normal'
ORDER BY 
    CASE alert_type
        WHEN 'over_budget' THEN 1
        WHEN 'no_utilization' THEN 2
        WHEN 'closing_soon' THEN 3
    END,
    t.total_authorized DESC;
```

### Table Component Features
- **Sorting:** כל עמודה ניתנת למיון
- **Filtering:** סינון מהיר לפי סטטוס, משרד, טווח תקציב
- **Pagination:** 25 שורות בעמוד עם ניווט
- **Export:** CSV/Excel export עם נתונים מלאים
- **Row Actions:** קישור מהיר לעמוד הפרויקט

---

## 🖨️ PDF Export System

### PDF Template Structure
```javascript
const pdfTemplate = {
    header: {
        title: 'דוח מצב תב"רים ופרויקטים',
        subtitle: `נכון לתאריך: ${new Date().toLocaleDateString('he-IL')}`,
        logo: '/assets/city-logo.png'
    },
    sections: [
        'executive_summary', // תקציר מנהלים
        'kpi_overview',      // מדדי ביצוע
        'status_charts',     // גרפים
        'critical_projects', // פרויקטים קריטיים
        'budget_analysis',   // ניתוח תקציב
        'recommendations'    // המלצות
    ],
    styling: {
        direction: 'rtl',
        font: 'Assistant',
        colors: 'corporate', // משתמש בצבעי הארגון
        layout: 'landscape'  // A4 לרוחב
    }
};
```

### PDF Generation Logic
```javascript
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const generateMayorReport = async (dashboardData) => {
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });
    
    // Add Hebrew font support
    pdf.addFont('/fonts/Assistant-Regular.ttf', 'Assistant', 'normal');
    pdf.setFont('Assistant');
    pdf.setR2L(true);
    
    // Capture dashboard sections
    const sections = ['#kpi-section', '#charts-section', '#tables-section'];
    
    for (let i = 0; i < sections.length; i++) {
        const element = document.querySelector(sections[i]);
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        if (i > 0) pdf.addPage();
        
        pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
    }
    
    return pdf;
};
```

---

## 🔗 API Integration

### Dashboard Data Endpoint
```javascript
// GET /api/dashboard/mayor-overview
const getMayorDashboardData = async (req, res) => {
    try {
        const data = await Promise.all([
            getKPIMetrics(),
            getProjectStatusDistribution(),
            getTrendData(),
            getCriticalProjects(),
            getSmartAlerts()
        ]);
        
        res.json({
            timestamp: new Date().toISOString(),
            kpis: data[0],
            statusDistribution: data[1],
            trends: data[2],
            criticalProjects: data[3],
            alerts: data[4]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Real-time Updates
```javascript
// WebSocket integration for live updates
const setupDashboardSocket = (io) => {
    io.on('connection', (socket) => {
        socket.join('mayor-dashboard');
        
        // Send updates every 5 minutes
        const interval = setInterval(async () => {
            const updates = await getLatestMetrics();
            socket.to('mayor-dashboard').emit('dashboard-update', updates);
        }, 300000);
        
        socket.on('disconnect', () => {
            clearInterval(interval);
        });
    });
};
```

---

## ⚡ Performance Optimizations

### Caching Strategy
```javascript
const cacheConfig = {
    kpis: { ttl: 300 }, // 5 minutes
    charts: { ttl: 600 }, // 10 minutes
    tables: { ttl: 180 }, // 3 minutes
    alerts: { ttl: 60 }   // 1 minute
};
```

### Database Indexing
```sql
-- Recommended indexes for optimal performance
CREATE INDEX idx_tabarim_status_closedate ON tabarim(status, close_date);
CREATE INDEX idx_transactions_tabar_created ON tabar_transactions(tabar_number, created_at);
CREATE INDEX idx_tabarim_government_office ON tabarim(government_office);
```

---

## 🧪 Testing Requirements

### Unit Tests Coverage
- [ ] KPI calculation functions (95% coverage)
- [ ] Chart data processing (90% coverage)  
- [ ] PDF generation (85% coverage)
- [ ] API endpoints (95% coverage)

### Integration Tests
- [ ] End-to-end dashboard loading
- [ ] PDF export functionality
- [ ] Real-time updates
- [ ] Mobile responsiveness

### Performance Benchmarks
- [ ] Initial page load: < 2 seconds
- [ ] Chart rendering: < 500ms
- [ ] PDF generation: < 5 seconds
- [ ] API response time: < 200ms

---

## 📱 Mobile Optimization

### Progressive Web App Features
```javascript
const pwaConfig = {
    name: 'דשבורד ראש העיר',
    short_name: 'דשבורד עיר',
    description: 'מערכת ניהול תב"רים לראש העיר',
    theme_color: '#2563EB',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
};
```

---

## 🚀 Deployment Checklist

### Pre-Production
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configured for assets
- [ ] Monitoring tools setup

### Go-Live
- [ ] Performance testing passed
- [ ] Security audit completed
- [ ] User acceptance testing approved
- [ ] Backup procedures verified
- [ ] Rollback plan prepared

---

*המפרט הזה מהווה בסיס מלא לפיתוח דשבורד מקצועי לראש העיר. כל רכיב מתוכנן להיות מודולרי, מדיד וניתן לתחזוקה.* 