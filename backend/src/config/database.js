const { Sequelize } = require('sequelize');

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_NAME = 'cubiconia_attendance',
  DB_USER = 'root',
  DB_PASSWORD = 'secret',
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false,
});

module.exports = { sequelize };
