export function parsePermissionText(text) {
  const result = {};

  // --- חילוץ ממסמך הרשאה (Permission) ---
  // מס' בקשה/הרשאה (גם במרכבה)
  const permissionMatch =
    text.match(/מס[ \-]?בקשה(?: במרכבה)?[:\s\-]*([0-9]+)/) ||
    text.match(/מס[ \-]?הרש[אה|אה][: \-]*([0-9]+)/i);
  if (permissionMatch) result.permission_number = permissionMatch[1].trim();

  // סכום הרשאה (דוג' "בסכום של עד 1,000,000 שח")
  const amountMatch = text.match(/בסכום של עד ([\d,\,\.]+) ?ש[\"']?ח/i);
  if (amountMatch) result.amount = normalizeAmount(amountMatch[1]);

  // תאריך תחילה/סיום (לדוג' "תאריך תחילת ההתחייבות", "תאריך סיום ההתחייבות")
  const startMatch = text.match(/תאריך תחילת ההתחייבות[:\s\-]*([\d\.\/\-]+)/);
  if (startMatch) result.start_date = normalizeDate(startMatch[1]);
  const endMatch = text.match(/תאריך סיום ההתחייבות[:\s\-]*([\d\.\/\-]+)/);
  if (endMatch) result.end_date = normalizeDate(endMatch[1]);

  // אפשרות גנרית - תחילה/סיום (אם לא נתפס קודם)
  if (!result.start_date) {
    const altStart = text.match(/(תחילה|התחלה)[:\s\-]*([\d\.\/\-]+)/);
    if (altStart) result.start_date = normalizeDate(altStart[2]);
  }
  if (!result.end_date) {
    const altEnd = text.match(/(סיום|עד)[:\s\-]*([\d\.\/\-]+)/);
    if (altEnd) result.end_date = normalizeDate(altEnd[2]);
  }

  // --- חילוץ ממסמך הזמנה (Order) ---
  // חוזה רכישה/מס' הזמנה
  const orderMatch =
    text.match(/חוזה רכישה מספר ([0-9]+)/) ||
    text.match(/מס[ \-]?הזמנה[:\s\-]*([0-9]+)/);
  if (orderMatch) result.order_number = orderMatch[1].trim();

  // סה"כ כללי
  const totalMatch = text.match(/סה["']?כ כללי[\s\S]*?ש["']?ח ([\d,\,\.]+)/) ||
                     text.match(/ש["']?ח ([\d,\,\.]+)\s*סה["']?כ כללי/);
  if (totalMatch) result.order_total = normalizeAmount(totalMatch[1]);

  // תאריך הזמנה
  const orderDate = text.match(/תאריך ההזמנה[:\s\-]*([\d\.]+)/);
  if (orderDate) result.order_date = normalizeDate(orderDate[1]);

  // תקף מ/עד
  const validFrom = text.match(/תקף מ[\s\-:]+([\d\.\/\-]+)/);
  if (validFrom) result.valid_from = normalizeDate(validFrom[1]);
  const validTo = text.match(/תקף עד[\s\-:]+([\d\.\/\-]+)/);
  if (validTo) result.valid_to = normalizeDate(validTo[1]);

  // משרד/גורם מממן (אם קיים)
  const ministryMatch = text.match(/(?:משרד|גורם מממן)[:\s\-]+([\u0590-\u05FF ]+)/);
  if (ministryMatch) result.ministry = ministryMatch[1].trim();

  // --- דיבאג ---
  console.log("========== OCR RAW TEXT ==========");
  console.log(text.slice(0, 1200)); // אפשר להרחיב אם צריך
  console.log("========== OCR RESULT =============");
  console.log(result);

  return result;
}

function normalizeAmount(str) {
  if (!str) return "";
  return str.replace(/[,\s]/g, "");
}

function normalizeDate(str) {
  if (!str) return "";
  let s = str.trim();
  // אם בפורמט yyyy-mm-dd — הפוך ל-dd.mm.yyyy
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split("-").reverse().join(".");
  return s;
}
