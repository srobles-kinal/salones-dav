const TZ_OFFSET_MIN = -360; // Guatemala UTC-6

const nowGT = () => new Date();

const toISO = (d) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());

const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + minutes * 60000);

const timeToMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const formatDateYYYYMMDD = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};

const formatDateCompact = (date) => formatDateYYYYMMDD(date).replace(/-/g, '');

const isSameDay = (a, b) => formatDateYYYYMMDD(a) === formatDateYYYYMMDD(b);

module.exports = { TZ_OFFSET_MIN, nowGT, toISO, addMinutes, timeToMinutes, formatDateYYYYMMDD, formatDateCompact, isSameDay };
