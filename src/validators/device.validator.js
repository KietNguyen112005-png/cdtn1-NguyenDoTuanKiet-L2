const { ValidationError } = require('../errors');

const isRealDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
};

// US3-AC2: thiết bị ngoài lịch sử, không có ngày mua thì bắt buộc ghi chú nguồn gốc mua hàng.
function validateDevice(input = {}) {
  const errors = [];
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  const modelName = str(input.modelName); const serialNo = str(input.serialNo);
  const purchaseDate = str(input.purchaseDate); const purchaseNote = str(input.purchaseNote);
  const warrantyMonths = input.warrantyMonths === undefined ? 12 : input.warrantyMonths;

  if (!modelName) errors.push({ field: 'modelName', message: 'Model thiết bị là bắt buộc' });
  else if (modelName.length > 120) errors.push({ field: 'modelName', message: 'Model tối đa 120 ký tự' });
  if (!serialNo) errors.push({ field: 'serialNo', message: 'IMEI/Serial là bắt buộc' });
  else if (serialNo.length > 50) errors.push({ field: 'serialNo', message: 'IMEI/Serial tối đa 50 ký tự' });
  if (purchaseDate && !isRealDate(purchaseDate)) errors.push({ field: 'purchaseDate', message: 'Ngày mua phải có dạng YYYY-MM-DD' });
  if (!Number.isInteger(warrantyMonths) || warrantyMonths < 1 || warrantyMonths > 120) {
    errors.push({ field: 'warrantyMonths', message: 'Số tháng bảo hành phải từ 1 đến 120' });
  }
  if (!purchaseDate && !purchaseNote) {
    errors.push({ field: 'purchaseNote', message: 'Cần ghi chú hóa đơn/nguồn gốc mua hàng khi không có ngày mua' });
  } else if (purchaseNote.length > 255) errors.push({ field: 'purchaseNote', message: 'Ghi chú tối đa 255 ký tự' });

  if (errors.length) throw new ValidationError(errors);
  return { modelName, serialNo, purchaseDate: purchaseDate || null, warrantyMonths, purchaseNote: purchaseNote || null };
}
module.exports = { validateDevice };
