const express = require('express');
const { getHolidayDetails } = require('../utils/date');

const router = express.Router();

const collectParamValues = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectParamValues(item));
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

router.get('/holidays', async (req, res) => {
  const years = collectParamValues(req.query.year).concat(collectParamValues(req.query.years));
  const months = collectParamValues(req.query.month).concat(collectParamValues(req.query.months));

  const options = {};
  const parsedYears = years
    .map((item) => Number(item))
    .filter((value) => Number.isFinite(value));
  if (parsedYears.length > 0) {
    options.years = parsedYears;
  }

  const parsedMonths = months.filter((value) => /^(\d{4})-(\d{2})$/.test(value));
  if (parsedMonths.length > 0) {
    options.months = parsedMonths;
  }

  const holidays = await getHolidayDetails(options);
  res.json({ holidays });
});

module.exports = router;
