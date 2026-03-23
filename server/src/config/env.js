require('dotenv').config();

module.exports = {
  // Vercel serverless no siempre define `PORT`, así que usamos un fallback.
  PORT: process.env.PORT || 3000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*'
};