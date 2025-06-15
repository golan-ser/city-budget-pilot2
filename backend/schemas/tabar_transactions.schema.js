// schemas/tabar_transactions.schema.js

export default {
  module: "tabar_transactions",
  fields: [
    { name: "id", label: "מזהה תנועה", type: "number", filterable: false },
    { name: "tabar_id", label: "מזהה תב\"ר", type: "relation", reference: "tabarim", filterable: true },
    { name: "date", label: "תאריך תנועה", type: "date", filterable: true },
    { name: "amount", label: "סכום", type: "number", filterable: true, chartable: true },
    { name: "type", label: "סוג תנועה", type: "enum", options: ["הוצאה", "הכנסה", "העברה"], filterable: true },
    { name: "description", label: "תיאור", type: "string", filterable: true },
    { name: "created_at", label: "נוצר בתאריך", type: "date", filterable: false }
  ]
};
