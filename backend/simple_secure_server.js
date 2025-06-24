import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import pg from "pg";

// Import controllers
import authRouter from "./routes/authRoutes.js";
import { authenticate } from "./middleware/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====

// Helmet for security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Strict CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== DATABASE CONNECTION =====

// Secure database connection using environment variables
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

app.set("db", pool);

// ===== LOGGING MIDDLEWARE =====

// Secure logging middleware (no sensitive data)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;  
  console.log(`${timestamp} - ${method} ${path}`);
  next();
});

// ===== ROUTES =====

// Public routes (no authentication required)
app.use("/api/auth", authRouter);

// Test secured projects endpoint
app.get("/api/secure/projects", authenticate, async (req, res) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      "SELECT id, name, description FROM projects WHERE tenant_id = $1 LIMIT 10", 
      [req.user.tenant_id]
    );
    
    res.json({
      success: true,
      projects: result.rows,
      tenant_id: req.user.tenant_id,
      message: "🔒 Secure access successful!"
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Demo endpoint - test without auth
app.get("/api/demo", (req, res) => {
  res.json({
    message: "🚀 Demo endpoint - no auth required",
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

app.listen(port, () => {
  console.log(`🚀 Simple Secure server running on port ${port}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`🔓 Demo endpoint: http://localhost:${port}/api/demo`);
  console.log(`🔒 Secure endpoint: http://localhost:${port}/api/secure/projects`);
}); 