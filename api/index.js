const serverlessHttp = require('serverless-http');
const app = require('../server/src/app');

// Vercel serverless handler que delega en Express.
// `callbackWaitsForEmptyEventLoop: false` ayuda a evitar hangs/timeouts en serverless.
module.exports = serverlessHttp(app, {
  callbackWaitsForEmptyEventLoop: false
});

