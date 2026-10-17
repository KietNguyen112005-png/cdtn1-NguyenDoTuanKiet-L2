const db = require('../db');

const map = (r) => r && ({
  id: Number(r.device_id), customerId: Number(r.customer_id), modelName: r.model_name,
  serialNo: r.serial_no, purchaseDate: r.purchase_date, warrantyMonths: r.warranty_months,
  purchaseNote: r.purchase_note,
});

module.exports = {
  async findById(id) {
    const { rows } = await db.query('SELECT * FROM device WHERE device_id = $1', [id]);
    return map(rows[0]);
  },
  async listByCustomer(customerId) {
    const { rows } = await db.query('SELECT * FROM device WHERE customer_id = $1 ORDER BY device_id', [customerId]);
    return rows.map(map);
  },
};
