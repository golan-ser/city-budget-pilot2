# 🧠 מדריך ניהול כללי חכם + ייצוא PDF

## 🎯 סקירה כללית

המערכת כוללת כעת תכונות אנליטיקה מתקדמות וייצוא PDF מקצועי שמספקים תובנות חכמות ודיווחים מפורטים לניהול פרויקטים עירוניים.

## ✨ תכונות חדשות

### 1. 🧮 חישובים חכמים בזמן אמת

#### אחוז ניצול תקציבי דינמי
```javascript
// חישוב אוטומטי מהנתונים הריאליים
const utilizationPercentage = (utilizedAmount / totalBudget) * 100;
```

**מקורות נתונים:**
- תקציב מאושר: `tabarim.total_authorized`
- סכום מנוצל: `SUM(tabar_transactions.amount WHERE direction = 'חיוב')`
- יתרה: חישוב אוטומטי
- אחוז ניצול: חישוב דינמי

#### סטטוס תקציב חכם
- 🟢 **בריא (0-35%)**: "סטטוס תקציב בריא"
- 🟡 **זהירות (35-65%)**: "מומלץ לעקוב מקרוב"
- 🟠 **אזהרה (65-90%)**: "ניצול תקציב גבוה"
- 🔴 **קריטי (90%+)**: "נדרש אישור להמשך"

### 2. 🚨 התראות חכמות

#### התראות תקציב
```javascript
if (utilizationPercentage >= 90) {
  alerts.push({
    type: 'budget_critical',
    level: 'error',
    title: 'ניצול תקציב קריטי',
    message: `נוצל ${utilizationPercentage.toFixed(1)}% מהתקציב - נדרש אישור להמשך`,
    icon: '🚨'
  });
}
```

#### התראות דיווח
- **לא דווח מעולם**: התראה כאשר אין דיווחי ביצוע
- **דיווח מתעכב**: התראה אחרי 90+ ימים ללא דיווח
- **מסמכים חסרים**: התראה כאשר לא הועלו מסמכים

#### ציון בריאות פרויקט (0-100)
```javascript
function calculateHealthScore(utilization, daysSinceReport, reportsCount, documentsCount) {
  let score = 100;
  
  // ניכויים על בסיס פרמטרים שונים
  if (utilization > 90) score -= 30;
  if (daysSinceReport > 90) score -= 15;
  if (reportsCount === 0) score -= 15;
  if (documentsCount === 0) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}
```

### 3. 📄 ייצוא PDF מקצועי

#### מבנה הדוח
1. **כותרת**: שם פרויקט + מספר תב"ר
2. **מידע כללי**: תיאור, תאריכים, אחראים
3. **סיכום תקציבי**: מאושר, מנוצל, יתרה, אחוז ניצול
4. **אבני דרך**: טבלת מילסטונים עם סטטוס
5. **דיווחי ביצוע**: תאריכים, סכומים, הערות
6. **מסמכים תומכים**: רשימת קבצים לפי סוג
7. **התראות ותובנות**: ניתוח חכם של מצב הפרויקט
8. **גרף התקדמות**: ויזואליזציה של הניצול
9. **חותמת זמן**: תאריך ושעת יצירת הדוח

#### דוגמה לשימוש
```javascript
const handleExportPDF = async () => {
  try {
    setExportingPDF(true);
    const response = await fetch(`/api/projects/${id}/export-pdf`);
    const blob = await response.blob();
    
    // הורדה אוטומטית
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${id}-report.pdf`;
    a.click();
  } catch (error) {
    console.error('שגיאה בייצוא PDF:', error);
  } finally {
    setExportingPDF(false);
  }
};
```

## 🛠️ API Endpoints חדשים

### 1. אנליטיקה חכמה
```
GET /api/projects/:id/analytics
```

**תגובה:**
```json
{
  "project_id": "101",
  "project_name": "פרויקט חינוך דיגיטלי",
  "financial": {
    "total_budget": 800000,
    "utilized_amount": 372000,
    "remaining_budget": 428000,
    "utilization_percentage": 46.5
  },
  "activity": {
    "milestones_count": 3,
    "documents_count": 3,
    "reports_count": 2,
    "transactions_count": 8,
    "last_report_date": "2024-02-15T00:00:00.000Z",
    "days_since_last_report": 127
  },
  "alerts": [
    {
      "type": "report_overdue",
      "level": "warning",
      "title": "התראת דיווח",
      "message": "הפרויקט לא קיבל דיווח כבר 127 ימים",
      "icon": "📅"
    }
  ],
  "insights": [],
  "overall_health_score": 70,
  "generated_at": "2025-06-19T12:21:30.727Z"
}
```

### 2. ייצוא PDF
```
GET /api/projects/:id/export-pdf
```

**תגובה:** קובץ PDF להורדה

## 🎨 עדכוני ממשק המשתמש

### טאב "ניהול כללי" משופר

#### 1. נתונים ריאליים
- תיאור הפרויקט מהמסד
- תאריכים אמיתיים (לא 1.1.1970)
- אנשי קשר דינמיים
- נתונים כמותיים מעודכנים

#### 2. סטטוס תקציב מתקדם
```jsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
    <div>
      <div className="text-2xl font-bold text-blue-600">
        {analytics.financial.utilization_percentage.toFixed(1)}%
      </div>
      <div className="text-sm text-blue-700">אחוז ניצול</div>
    </div>
    {/* ... שאר הנתונים */}
  </div>
  <Progress 
    value={analytics.financial.utilization_percentage} 
    className={`h-3 ${
      analytics.financial.utilization_percentage >= 90 ? 'bg-red-100' :
      analytics.financial.utilization_percentage >= 65 ? 'bg-yellow-100' : 'bg-green-100'
    }`} 
  />
