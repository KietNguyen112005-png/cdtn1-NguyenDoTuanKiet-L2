const db = require('../db');

module.exports = {
  async findByPriority(priority) {
    const { rows } = await db.query('SELECT priority, hours FROM sla_config WHERE priority = $1', [priority]);
    return rows[0] || null;
  },
};
