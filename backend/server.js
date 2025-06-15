// server.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// טוען משתני סביבה מהקובץ .env
dotenv.config();

// יוצרים מופע של אפליקציית Express
const app = express();
const port = process.env.PORT || 3000;

// הגדרות כלליות
app.use(cors()); // מאפשר בקשות ממקורות חיצוניים
app.use(express.json()); // מאפשר קריאת JSON בגוף הבקשות

// יבוא של כל קבצי הנתיבים (Routes)
import projectRoutes from './routes/projectsRoutes.js';
import reportRoutes from './routes/reportsRoutes.js';
import documentRoutes from './routes/documentsRoutes.js';
import milestoneRoutes from './routes/milestonesRoutes.js';
import commentRoutes from './routes/commentsRoutes.js';
import permissionRoutes from './routes/permissionsRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import tabarimRoutes from './routes/tabarimRoutes.js';

// מחולל סכמות דוחות - חובה להוסיף!
import reportSchemasRouter from './routes/reportSchemas.js';

// חיבור הנתיבים לאפליקציה
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes); // CRUD דוחות ישנים
app.use('/api/documents', documentRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tabarim', tabarimRoutes);

// חיבור מחולל סכמות דוחות לנתיב ייחודי
app.use('/api/report-schemas', reportSchemasRouter); // 👈 זה הנתיב למחולל החדש

// ברירת מחדל – מסך ראשי
app.get('/', (req, res) => {
  res.json({ message: 'City Budget API', version: '1.0.0' });
});

// הפעלת השרת
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

export default app;
