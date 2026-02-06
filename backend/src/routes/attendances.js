const express = require('express');
const { Op, UniqueConstraintError } = require('sequelize');
const { z } = require('zod');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { getMonthDateRange } = require('../utils/date');

const router = express.Router();

const attendanceSchema = z.object({
  employeeId: z.number().int(),
  attendanceDate: z.string().regex(/\d{4}-\d{2}-\d{2}/, 'Gunakan format YYYY-MM-DD'),
  status: z.enum(['present', 'absent']),
  notes: z.string().optional().nullable(),
});

router.get('/', async (req, res) => {
  const { employeeId, month, page = 1, limit = 50 } = req.query;
  const where = {};

  if (employeeId) where.employeeId = employeeId;
  if (month) {
    const range = getMonthDateRange(month);
    where.attendanceDate = { [Op.between]: [range.start, range.end] };
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
  const currentPage = Math.max(Number(page) || 1, 1);

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    order: [['attendanceDate', 'DESC']],
    include: { model: Employee, as: 'employee' },
    limit: safeLimit,
    offset: (currentPage - 1) * safeLimit,
  });

  res.json({
    data: rows,
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit) || 1,
    },
  });
});

router.post('/', async (req, res) => {
  try {
    const payload = attendanceSchema.parse(req.body);
    const employee = await Employee.findByPk(payload.employeeId);
    if (!employee) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
    const created = await Attendance.create(payload);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res
        .status(409)
        .json({ message: 'Absensi untuk pegawai dan tanggal tersebut sudah tersedia' });
    }
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = attendanceSchema.partial().parse(req.body);
    const record = await Attendance.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Data absensi tidak ditemukan' });
    await record.update(payload);
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const record = await Attendance.findByPk(req.params.id);
  if (!record) return res.status(404).json({ message: 'Data absensi tidak ditemukan' });
  await record.destroy();
  res.status(204).send();
});

module.exports = router;
