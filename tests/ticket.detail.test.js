const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/services/ticket.service');
const { ValidationError, NotFoundError } = require('../src/errors');
const { makeTicketDeps } = require('./helpers/fakes');

const input = { customerId: 1, deviceId: 10, categoryId: 2, issueDesc: 'Pin sụt nhanh, máy tự tắt nguồn' };

test('[Luồng đúng] chi tiết phiếu gồm phiếu, khách, thiết bị, nhóm sự cố và lịch sử trạng thái', async () => {
  const svc = createTicketService(makeTicketDeps().deps);
  const created = await svc.create(input, 'nv01');
  const d = await svc.detail(created.id);
  assert.equal(d.ticket.ticketCode, 'BH-000231/2026');
  assert.equal(d.customer.fullName, 'Nguyễn Văn B');
  assert.equal(d.device.modelName, 'iPhone 13');
  assert.equal(d.category.name, 'PIN');
  assert.equal(d.history[0].toStatus, 'MOI');
});

test('[Luồng đúng] tra phiếu theo mã, bỏ khoảng trắng thừa ở hai đầu', async () => {
  const svc = createTicketService(makeTicketDeps().deps);
  await svc.create(input);
  assert.equal((await svc.detailByCode('  BH-000231/2026 ')).ticket.id, 231);
});

test('[Dữ liệu sai] mã phiếu rỗng bị từ chối kèm tên trường, mã không tồn tại báo không tìm thấy', async () => {
  const svc = createTicketService(makeTicketDeps().deps);
  await assert.rejects(svc.detailByCode('   '), (e) => e instanceof ValidationError && e.fields[0].field === 'code');
  await assert.rejects(svc.detailByCode('BH-999999/2026'), NotFoundError);
  await assert.rejects(svc.detail(424242), NotFoundError);
});
