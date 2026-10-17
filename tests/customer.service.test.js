const test = require('node:test');
const assert = require('node:assert/strict');
const { createCustomerService } = require('../src/services/customer.service');
const { ValidationError, ConflictError, NotFoundError } = require('../src/errors');
const { makeCustomerRepo } = require('./helpers/fakes');

test('[Luồng đúng] tạo khách hàng mới với số điện thoại hợp lệ', async () => {
  const { repo } = makeCustomerRepo();
  const c = await createCustomerService({ customerRepo: repo }).create({ fullName: '  Nguyễn Văn A ', phone: '0988888888' });
  assert.equal(c.fullName, 'Nguyễn Văn A'); // đã cắt khoảng trắng thừa
  assert.equal(c.isActive, true);
});

test('[Dữ liệu sai] số điện thoại sai định dạng và thiếu họ tên bị từ chối kèm tên trường', async () => {
  const { repo } = makeCustomerRepo();
  await assert.rejects(createCustomerService({ customerRepo: repo }).create({ phone: '12345' }), (err) => {
    assert.ok(err instanceof ValidationError);
    assert.deepEqual(err.fields.map((f) => f.field).sort(), ['fullName', 'phone']);
    return true;
  });
});

test('[Dữ liệu sai] số điện thoại trùng bị từ chối bằng ConflictError', async () => {
  const { repo } = makeCustomerRepo();
  const svc = createCustomerService({ customerRepo: repo });
  await svc.create({ fullName: 'A', phone: '0988888888' });
  await assert.rejects(svc.create({ fullName: 'B', phone: '0988888888' }), ConflictError);
});

test('[BR7] xoá khách hàng chỉ đặt is_active = false, không xoá vật lý', async () => {
  const { repo, rows, calls } = makeCustomerRepo();
  const svc = createCustomerService({ customerRepo: repo });
  const c = await svc.create({ fullName: 'A', phone: '0988888888' });
  const after = await svc.deactivate(c.id);
  assert.equal(after.isActive, false);
  assert.equal(rows.length, 1);
  assert.deepEqual(calls.setActive, [[c.id, false]]);
});

test('tra cứu số điện thoại chưa có thì báo không tìm thấy (US1-AC2)', async () => {
  const { repo } = makeCustomerRepo();
  await assert.rejects(createCustomerService({ customerRepo: repo }).findByPhone('0900000000'), NotFoundError);
});
