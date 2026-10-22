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
  async findBySerial(serialNo) {
    const { rows } = await db.query('SELECT * FROM device WHERE serial_no = $1', [serialNo]);
    return map(rows[0]);
  },
  async listByCustomer(customerId) {
    const { rows } = await db.query('SELECT * FROM device WHERE customer_id = $1 ORDER BY device_id', [customerId]);
    return rows.map(map);
  },
  async insert({ customerId, modelName, serialNo, purchaseDate, warrantyMonths, purchaseNote }) {
    const { rows } = await db.query(
      `INSERT INTO device (customer_id, model_name, serial_no, purchase_date, warranty_months, purchase_note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [customerId, modelName, serialNo, purchaseDate, warrantyMonths, purchaseNote],
    );
    return map(rows[0]);
  },
};
