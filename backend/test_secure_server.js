import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic security
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

app.set("db", pool);

// Demo token validation
const DEMO_TOKEN = process.env.DEMO_TOKEN || 'DEMO_SECURE_TOKEN_2024';

const validateDemoToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const demoHeader = req.headers['x-demo-token'];
  
  if (authHeader && authHeader === `Bearer ${DEMO_TOKEN}`) {
    req.user = { tenant_id: 1, role: 'demo' };
    return next();
  }
  
  if (demoHeader === DEMO_TOKEN) {
    req.user = { tenant_id: 1, role: 'demo' };
    return next();
  }
  
  return res.status(401).json({ 
    success: false, 
    error: 'Unauthorized - Invalid or missing token',
    hint: 'Use Authorization: Bearer DEMO_SECURE_TOKEN_2024 or x-demo-token: DEMO_SECURE_TOKEN_2024'
  });
};

// Routes

// Public health check
app.get("/health", (req, res) => {
  res.json({
    status: "🟢 Healthy",
    timestamp: new Date().toISOString(),
    message: "Test secure server is running!"
  });
});

// Public demo endpoint
app.get("/api/demo", (req, res) => {
  res.json({
    message: "🚀 Public demo endpoint - no auth required",
    timestamp: new Date().toISOString(),
    status: "working"
  });
});

// Protected projects endpoint
app.get("/api/secure/projects", validateDemoToken, async (req, res) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      "SELECT id, name, description, budget FROM projects WHERE tenant_id = $1 LIMIT 5", 
      [req.user.tenant_id]
    );
    
    res.json({
      success: true,
      message: "🔒 Secure access successful!",
      tenant_id: req.user.tenant_id,
      projects: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ 
      success: false, 
      error: "Database error",
      details: error.message
    });
  }
});

// Protected tenants info
app.get("/api/secure/tenant-info", validateDemoToken, async (req, res) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      "SELECT tenant_id, name, status FROM tenants WHERE tenant_id = $1", 
      [req.user.tenant_id]
    );
    
    res.json({
      success: true,
      message: "🔒 Tenant info retrieved successfully!",
      tenant: result.rows[0] || null
    });
  } catch (error) {
    console.error("Error fetching tenant info:", error);
    res.status(500).json({ 
      success: false, 
      error: "Database error",
      details: error.message
    });
  }
});

// Test unprotected endpoint (should fail with our demo token)
app.get("/api/unprotected", (req, res) => {
  res.json({
    message: "⚠️ This endpoint has NO security!",
    warning: "Anyone can access this",
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    available_endpoints: [
      "GET /health",
      "GET /api/demo", 
      "GET /api/secure/projects (requires auth)",
      "GET /api/secure/tenant-info (requires auth)",
      "GET /api/unprotected"
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Test Secure Server running on port ${port}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`🔓 Demo endpoint: http://localhost:${port}/api/demo`);
  console.log(`🔒 Secure projects: http://localhost:${port}/api/secure/projects`);
  console.log(`🔑 Demo token: ${DEMO_TOKEN}`);
  console.log(`📋 Use: curl -H "Authorization: Bearer ${DEMO_TOKEN}" http://localhost:${port}/api/secure/projects`);
}); 