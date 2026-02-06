const API_BASE_URL = 'https://libur.deno.dev/api';
const cache = new Map();
const MAX_CACHE_AGE_MS = 1000 * 60 * 60 * 24; // 24 jam

const parseYear = (value) => {
  if (value === undefined || value === null) return null;
  const year = Number(value);
  return Number.isFinite(year) ? year : null;
};

const parseMonthYear = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
};

const resolveTargetYears = (options = {}) => {
  const currentYear = new Date().getFullYear();
  const defaults = [currentYear - 1, currentYear, currentYear + 1];
  const years = new Set(defaults);

  const addYear = (yearValue) => {
    const parsed = parseYear(yearValue);
    if (parsed) years.add(parsed);
  };

  const addMonth = (monthValue) => {
    const parsed = parseMonthYear(monthValue);
    if (parsed) years.add(parsed);
  };

  if (options.year !== undefined) addYear(options.year);
  (options.years || []).forEach(addYear);

  if (options.month) addMonth(options.month);
  (options.months || []).forEach(addMonth);

  return Array.from(years);
};

const fetchYearlyHolidays = async (year) => {
  const cached = cache.get(year);
  if (cached && Date.now() - cached.cachedAt < MAX_CACHE_AGE_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${API_BASE_URL}?year=${year}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Holiday API error ${response.status}`);
    }

    const data = await response.json();
    const normalized = (Array.isArray(data) ? data : [])
      .filter((item) => item?.date && item?.name)
      .map((item) => ({ date: item.date, name: item.name }));
    cache.set(year, { data: normalized, cachedAt: Date.now() });
    return normalized;
  } catch (error) {
    console.error(`Gagal memuat tanggal merah ${year}:`, error.message);
    cache.set(year, { data: [], cachedAt: Date.now() });
    return [];
  }
};

const aggregateHolidayData = (lists) => {
  const map = new Map();
  lists.flat().forEach((item) => {
    if (!map.has(item.date)) {
      map.set(item.date, item.name);
    }
  });
  return Array.from(map.entries()).map(([date, name]) => ({ date, name }));
};

const getIndonesianHolidayDetails = async (options = {}) => {
  const years = resolveTargetYears(options);
  const apiResults = await Promise.all(years.map(fetchYearlyHolidays));
  return aggregateHolidayData(apiResults);
};

const getIndonesianHolidays = async (options = {}) => {
  const details = await getIndonesianHolidayDetails(options);
  return details.map((item) => item.date);
};

module.exports = {
  getIndonesianHolidays,
  getIndonesianHolidayDetails,
};
