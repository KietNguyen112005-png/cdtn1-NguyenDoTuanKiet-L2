const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/services/ticket.service');
const { ValidationError, BusinessRuleError } = require('../src/errors');
const { makeTicketDeps } = require('./helpers/fakes');

const validInput = { customerId: 1, deviceId: 10, categoryId: 2, issueDesc: 'Pin sụt nhanh, máy tự tắt nguồn' };

// ---------- Loại 1: LUỒNG ĐÚNG ----------
test('[Luồng đúng] tiếp nhận thiết bị còn bảo hành thì tạo được phiếu MỚI với hạn SLA đúng', async () => {
  const { deps, calls } = makeTicketDeps();
  const ticket = await createTicketService(deps).create(validInput, 'nv01');

  assert.equal(ticket.status, 'MOI');
  assert.equal(ticket.ticketCode, 'BH-000231/2026');
  assert.equal(ticket.isWarranty, true);
  assert.equal(ticket.warrantyStatus, 'CON_BAO_HANH');
  assert.equal(ticket.priority, 'TRUNG_BINH'); // lấy mức mặc định của nhóm PIN
  // 72 giờ từ thứ Sáu 10:00, bỏ qua Chủ nhật => thứ Ba 20/10/2026 10:00 (giờ VN)
  assert.equal(ticket.dueDate.getTime(), new Date('2026-10-20T10:00:00+07:00').getTime());
  assert.equal(calls.inserted[0].actor, 'nv01');
});

test('[Luồng đúng] chuyển trạng thái hợp lệ MOI -> DA_PHAN_CONG được ghi nhận', async () => {
  const { deps, calls } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(validInput);
  const updated = await svc.changeStatus(t.id, 'DA_PHAN_CONG', 'nv01');

  assert.equal(updated.status, 'DA_PHAN_CONG');
  assert.deepEqual(calls.statusUpdates.map((u) => [u.from, u.to]), [['MOI', 'DA_PHAN_CONG']]);
});

// ---------- Loại 3: DỮ LIỆU SAI ----------
test('[Dữ liệu sai] thiếu mô tả lỗi thì bị từ chối kèm tên trường, không lưu phiếu', async () => {
  const { deps, calls } = makeTicketDeps();
  const { issueDesc, ...missing } = validInput;

  await assert.rejects(createTicketService(deps).create(missing), (err) => {
    assert.ok(err instanceof ValidationError);
    assert.deepEqual(err.fields.map((f) => f.field), ['issueDesc']);
    return true;
  });
  assert.equal(calls.inserted.length, 0);
});

test('[Dữ liệu sai] mô tả quá ngắn hoặc mức ưu tiên lạ đều bị từ chối', async () => {
  const { deps } = makeTicketDeps();
  const svc = createTicketService(deps);
  await assert.rejects(svc.create({ ...validInput, issueDesc: 'hỏng' }), ValidationError);
  await assert.rejects(svc.create({ ...validInput, priority: 'KHAN_CAP' }), ValidationError);
});

test('[Dữ liệu sai] thiết bị của khách khác bị từ chối bằng lỗi nghiệp vụ, không sập', async () => {
  const { deps } = makeTicketDeps({
    deviceRepo: { findById: async () => ({ id: 10, customerId: 99, purchaseDate: '2025-12-15', warrantyMonths: 12 }) },
  });
  await assert.rejects(createTicketService(deps).create(validInput), BusinessRuleError);
});

// ---------- Quy tắc nghiệp vụ BR4, BR5 ----------
test('[BR5] không cho nhảy trạng thái MOI -> HOAN_TAT', async () => {
  const { deps, calls } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(validInput);
  await assert.rejects(svc.changeStatus(t.id, 'HOAN_TAT', 'nv01'), BusinessRuleError);
  assert.equal(calls.statusUpdates.length, 0);
});

test('[BR4] chỉ sửa được mô tả lỗi khi phiếu còn ở trạng thái MOI', async () => {
  const { deps } = makeTicketDeps();
  const svc = createTicketService(deps);
  const t = await svc.create(validInput);
  const edited = await svc.updateDescription(t.id, { issueDesc: 'Pin phồng, máy nóng bất thường' });
  assert.equal(edited.issueDesc, 'Pin phồng, máy nóng bất thường');

  await svc.changeStatus(t.id, 'DA_PHAN_CONG', 'nv01');
  await assert.rejects(svc.updateDescription(t.id, { issueDesc: 'Mô tả mới đủ dài rồi' }), BusinessRuleError);
});
