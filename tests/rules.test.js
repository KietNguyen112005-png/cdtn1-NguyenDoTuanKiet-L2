const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateWarranty } = require('../src/rules/warranty');
const { addWorkingHours } = require('../src/rules/sla');

// ---------- Loại 2: GIÁ TRỊ BIÊN ----------
test('[Giá trị biên] ngày cuối cùng còn bảo hành và ngày đầu tiên hết bảo hành', () => {
  const device = { purchaseDate: '2025-06-15', warrantyMonths: 12 };
  const lastDay = evaluateWarranty(device, '2026-06-15');
  const nextDay = evaluateWarranty(device, '2026-06-16');

  assert.equal(lastDay.isWarranty, true);
  assert.equal(lastDay.status, 'CON_BAO_HANH');
  assert.equal(nextDay.isWarranty, false);
  assert.equal(nextDay.status, 'HET_BAO_HANH');
});

test('[Giá trị biên] mua ngày 31/08 bảo hành 6 tháng thì hết hạn ngày cuối tháng 2 (28/02)', () => {
  const device = { purchaseDate: '2024-08-31', warrantyMonths: 6 };
  assert.equal(evaluateWarranty(device, '2025-02-28').isWarranty, true);
  assert.equal(evaluateWarranty(device, '2025-03-01').isWarranty, false);
});

test('[Giá trị biên] không có ngày mua thì gắn nhãn CHUA_XAC_MINH, không coi là còn bảo hành', () => {
  const r = evaluateWarranty({ purchaseDate: null, warrantyMonths: 12 }, '2026-10-16');
  assert.deepEqual([r.status, r.isWarranty, r.expiresOn], ['CHUA_XAC_MINH', false, null]);
});

test('[Giá trị biên] SLA bỏ qua Chủ nhật: nhận thứ Bảy 10:00 + 24 giờ => thứ Hai 10:00', () => {
  const sat = new Date('2026-10-17T10:00:00+07:00');
  const due = addWorkingHours(sat, 24, 420);
  assert.equal(due.getTime(), new Date('2026-10-19T10:00:00+07:00').getTime());
});

test('SLA ngày thường: thứ Sáu 10:00 + 24 giờ => thứ Bảy 10:00', () => {
  const fri = new Date('2026-10-16T10:00:00+07:00');
  assert.equal(addWorkingHours(fri, 24, 420).getTime(), new Date('2026-10-17T10:00:00+07:00').getTime());
});
