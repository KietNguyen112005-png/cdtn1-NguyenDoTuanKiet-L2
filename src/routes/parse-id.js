const { ValidationError } = require('../errors');

// Đổi tham số id trên đường dẫn thành số nguyên dương; sai thì báo lỗi nhập liệu (400) thay vì để NaN xuống CSDL.
module.exports = function parseId(raw, field = 'id') {
  if (typeof raw === 'string' && /^[1-9]\d*$/.test(raw) && Number.isSafeInteger(Number(raw))) return Number(raw);
  throw new ValidationError([{ field, message: `${field} phải là số nguyên dương` }]);
};
