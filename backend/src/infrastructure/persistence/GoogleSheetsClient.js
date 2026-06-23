const { google } = require('googleapis');
const env = require('../../config/env');
const logger = require('../../config/logger');

class GoogleSheetsClient {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.auth = new google.auth.JWT({
      email: env.GOOGLE_CLIENT_EMAIL,
      key: env.GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.cache = new Map();
    this.cacheTTL = 30_000;
    this.headersCache = new Map();
  }

  async getHeaders(sheetName) {
    if (this.headersCache.has(sheetName)) return this.headersCache.get(sheetName);
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!1:1`,
    });
    const headers = res.data.values?.[0] || [];
    this.headersCache.set(sheetName, headers);
    return headers;
  }

  async getAll(sheetName) {
    const key = `getAll:${sheetName}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.t < this.cacheTTL) return cached.data;

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
      });
      const values = res.data.values || [];
      if (values.length === 0) return [];

      const headers = values[0];
      this.headersCache.set(sheetName, headers);

      const data = values.slice(1).map((row, idx) => {
        const obj = { _rowIndex: idx + 2 };
        headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
        return obj;
      });
      this.cache.set(key, { data, t: Date.now() });
      return data;
    } catch (err) {
      logger.error('Sheets getAll failed', { sheetName, error: err.message });
      throw err;
    }
  }

  async findById(sheetName, id) {
    const all = await this.getAll(sheetName);
    return all.find((r) => r.id === id) || null;
  }

  async findBy(sheetName, predicate) {
    const all = await this.getAll(sheetName);
    return all.filter(predicate);
  }

  async findOneBy(sheetName, predicate) {
    const all = await this.getAll(sheetName);
    return all.find(predicate) || null;
  }

  async append(sheetName, record) {
    this.invalidate(sheetName);
    const headers = await this.getHeaders(sheetName);
    const row = headers.map((h) => {
      const v = record[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return String(v);
    });
    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
      return record;
    } catch (err) {
      logger.error('Sheets append failed', { sheetName, error: err.message });
      throw err;
    }
  }

  async update(sheetName, id, updates) {
    this.invalidate(sheetName);
    const all = await this.getAll(sheetName);
    const found = all.find((r) => r.id === id);
    if (!found) throw new Error(`Record ${id} not found in ${sheetName}`);

    const headers = await this.getHeaders(sheetName);
    const merged = { ...found, ...updates, actualizado_en: new Date().toISOString() };
    const row = headers.map((h) => {
      const v = merged[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return String(v);
    });

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A${found._rowIndex}:Z${found._rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });
    return merged;
  }

  async softDelete(sheetName, id) {
    return this.update(sheetName, id, { activo: false });
  }

  invalidate(sheetName) {
    for (const k of [...this.cache.keys()]) {
      if (k.includes(sheetName)) this.cache.delete(k);
    }
  }

  invalidateAll() { this.cache.clear(); }
}

let _instances = {};
function getClient(spreadsheetId) {
  if (!_instances[spreadsheetId]) _instances[spreadsheetId] = new GoogleSheetsClient(spreadsheetId);
  return _instances[spreadsheetId];
}

module.exports = { GoogleSheetsClient, getClient };
