import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import projectRoutes from './routes/projectsRoutes.js';
import reportRoutes from './routes/reportsRoutes.js';
import documentRoutes from './routes/documentsRoutes.js';
import milestoneRoutes from './routes/milestonesRoutes.js';
import commentRoutes from './routes/commentsRoutes.js';
import permissionRoutes from './routes/permissionsRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// 👇 הוסף כאן
import tabarimRoutes from './routes/tabarimRoutes.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// חיבור כל הראוטים
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/analytics', analyticsRoutes);

// 👇 זה מה שמוסיף את ה־API החדש
app.use('/api/tabarim', tabarimRoutes);

// ברירת מחדל
app.get('/', (req, res) => {
  res.json({ message: 'City Budget API', version: '1.0.0' });
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
