const express = require('express');
const { z } = require('zod');
const Employee = require('../models/Employee');

const router = express.Router();

const employeeSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  position: z.string().min(2),
  hireDate: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

router.get('/', async (_req, res) => {
  const employees = await Employee.findAll({ order: [['createdAt', 'DESC']] });
  res.json(employees);
});

router.get('/:id', async (req, res) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
  res.json(employee);
});

router.post('/', async (req, res) => {
  try {
    const payload = employeeSchema.parse(req.body);
    const created = await Employee.create(payload);
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payload = employeeSchema.partial().parse(req.body);
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
    await employee.update(payload);
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const employee = await Employee.findByPk(req.params.id);
  if (!employee) return res.status(404).json({ message: 'Pegawai tidak ditemukan' });
  await employee.destroy();
  res.status(204).send();
});

module.exports = router;
