export function parsePermissionText(text) {
  const result = {};

  // --- חילוץ מספר הרשאה/בקשה ---
  // תומך ב: "מס הרשאה: 12345", "הרשאה מס' 12345", "מס בקשה במרכבה: 12345" ועוד
  const permissionNumRegex = [
    /מס[׳']?[ \-]?(הרשאה|בקשה)(?: במרכבה)?[:\s\-]*([0-9]{4,})/i,
    /הרשאה מס[׳']?[ \-:]*([0-9]{4,})/i,
    /בקשה מס[׳']?[ \-:]*([0-9]{4,})/i,
    /מספר הרשאה[:\s\-]*([0-9]{4,})/i,
    /מספר בקשה[:\s\-]*([0-9]{4,})/i,
  ];
  let permission_number;
  for (const rx of permissionNumRegex) {
    const match = text.match(rx);
    if (match) {
      permission_number = match[2] || match[1];
      break;
    }
  }
  if (permission_number) result.permission_number = permission_number.trim();

  // --- חילוץ שם פרויקט (אם קיים) ---
  const nameMatch = text.match(/(?:פרויקט|שם פרויקט)[:\s\-]*([^\n]+)/i);
  if (nameMatch) result.project_name = nameMatch[1].trim();

  // --- חילוץ סכום (בסכום של עד ... ש"ח) ---
  const amountMatch = text.match(/בסכום של עד ([\d,\.]+) ?ש[\"׳']?ח/i) ||
                      text.match(/סך[- ]?הכל[:\s]*([\d,\.]+) ?ש[\"׳']?ח/i);
  if (amountMatch) result.amount = normalizeAmount(amountMatch[1]);

  // --- חילוץ תאריך תחילה/סיום ---
  const startMatch = text.match(/תאריך תחילת ההתחייבות[:\s\-]*([\d\.\/\-]+)/);
  if (startMatch) result.start_date = normalizeDate(startMatch[1]);
  const endMatch = text.match(/תאריך סיום ההתחייבות[:\s\-]*([\d\.\/\-]+)/);
  if (endMatch) result.end_date = normalizeDate(endMatch[1]);
  // אלטרנטיבות כלליות
  if (!result.start_date) {
    const altStart = text.match(/(תחילה|התחלה)[:\s\-]*([\d\.\/\-]+)/);
    if (altStart) result.start_date = normalizeDate(altStart[2]);
  }
  if (!result.end_date) {
    const altEnd = text.match(/(סיום|עד)[:\s\-]*([\d\.\/\-]+)/);
    if (altEnd) result.end_date = normalizeDate(altEnd[2]);
  }

  // --- חילוץ משרד מממן (אם קיים) ---
  const ministryMatch = text.match(/(?:משרד|גורם מממן)[:\s\-]+([\u0590-\u05FF ]+)/);
  if (ministryMatch) result.ministry = ministryMatch[1].trim();

  // --- חילוץ ממסמך הזמנה (אם רלוונטי) ---
  const orderMatch =
    text.match(/חוזה רכישה מספר ([0-9]+)/) ||
    text.match(/מס[ \-]?הזמנה[:\s\-]*([0-9]+)/);
  if (orderMatch) result.order_number = orderMatch[1].trim();

  const totalMatch = text.match(/סה["']?כ כללי[\s\S]*?ש["']?ח ([\d,\,\.]+)/) ||
                     text.match(/ש["']?ח ([\d,\,\.]+)\s*סה["']?כ כללי/);
  if (totalMatch) result.order_total = normalizeAmount(totalMatch[1]);

  const orderDate = text.match(/תאריך ההזמנה[:\s\-]*([\d\.]+)/);
  if (orderDate) result.order_date = normalizeDate(orderDate[1]);

  const validFrom = text.match(/תקף מ[\s\-:]+([\d\.\/\-]+)/);
  if (validFrom) result.valid_from = normalizeDate(validFrom[1]);
  const validTo = text.match(/תקף עד[\s\-:]+([\d\.\/\-]+)/);
  if (validTo) result.valid_to = normalizeDate(validTo[1]);

  // --- דיבאג ללוג ---
  console.log("========== OCR RAW TEXT ==========");
  console.log(text.slice(0, 1500));
  console.log("========== OCR RESULT =============");
  console.log(result);

  return result;
}

// עזר לניקוי סכום
function normalizeAmount(str) {
  if (!str) return "";
  return str.replace(/[,\s]/g, "");
}

// עזר לניקוי תאריכים
function normalizeDate(str) {
  if (!str) return "";
  let s = str.trim();
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.split("-").reverse().join(".");
  return s;
}
