// schemas/departments.schema.js

export default {
  module: "departments",
  fields: [
    { name: "id", label: "מזהה מחלקה", type: "number", filterable: false },
    { name: "name", label: "שם מחלקה", type: "string", filterable: true }
  ]
};
