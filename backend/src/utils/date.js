const { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } = require('date-fns');
const { getIndonesianHolidays, getIndonesianHolidayDetails } = require('../services/holidayClient');

const normalizeDate = (date) => format(new Date(date), 'yyyy-MM-dd');
const weekendDays = new Set([5, 6, 0]); // Jumat, Sabtu, Minggu
const isWeekendDay = (date) => weekendDays.has(date.getDay());

const getWorkingDaysInMonth = (month, holidays = []) => {
  const baseDate = parseISO(`${month}-01`);
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error('Format bulan tidak valid, gunakan YYYY-MM');
  }

  const holidaySet = new Set(holidays);
  const interval = eachDayOfInterval({
    start: startOfMonth(baseDate),
    end: endOfMonth(baseDate),
  });

  return interval
    .filter((date) => !isWeekendDay(date))
    .map((date) => format(date, 'yyyy-MM-dd'))
    .filter((date) => !holidaySet.has(date));
};

const getMonthDateRange = (month) => {
  const baseDate = parseISO(`${month}-01`);
  if (Number.isNaN(baseDate.getTime())) {
    throw new Error('Format bulan tidak valid, gunakan YYYY-MM');
  }
  return {
    start: format(startOfMonth(baseDate), 'yyyy-MM-dd'),
    end: format(endOfMonth(baseDate), 'yyyy-MM-dd'),
  };
};

const getHolidayList = async (options = {}) => {
  const defaults = await getIndonesianHolidays(options);
  const fromEnv = process.env.HOLIDAYS;
  const custom = fromEnv
    ? fromEnv
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  return Array.from(new Set([...defaults, ...custom]));
};

const getHolidayDetails = async (options = {}) => {
  const defaults = await getIndonesianHolidayDetails(options);
  const custom = (process.env.HOLIDAYS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((date) => ({ date, name: 'Tanggal merah tambahan' }));
  const map = new Map();
  [...defaults, ...custom].forEach((item) => {
    map.set(item.date, item.name);
  });
  return Array.from(map.entries()).map(([date, name]) => ({ date, name }));
};

module.exports = {
  normalizeDate,
  getWorkingDaysInMonth,
  getHolidayList,
  getMonthDateRange,
  getHolidayDetails,
};
