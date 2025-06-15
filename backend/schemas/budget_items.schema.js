// schemas/budget_items.schema.js

export default {
  module: "budget_items",
  fields: [
    { name: "id", label: "מזהה סעיף", type: "number", filterable: false },
    { name: "name", label: "שם סעיף", type: "string", filterable: true },
    { name: "budget", label: "תקציב", type: "number", filterable: true, chartable: true },
    { name: "spent", label: "בוצע בפועל", type: "number", filterable: true, chartable: true },
    { name: "department_id", label: "מזהה מחלקה", type: "number", filterable: true },
    { name: "updated_at", label: "תאריך עדכון", type: "date", filterable: true }
  ]
};
