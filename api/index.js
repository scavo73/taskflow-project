const serverlessHttp = require('serverless-http');
const app = require('../server/src/app');

// Vercel serverless handler que delega en Express.
// Nota: con `rewrites` Vercel puede cambiar `req.url`. Forzamos a que Express vea
// la URL original para que los `app.use('/api/v1/tasks', ...)` casen bien.
const handler = serverlessHttp(app);

module.exports = (req, res) => {
  if (req?.originalUrl) {
    req.url = req.originalUrl;
  }
  return handler(req, res);
};

