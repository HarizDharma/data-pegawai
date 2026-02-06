const express = require('express');
const { Op } = require('sequelize');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { getHolidayList, getMonthDateRange, getWorkingDaysInMonth } = require('../utils/date');

const router = express.Router();

router.get('/monthly', async (req, res) => {
  const { month, employeeId } = req.query;
  if (!month) return res.status(400).json({ message: 'Parameter bulan wajib diisi (format YYYY-MM)' });

  const range = getMonthDateRange(month);

  const where = employeeId ? { id: employeeId } : undefined;
  const employees = await Employee.findAll({
    where,
    include: [
      {
        model: Attendance,
        as: 'attendances',
        required: false,
        where: {
          attendanceDate: {
            [Op.between]: [range.start, range.end],
          },
        },
      },
    ],
    order: [['fullName', 'ASC']],
  });

  const holidays = await getHolidayList({ month });
  const workingDays = getWorkingDaysInMonth(month, holidays);

  const summaries = employees.map((employee) => {
    const dayMap = new Map();
    (employee.attendances || []).forEach((item) => {
      dayMap.set(item.attendanceDate, item);
    });

    let presentDays = 0;
    const details = workingDays.map((date) => {
      const record = dayMap.get(date);
      if (record?.status === 'present') presentDays += 1;
      return {
        date,
        status: record ? record.status : 'absent',
        notes: record?.notes ?? null,
      };
    });

    return {
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        position: employee.position,
      },
      presentDays,
      absentDays: workingDays.length - presentDays,
      details,
    };
  });

  res.json({ month, totalWorkingDays: workingDays.length, holidays, summaries });
});

module.exports = router;
