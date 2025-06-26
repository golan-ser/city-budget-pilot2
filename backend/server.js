import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pg from "pg";
import dotenv from "dotenv";

// 🔐 SECURITY: Load environment variables
dotenv.config();

import reportSchemasRouter from "./routes/reportSchemas.js";
import tabarimRouter from "./routes/tabarimRoutes.js";
import reportsRouter from "./routes/reportsRoutes.js";
import projectsRouter from "./routes/projectsRoutes.js";
import commentsRouter from "./routes/commentsRoutes.js";
import milestonesRouter from "./routes/milestonesRoutes.js";
import permissionsRouter from "./routes/permissionsRoutes.js";
import fundingRouter from "./routes/fundingRoutes.js";
import documentsRouter from "./routes/documentsRoutes.js";
import analyticsRouter from "./routes/analyticsRoutes.js";
import departmentsRouter from "./routes/departmentsRoutes.js";
import smartQueryRouter from "./routes/smartQueryRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import enhancedReportsRouter from "./routes/enhancedReportsRoutes.js";
// 🔐 SECURITY: Import authentication routes
import authRouter from "./routes/authRoutes.js";
// 🔐 SECURITY: Import admin routes
import adminRouter from "./routes/adminRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

// 🔐 SECURITY: Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// 🔐 SECURITY: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// 🔐 SECURITY: Restricted CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://city-budget-pilot2.vercel.app',
        'https://city-budget-pilot2-207f5wt8i-fintecity.vercel.app',
        'https://city-budget-frontend-v2.vercel.app',
        'https://city-budget-frontend-v2-git-main-fintecity.vercel.app',
        'https://city-budget-frontend-v2-git-main-fintecity.vercel.app'
      ] 
    : ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-token']
}));

// הגדרת UTF-8 encoding מפורשת
app.use(express.json({ charset: 'utf-8', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8', limit: '10mb' }));

// 🔐 SECURITY: Safe logging middleware (no sensitive data)
app.use((req, res, next) => {
  const safeUrl = req.path.replace(/\/\d+/g, '/:id'); // Hide IDs
  console.log(`${new Date().toISOString()} - ${req.method} ${safeUrl} - IP: ${req.ip}`);
  next();
});

// 🔐 SECURITY: Database connection from environment
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Admin0697812@localhost:5432/city_budget",
});
app.set("db", pool);

console.log(`🔌 Database connection configured`);

// 🔐 SECURITY: Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🔐 SECURITY: Authentication routes (no auth required for login)
app.use("/api/auth", authRouter);

// 🔐 SECURITY: All other routes require authentication (handled by individual route files)
app.use("/api/report-schemas", reportSchemasRouter);
app.use("/api/tabarim", tabarimRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/milestones", milestonesRouter);
app.use("/api/permissions", permissionsRouter);
app.use("/api/funding", fundingRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/departments", departmentsRouter);
app.use("/api/smart-query", smartQueryRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/enhanced-reports", enhancedReportsRouter);
// 🔐 SECURITY: Admin routes (require highest permissions)
app.use("/api/admin", adminRouter);

// 🔐 SECURITY: Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔐 SECURITY: 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`🚀 SECURE Server is running at http://localhost:${port}`);
  console.log(`🔐 Security features enabled: Helmet, Rate Limiting, Authentication`);
});
