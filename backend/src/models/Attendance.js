const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Employee = require('./Employee');

const Attendance = sequelize.define(
  'Attendance',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      field: 'employee_id',
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    attendanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'attendance_date',
    },
    status: {
      type: DataTypes.ENUM('present', 'absent'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: 'attendances',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['employee_id', 'attendance_date'],
      },
    ],
  }
);

Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

module.exports = Attendance;