</div>
```

#### 3. התראות ויזואליות
```jsx
{analytics.alerts.map((alert, index) => (
  <div 
    key={index}
    className={`flex items-start gap-2 p-3 border rounded-lg ${
      alert.level === 'error' ? 'bg-red-50 border-red-200' :
      alert.level === 'warning' ? 'bg-yellow-50 border-yellow-200' :
      'bg-blue-50 border-blue-200'
    }`}
  >
    <span className="text-lg">{alert.icon}</span>
    <div>
      <div className="font-medium">{alert.title}</div>
      <div className="text-sm">{alert.message}</div>
    </div>
  </div>
))}
```

#### 4. כפתורי פעולה
- **ייצוא PDF**: הורדה מיידית של דוח מקצועי
- **רענן נתונים**: עדכון האנליטיקה בזמן אמת

## 📊 דוגמאות לנתונים

### תב"ר 101 - פרויקט חינוך דיגיטלי
- **תקציב**: ₪800,000
- **מנוצל**: ₪372,000 (46.5%)
- **יתרה**: ₪428,000
- **ציון בריאות**: 70/100
- **התראות**: דיווח מתעכב (127 ימים)

### תב"ר 1211 - פיתוח תשתיות
- **תקציב**: ₪1,233,333
- **מנוצל**: ₪300,000 (24.3%)
- **יתרה**: ₪933,333
- **ציון בריאות**: 85/100
- **סטטוס**: בריא

## 🔧 התקנה ותצורה

### Dependencies חדשות
```bash
npm install pdfkit
```

### הגדרות סביבה
```javascript
// בקובץ .env
VITE_API_URL=http://localhost:3000
```

### בסיס נתונים
הטבלאות הנדרשות:
- `tabarim` - נתוני פרויקטים בסיסיים
- `tabar_transactions` - עסקאות פיננסיות
- `milestones` - אבני דרך
- `project_documents` - מסמכים
- `execution_reports` - דיווחי ביצוע

## 🚀 הפעלה

### 1. הפעלת השרת
```bash
cd backend
node server.js
```

### 2. הפעלת הפרונטאנד
```bash
cd frontend
npm run dev
```

### 3. גישה למערכת
- פרונטאנד: http://localhost:8080
- API: http://localhost:3000

## 📝 דוגמאות שימוש

### קבלת אנליטיקה
```javascript
const analytics = await fetch('/api/projects/101/analytics').then(r => r.json());
console.log(`ציון בריאות: ${analytics.overall_health_score}/100`);
console.log(`התראות: ${analytics.alerts.length}`);
```

### ייצוא PDF
```javascript
const exportPDF = async (projectId) => {
  const response = await fetch(`/api/projects/${projectId}/export-pdf`);
  const blob = await response.blob();
  // הורדה אוטומטית...
};
```

## 🎯 תכונות עתידיות

### בתכנון
- 📈 גרפים אינטראקטיביים
- 📱 התראות בזמן אמת
- 🤖 המלצות AI
- 📧 שליחת דוחות במייל
- 📅 תזמון דוחות אוטומטי

### אופטימיזציות
- 🔄 Cache לאנליטיקה
- ⚡ טעינה מקבילה
- 🎨 תמות מותאמות אישית
- 🌐 תמיכה רב-לשונית

---

**📞 תמיכה טכנית:**
לשאלות ובעיות טכניות, בדקו את הלוגים בקונסול הדפדפן ובשרת הבקאנד.

**🔄 עדכונים:**
המערכת מתעדכנת אוטומטית עם כל שמירה של קובץ במצב פיתוח. 