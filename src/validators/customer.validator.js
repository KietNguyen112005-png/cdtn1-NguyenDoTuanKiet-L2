const { ValidationError } = require('../errors');

const PHONE_RE = /^0[0-9]{9}$/; // BR6: 10 chữ số, bắt đầu bằng 0
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// partial = true khi sửa: chỉ kiểm các trường có gửi lên.
function validateCustomer(input = {}, { partial = false } = {}) {
  const errors = [];
  const has = (k) => input[k] !== undefined;

  if (!partial || has('fullName')) {
    if (typeof input.fullName !== 'string' || input.fullName.trim() === '') {
      errors.push({ field: 'fullName', message: 'Họ tên khách hàng là bắt buộc' });
    } else if (input.fullName.trim().length > 120) {
      errors.push({ field: 'fullName', message: 'Họ tên tối đa 120 ký tự' });
    }
  }
  if (!partial || has('phone')) {
    if (typeof input.phone !== 'string' || !PHONE_RE.test(input.phone)) {
      errors.push({ field: 'phone', message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0' });
    }
  }
  if (has('email') && input.email !== null && input.email !== '' && !EMAIL_RE.test(input.email)) {
    errors.push({ field: 'email', message: 'Email không đúng định dạng' });
  }
  if (has('address') && typeof input.address === 'string' && input.address.length > 255) {
    errors.push({ field: 'address', message: 'Địa chỉ tối đa 255 ký tự' });
  }
  if (errors.length) throw new ValidationError(errors);

  return {
    ...(has('fullName') && { fullName: input.fullName.trim() }),
    ...(has('phone') && { phone: input.phone }),
    ...(has('address') && { address: input.address || null }),
    ...(has('email') && { email: input.email || null }),
  };
}

function validatePhone(phone) {
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    throw new ValidationError([{ field: 'phone', message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0' }]);
  }
  return phone;
}

module.exports = { validateCustomer, validatePhone, PHONE_RE };
