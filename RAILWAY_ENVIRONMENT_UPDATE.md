# 🚀 Railway Environment Variables Update - CRITICAL

## בעיה מזוהה:
הדומיין `https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app` חסר מ-CORS allowed origins ב-Railway.

## פתרון מיידי נדרש:

### 1. עדכון משתני הסביבה ב-Railway:

1. **כנס ל-Railway Dashboard**: https://railway.app
2. **בחר את הפרויקט**: `impartial-luck-production`
3. **לך ל-Variables**
4. **עדכן או הוסף את המשתנה**:

```
ALLOWED_ORIGINS=https://city-budget-pilot2.vercel.app,https://city-budget-pilot2-207f5wt8i-fintecity.vercel.app,https://city-budget-frontend-v2.vercel.app,https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app,http://localhost:5173,http://localhost:3000
```

### 2. Redeploy הבקאנד:

אחרי עדכון המשתנה, לחץ על **"Deploy"** או **"Redeploy"** ב-Railway.

### 3. בדיקה:

אחרי הפריסה, הרץ שוב:
```bash
node test-cors-advanced.js
```

## מה שאמור לקרות:

✅ כל 3 הדומיינים יחזירו CORS headers תקינים
✅ שגיאת הפרונטאנד תיעלם
✅ הרשאות ייטענו כראוי

## אם עדיין יש בעיות:

1. **בדוק לוגים ב-Railway**:
   - לך ל-Deployments
   - לחץ על הפריסה האחרונה
   - בדוק Logs עבור שגיאות

2. **וודא שהמשתנה נטען**:
   - בלוגים צריך להופיע: `🌐 CORS allowed origins: https://city-budget-pilot2.vercel.app,...`

3. **אם לא עובד, נסה לפרוס מחדש מ-GitHub**:
   - לך ל-Settings
   - לחץ על "Redeploy from GitHub"

## בדיקה נוספת:

אחרי התיקון, בדוק את הפרונטאנד:
- `https://city-budget-frontend-v2.vercel.app`
- שגיאות CORS אמורות להיעלם
- הרשאות אמורות להיטען

---

**⚠️ חשוב: עדכון זה קריטי ודחוף - הבקאנד לא מכיר את הדומיין החדש של Vercel!** 