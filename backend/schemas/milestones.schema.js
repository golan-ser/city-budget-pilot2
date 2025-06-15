// schemas/milestones.schema.js

export default {
  module: "milestones",
  fields: [
    { name: "id", label: "מזהה אבן דרך", type: "number", filterable: false },
    { name: "tabar_id", label: "מזהה תב\"ר", type: "relation", reference: "tabarim", filterable: true },
    { name: "description", label: "תיאור", type: "string", filterable: true },
    { name: "due_date", label: "תאריך יעד", type: "date", filterable: true },
    { name: "status", label: "סטטוס", type: "enum", options: ["בתהליך", "הושלם", "מעוכב"], filterable: true }
  ]
};
