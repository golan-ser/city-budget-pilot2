import express from "express";
import cors from "cors";
import pg from "pg";
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

const app = express();
const port = 3000;

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

// חיבור ל־PostgreSQL
const pool = new pg.Pool({
  connectionString: "postgresql://postgres:Admin0697812@localhost:5432/city_budget",
});
app.set("db", pool);

// ראוטים
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

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
