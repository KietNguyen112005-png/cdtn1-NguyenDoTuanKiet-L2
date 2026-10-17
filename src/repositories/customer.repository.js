// Lớp repositories: chỉ chứa SQL, không có quy tắc nghiệp vụ.
const db = require('../db');

const map = (r) => r && ({
  id: Number(r.customer_id), fullName: r.full_name, phone: r.phone, address: r.address,
  email: r.email, isActive: r.is_active, createdAt: r.created_at,
});

module.exports = {
  async insert({ fullName, phone, address = null, email = null }) {
    const { rows } = await db.query(
      `INSERT INTO customer (full_name, phone, address, email) VALUES ($1, $2, $3, $4) RETURNING *`,
      [fullName, phone, address, email],
    );
    return map(rows[0]);
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM customer WHERE customer_id = $1', [id]);
    return map(rows[0]);
  },

  async findByPhone(phone) {
    const { rows } = await db.query('SELECT * FROM customer WHERE phone = $1', [phone]);
    return map(rows[0]);
  },

  async list({ limit, offset }) {
    const { rows } = await db.query(
      'SELECT * FROM customer WHERE is_active ORDER BY customer_id LIMIT $1 OFFSET $2', [limit, offset],
    );
    return rows.map(map);
  },

  async update(id, { fullName, phone, address, email }) {
    const { rows } = await db.query(
      `UPDATE customer SET
         full_name = COALESCE($2, full_name),
         phone     = COALESCE($3, phone),
         address   = CASE WHEN $4::boolean THEN $5::varchar ELSE address END,
         email     = CASE WHEN $6::boolean THEN $7::varchar ELSE email END
       WHERE customer_id = $1 RETURNING *`,
      [id, fullName ?? null, phone ?? null,
        address !== undefined, address ?? null, email !== undefined, email ?? null],
    );
    return map(rows[0]);
  },

  async setActive(id, isActive) {
    const { rows } = await db.query(
      'UPDATE customer SET is_active = $2 WHERE customer_id = $1 RETURNING *', [id, isActive],
    );
    return map(rows[0]);
  },
};
