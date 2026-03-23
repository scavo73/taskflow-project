const serverlessHttp = require('serverless-http');
const app = require('../server/src/app');

// Vercel serverless handler que delega en Express.
module.exports = serverlessHttp(app);

