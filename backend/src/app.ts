import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

export default app;
