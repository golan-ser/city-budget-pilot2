import express from "express";
import budgetItemsSchema from "../schemas/budget_items.schema.js";
import tabarimSchema from "../schemas/tabarim.schema.js";
import tabarFullSchema from "../schemas/tabar_full.schema.js";
import transactionsSchema from "../schemas/transactions.schema.js";
import comprehensiveSchema from "../schemas/comprehensive.schema.js";

const router = express.Router();

const schemas = {
  budget_items: budgetItemsSchema,
  tabarim: tabarimSchema,
  tabar_full: tabarFullSchema,
  transactions: transactionsSchema,
  comprehensive: comprehensiveSchema,
};

router.post("/run", async (req, res) => {
  try {
    const { module, fields, filters } = req.body;
    console.log("📊 Report Schema Request:", { module, fields, filters });

    if (!schemas[module]) {
      console.error("❌ Unknown module:", module);
      return res.status(400).json({ error: "Unknown module schema" });
    }

    const query = schemas[module](fields, filters || {});
    console.log("📝 Generated Query:", query);
    
    const db = req.app.get("db");
    const result = await db.query(query);
    
    console.log("✅ Query Result:", { rowCount: result.rows.length });
    console.log("📋 First row sample:", result.rows[0]);
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error in /api/report-schemas/run:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default router;
