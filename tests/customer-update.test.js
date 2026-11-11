// Kiểm thử sửa và ngừng hoạt động khách hàng (nghiệp vụ phía sau màn hình Khách hàng).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createCustomerService } = require('../src/services/customer.service');
const { ValidationError, ConflictError, NotFoundError } = require('../src/errors');
const { makeCustomerRepo } = require('./helpers/fakes');

async function setup() {
  const { repo, rows, calls } = makeCustomerRepo();
  const svc = createCustomerService({ customerRepo: repo });
  const a = await svc.create({ fullName: 'Nguyễn Văn A', phone: '0937482915' });
  const b = await svc.create({ fullName: 'Trần Thị B', phone: '0865139704' });
  return { svc, rows, calls, a, b };
}

test('[Luồng đúng] sửa họ tên, địa chỉ và email thì lưu giá trị mới (đã cắt khoảng trắng)', async () => {
  const { svc, a } = await setup();
  const u = await svc.update(a.id, { fullName: '  Nguyễn Văn An ', address: 'Quận 1, TP.HCM', email: 'an@example.com' });
  assert.deepEqual([u.fullName, u.address, u.email], ['Nguyễn Văn An', 'Quận 1, TP.HCM', 'an@example.com']);
});

test('[Giá trị biên] giữ nguyên số điện thoại của chính mình khi sửa tên thì không bị báo trùng', async () => {
  const { svc, a } = await setup();
  const u = await svc.update(a.id, { fullName: 'Nguyễn Văn An', phone: a.phone });
  assert.equal(u.phone, a.phone);
});

test('[Dữ liệu sai] đổi sang số điện thoại của khách khác bị từ chối và hồ sơ không đổi', async () => {
  const { svc, a, b, rows } = await setup();
  await assert.rejects(svc.update(a.id, { phone: b.phone }), ConflictError);
  assert.equal(rows.find((r) => r.id === a.id).phone, '0937482915');
});

test('[Dữ liệu sai] họ tên rỗng hoặc số điện thoại sai định dạng bị từ chối kèm tên trường', async () => {
  const { svc, a } = await setup();
  await assert.rejects(svc.update(a.id, { fullName: '   ' }), (e) => e instanceof ValidationError && e.fields[0].field === 'fullName');
  await assert.rejects(svc.update(a.id, { phone: '12345' }), (e) => e instanceof ValidationError && e.fields[0].field === 'phone');
});

test('[Dữ liệu sai] sửa khách không tồn tại thì báo không tìm thấy', async () => {
  const { svc } = await setup();
  await assert.rejects(svc.update(9999, { fullName: 'Ai đó' }), NotFoundError);
});

test('[BR7] khách đã ngừng hoạt động vẫn tra cứu được và được đánh dấu isActive = false để giao diện hiện đúng', async () => {
  const { svc, a } = await setup();
  await svc.deactivate(a.id);
  const found = await svc.findByPhone(a.phone);
  assert.equal(found.isActive, false);
});
