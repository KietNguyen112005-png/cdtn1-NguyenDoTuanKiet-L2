const db = require('../db');

const map = (r) => r && ({
  id: r.category_id, name: r.category_name, defaultPriority: r.default_priority, isActive: r.is_active,
});

module.exports = {
  async list() {
    const { rows } = await db.query('SELECT * FROM issue_category WHERE is_active ORDER BY category_id');
    return rows.map(map);
  },

  async findById(id) {
    const { rows } = await db.query('SELECT * FROM issue_category WHERE category_id = $1', [id]);
    return map(rows[0]);
  },
};
