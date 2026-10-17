const { Pool, types } = require('pg');
const config = require('./config');

types.setTypeParser(1082, (v) => v); // DATE -> chuỗi 'YYYY-MM-DD', tránh lệch múi giờ

const pool = new Pool({ connectionString: config.databaseUrl });

const query = (text, params) => pool.query(text, params);

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
