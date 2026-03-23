const express = require('express');
const cors = require('cors');
const { CLIENT_ORIGIN } = require('./config/env');
const taskRoutes = require('./routes/task.routes');

const app = express();

// Middleware global: CORS
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);
app.use(express.json());

// Logger de peticiones (serverless: útil para debugging)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'TaskFlow API running'
  });
});

// Rutas
app.use('/api/v1/tasks', taskRoutes);
// Compatibilidad extra por si Vercel entrega la ruta sin el prefijo `/api`.
app.use('/v1/tasks', taskRoutes);

// 404 explícito para que nunca quede una request sin responder
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware global de errores (SIEMPRE al final)
app.use((err, req, res, next) => {
  if (err?.message === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;

