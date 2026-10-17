const db = require('../db');

const map = (r) => r && ({
  id: r.category_id, name: r.category_name, defaultPriority: r.default_priority, isActive: r.is_active,
});

module.exports = {
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM issue_category WHERE category_id = $1', [id]);
    return map(rows[0]);
  },
};
