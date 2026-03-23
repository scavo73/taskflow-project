const { PORT } = require('./config/env');
const app = require('./app');

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});