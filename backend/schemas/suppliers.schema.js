// schemas/suppliers.schema.js

export default {
  module: "suppliers",
  fields: [
    { name: "id", label: "מזהה ספק", type: "number", filterable: false },
    { name: "name", label: "שם ספק", type: "string", filterable: true },
    { name: "phone", label: "טלפון", type: "string", filterable: true },
    { name: "email", label: "דוא\"ל", type: "string", filterable: true }
  ]
};
