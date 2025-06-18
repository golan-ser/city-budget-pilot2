import express from 'express';
import cors from 'cors';
import reportSchemasRouter from './routes/reportSchemas.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/report-schemas', reportSchemasRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
