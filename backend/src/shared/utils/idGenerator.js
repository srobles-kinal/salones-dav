const { v4: uuidv4 } = require('uuid');
const { formatDateCompact } = require('./dateUtils');

const generateId = () => uuidv4();

const generateTicket = (prefix, date, sequence) =>
  `${prefix}-${formatDateCompact(date)}-${String(sequence).padStart(4, '0')}`;

module.exports = { generateId, generateTicket };
