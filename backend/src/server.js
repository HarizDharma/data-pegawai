require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const employeesRoute = require('./routes/employees');
const attendancesRoute = require('./routes/attendances');
const reportsRoute = require('./routes/reports');
const metaRoute = require('./routes/meta');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/employees', employeesRoute);
app.use('/attendances', attendancesRoute);
app.use('/reports', reportsRoute);
app.use('/meta', metaRoute);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

const port = process.env.PORT || 4000;

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(port, () => console.log(`API berjalan di http://localhost:${port}`));
  } catch (error) {
    console.error('Gagal menyalakan server', error);
    process.exit(1);
  }
};

start();
