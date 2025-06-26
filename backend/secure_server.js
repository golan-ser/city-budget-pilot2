import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import pg from "pg";

// Import routes
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import reportSchemasRouter from "./routes/reportSchemas.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import tabarimRouter from "./routes/tabarimRoutes.js";
import projectsRouter from "./routes/projectsRoutes.js";
import reportsRouter from "./routes/reportsRoutes.js";
import departmentsRouter from "./routes/departmentsRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import documentsRouter from "./routes/documentsRoutes.js";
import enhancedReportsRouter from "./routes/enhancedReportsRoutes.js";
import smartQueryRouter from "./routes/smartQueryRoutes.js";
import { authenticate } from "./middleware/auth.js";
import { checkSystemAccessMiddleware } from "./middleware/rbac.js";

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

// Enhanced CORS configuration with proper header handling
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://city-budget-pilot2.vercel.app',
      'https://city-budget-pilot2-207f5wt8i-fintecity.vercel.app',
      'https://city-budget-frontend-v2.vercel.app',
      'https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-demo-token',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb', charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', charset: 'utf-8' }));

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
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`${timestamp} - ${method} ${path} - IP: ${ip}`);
  
  // Log only non-sensitive data for POST requests
  if (req.method === 'POST' && req.path !== '/api/auth/login') {
    const safeBody = { ...req.body };
    delete safeBody.password;
    delete safeBody.password_hash;
    delete safeBody.token;
    console.log('Request body (safe):', safeBody);
  }
  
  next();
});

// ===== ROUTES =====

// Public routes (no authentication required)
app.use("/api/auth", authRouter);

// Admin routes (require highest permissions)
app.use("/api/admin", adminRouter);

// Protected routes (require authentication AND system access)
app.use("/api/dashboard", authenticate, checkSystemAccessMiddleware, dashboardRouter);
app.use("/api/tabarim", authenticate, checkSystemAccessMiddleware, tabarimRouter);
app.use("/api/projects", authenticate, checkSystemAccessMiddleware, projectsRouter);
app.use("/api/reports", authenticate, checkSystemAccessMiddleware, reportsRouter);
app.use("/api/departments", authenticate, checkSystemAccessMiddleware, departmentsRouter);
app.use("/api/analytics", authenticate, checkSystemAccessMiddleware, analyticsRouter);
app.use("/api/documents", authenticate, checkSystemAccessMiddleware, documentsRouter);
app.use("/api/enhanced-reports", authenticate, checkSystemAccessMiddleware, enhancedReportsRouter);
app.use("/api/smart-query", authenticate, checkSystemAccessMiddleware, smartQueryRouter);
app.use("/api/report-schemas", authenticate, checkSystemAccessMiddleware, reportSchemasRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Users endpoint for admin page
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const db = req.app.get("db");
    const result = await db.query(
      "SELECT id, full_name, email, role, status, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC", 
      [req.user.tenant_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ 
      success: false, 
      error: "Database error",
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`${timestamp} - Error:`, err.message);
  
  // Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  } else {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  pool.end(() => {
    console.log('✅ Database pool closed');
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`🚀 Secure server running on port ${port}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS allowed origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173'}`);
}); 