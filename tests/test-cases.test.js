// Bộ test case của Bài tập 3 (Test Report). Tên mỗi test bắt đầu bằng mã TC-xx để chạy lại riêng một ca:
//   node --test --test-name-pattern="TC-05"
// Tiền điều kiện dựng bằng code (đối tượng giả trong tests/helpers/fakes.js, đồng hồ cố định 16/10/2026 10:00 giờ VN).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/services/ticket.service');
const { createCustomerService } = require('../src/services/customer.service');
const { createAuthService } = require('../src/services/auth.service');
const { evaluateWarranty } = require('../src/rules/warranty');
const { validateDevice } = require('../src/validators/device.validator');
const { ValidationError, BusinessRuleError, UnauthorizedError } = require('../src/errors');
const { makeTicketDeps, makeCustomerRepo } = require('./helpers/fakes');

const input = { customerId: 1, deviceId: 10, categoryId: 2, issueDesc: 'Pin sụt nhanh, máy tự tắt nguồn' };

// ---------- Luồng đúng ----------
test('TC-01 [Luồng đúng] BR1+BR2: thiết bị còn bảo hành thì tạo được phiếu MOI, mã BH-000231/2026, hạn đúng', async () => {
  const { deps, calls } = makeTicketDeps();
  const t = await createTicketService(deps).create(input, 'nv01');
  assert.equal(t.status, 'MOI');
  assert.equal(t.ticketCode, 'BH-000231/2026');
  assert.equal(t.isWarranty, true);
  assert.equal(t.dueDate.getTime(), new Date('2026-10-20T10:00:00+07:00').getTime()); // 72 giờ từ thứ Sáu 10:00, bỏ Chủ nhật
  assert.equal(calls.inserted.length, 1); // tác dụng phụ: đúng một phiếu được lưu
});

test('TC-02 [Luồng đúng] BR5: chuyển MOI sang DA_PHAN_CONG thì đổi trạng thái và ghi đúng một lần chuyển', async () => {
  const { deps, calls } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(input);
  const u = await svc.changeStatus(t.id, 'DA_PHAN_CONG', 'nv01');
  assert.equal(u.status, 'DA_PHAN_CONG');
  assert.deepEqual(calls.statusUpdates.map((x) => [x.from, x.to, x.actor]), [['MOI', 'DA_PHAN_CONG', 'nv01']]);
});

test('TC-03 [Luồng đúng] BR6+BR7: tạo khách hợp lệ, rồi ngừng hoạt động nhưng không xoá vật lý', async () => {
  const { repo, rows } = makeCustomerRepo();
  const svc = createCustomerService({ customerRepo: repo });
  const c = await svc.create({ fullName: '  Nguyễn Văn A ', phone: '0937482915' });
  assert.equal(c.fullName, 'Nguyễn Văn A');
  const after = await svc.deactivate(c.id);
  assert.equal(after.isActive, false);
  assert.equal(rows.length, 1); // vẫn còn bản ghi
});

test('TC-04 [Luồng đúng] BR4: sửa mô tả lỗi khi phiếu còn MOI thì lưu mô tả mới', async () => {
  const { deps } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(input);
  const e = await svc.updateDescription(t.id, { issueDesc: 'Pin phồng, máy nóng bất thường' });
  assert.equal(e.issueDesc, 'Pin phồng, máy nóng bất thường');
});

// ---------- Giá trị biên (hai bên cùng một ranh giới: mua 15/06/2025, bảo hành 12 tháng) ----------
test('TC-05 [Giá trị biên] BR1: ngày cuối cùng còn bảo hành (15/06/2026) vẫn CÒN bảo hành', () => {
  const r = evaluateWarranty({ purchaseDate: '2025-06-15', warrantyMonths: 12 }, '2026-06-15');
  assert.deepEqual([r.isWarranty, r.status, r.expiresOn], [true, 'CON_BAO_HANH', '2026-06-15']);
});

test('TC-06 [Giá trị biên] BR1: ngày đầu tiên sau hạn (16/06/2026) đã HẾT bảo hành', () => {
  const r = evaluateWarranty({ purchaseDate: '2025-06-15', warrantyMonths: 12 }, '2026-06-16');
  assert.deepEqual([r.isWarranty, r.status], [false, 'HET_BAO_HANH']);
});

// ---------- Dữ liệu sai ----------
test('TC-07 [Dữ liệu sai] BR3: thiếu mô tả lỗi thì bị từ chối kèm tên trường issueDesc và KHÔNG lưu phiếu', async () => {
  const { deps, calls } = makeTicketDeps();
  const { issueDesc, ...thieu } = input;
  await assert.rejects(createTicketService(deps).create(thieu), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.deepEqual(e.fields.map((f) => f.field), ['issueDesc']);
    return true;
  });
  assert.equal(calls.inserted.length, 0); // tác dụng phụ: không có phiếu mới
});

test('TC-08 [Dữ liệu sai] BR5: nhảy thẳng từ MOI sang HOAN_TAT bị từ chối, trạng thái không đổi', async () => {
  const { deps, calls, tickets } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(input);
  await assert.rejects(svc.changeStatus(t.id, 'HOAN_TAT', 'nv01'), BusinessRuleError);
  assert.equal(calls.statusUpdates.length, 0);
  assert.equal(tickets.get(t.id).status, 'MOI');
});

test('TC-09 [Dữ liệu sai] BR1: thiết bị có ngày mua ở tương lai bị từ chối; ngày mua là hôm nay thì hợp lệ', () => {
  const base = { modelName: 'iPhone 13', serialNo: '352099001234599' };
  const today = new Date('2026-10-28T03:00:00Z'); // 28/10/2026 giờ VN
  assert.throws(() => validateDevice({ ...base, purchaseDate: '2026-10-29' }, { today }), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.deepEqual(e.fields.map((f) => f.field), ['purchaseDate']);
    return true;
  });
  assert.equal(validateDevice({ ...base, purchaseDate: '2026-10-28' }, { today }).purchaseDate, '2026-10-28');
});

// ---------- Bảo mật (OWASP A07: xác thực) ----------
test('TC-10 [Bảo mật] A07: không token, token hết hạn, token sửa một ký tự hoặc thêm đuôi đều bị từ chối', () => {
  let now = 1000;
  const svc = createAuthService({ username: 'nv', password: 'mk', secret: 'bi-mat-test-dai-hon-32-ky-tu-abcdef', ttlMs: 500, clock: { now: () => now } });
  const { token } = svc.login('nv', 'mk');
  assert.throws(() => svc.verify(undefined), UnauthorizedError); // không gửi token
  const last = token.slice(-1) === 'A' ? 'B' : 'A';
  assert.throws(() => svc.verify(token.slice(0, -1) + last), UnauthorizedError); // sửa một ký tự
  assert.throws(() => svc.verify(`${token}.x`), UnauthorizedError); // thêm đuôi
  now = 1501; // quá hạn
  assert.throws(() => svc.verify(token), UnauthorizedError);
});
