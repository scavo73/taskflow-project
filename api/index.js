const app = require('../server/src/app');

// Vercel serverless handler: delega en Express directamente.
// Esto evita posibles hangs de `serverless-http` en el entorno.
module.exports = (req, res) => {
  // En rewrites Vercel puede modificar `req.url`, así que forzamos que Express
  // use la URL original para que matchee `app.use('/api/v1/tasks', ...)`.
  if (req?.originalUrl) req.url = req.originalUrl;

  // Usamos handle() para asegurar el flujo interno de Express.
  return app.handle(req, res);
};

