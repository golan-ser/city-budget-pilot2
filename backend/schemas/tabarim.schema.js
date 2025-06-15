// schemas/tabarim.schema.js

export default {
  module: "tabarim",
  fields: [
    { name: "id", label: "מזהה תב\"ר", type: "number", filterable: false },
    { name: "tabar_number", label: "מספר תב\"ר", type: "number", filterable: true },
    { name: "name", label: "שם פרויקט", type: "string", filterable: true },
    { name: "year", label: "שנה", type: "number", filterable: true },
    { name: "status", label: "סטטוס", type: "enum", options: ["פעיל", "הסתיים", "מתעכב"], filterable: true },
    { name: "department", label: "מחלקה", type: "string", filterable: true },
    { name: "ministry", label: "משרד", type: "string", filterable: true },
    { name: "total_authorized", label: "תקציב מאושר", type: "number", filterable: true, chartable: true },
    { name: "created_at", label: "תאריך פתיחה", type: "date", filterable: true }
  ]
};
