const db = require('../db');

const map = (r) => r && ({
  id: Number(r.ticket_id), ticketCode: r.ticket_code, customerId: Number(r.customer_id),
  deviceId: Number(r.device_id), categoryId: r.category_id, priority: r.priority,
  issueDesc: r.issue_desc, status: r.status, receivedAt: r.received_at, dueDate: r.due_date,
  isWarranty: r.is_warranty, closedAt: r.closed_at,
});

module.exports = {
  // Lấy trước ticket_id để service sinh mã phiếu BH-xxxxxx/năm.
  async reserveId() {
    const { rows } = await db.query(`SELECT nextval(pg_get_serial_sequence('ticket', 'ticket_id')) AS id`);
    return Number(rows[0].id);
  },

  // Tạo phiếu và dòng log đầu tiên trong cùng một giao dịch.
  insertWithLog(t, actor) {
    return db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, priority,
                             issue_desc, status, received_at, due_date, is_warranty)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [t.id, t.ticketCode, t.customerId, t.deviceId, t.categoryId, t.priority,
          t.issueDesc, t.status, t.receivedAt, t.dueDate, t.isWarranty],
      );
      await client.query(
        `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by) VALUES ($1, NULL, $2, $3)`,
        [t.id, t.status, actor],
      );
      return map(rows[0]);
    });
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM ticket WHERE ticket_id = $1', [id]);
    return map(rows[0]);
  },

  async list({ status, customerId, limit, offset }) {
    const where = [];
    const params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (customerId) { params.push(customerId); where.push(`customer_id = $${params.length}`); }
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM ticket ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY due_date ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return rows.map(map);
  },

  async updateDescription(id, issueDesc) {
    const { rows } = await db.query(
      'UPDATE ticket SET issue_desc = $2 WHERE ticket_id = $1 RETURNING *', [id, issueDesc],
    );
    return map(rows[0]);
  },

  // Chỉ cập nhật nếu trạng thái hiện tại còn đúng như service đã đọc (chống ghi đè đồng thời).
  updateStatus(id, fromStatus, toStatus, actor, closedAt) {
    return db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE ticket SET status = $3, closed_at = COALESCE($4, closed_at)
         WHERE ticket_id = $1 AND status = $2 RETURNING *`,
        [id, fromStatus, toStatus, closedAt],
      );
      if (!rows[0]) return null;
      await client.query(
        `INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_by) VALUES ($1,$2,$3,$4)`,
        [id, fromStatus, toStatus, actor],
      );
      return map(rows[0]);
    });
  },
};
