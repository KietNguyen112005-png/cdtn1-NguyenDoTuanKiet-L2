const test = require('node:test');
const assert = require('node:assert/strict');
const { createCatalogService } = require('../src/services/catalog.service');
const { ValidationError, ConflictError, NotFoundError } = require('../src/errors');

function make() {
  const devices = [];
  return {
    devices,
    svc: createCatalogService({
      categoryRepo: { list: async () => [] },
      customerRepo: { findById: async (id) => (id === 1 ? { id: 1, isActive: true } : null) },
      deviceRepo: {
        findBySerial: async (s) => devices.find((d) => d.serialNo === s) || null,
        insert: async (d) => { const r = { id: devices.length + 1, ...d }; devices.push(r); return r; },
        listByCustomer: async () => devices,
      },
    }),
  };
}
const valid = { customerId: 1, modelName: 'iPhone 13', serialNo: '861234567890123', purchaseDate: '2025-12-15' };

test('[Luồng đúng] thêm thiết bị mới có ngày mua, bảo hành mặc định 12 tháng', async () => {
  const { svc, devices } = make();
  const d = await svc.createDevice(valid);
  assert.equal(d.warrantyMonths, 12);
  assert.equal(devices.length, 1);
});
test('[Dữ liệu sai] thiếu IMEI/Serial bị từ chối kèm tên trường', async () => {
  const { svc } = make();
  await assert.rejects(svc.createDevice({ ...valid, serialNo: '' }), (e) => e instanceof ValidationError && e.fields[0].field === 'serialNo');
});
test('[Giá trị biên] không có ngày mua thì bắt buộc ghi chú nguồn gốc (US3-AC2)', async () => {
  const { svc } = make();
  const { purchaseDate, ...noDate } = valid;
  await assert.rejects(svc.createDevice(noDate), (e) => e.fields.some((f) => f.field === 'purchaseNote'));
  const ok = await svc.createDevice({ ...noDate, purchaseNote: 'Mua ngoài, mất hóa đơn' });
  assert.equal(ok.purchaseDate, null);
});
test('[Dữ liệu sai] IMEI trùng báo xung đột, khách không tồn tại báo không tìm thấy', async () => {
  const { svc } = make();
  await svc.createDevice(valid);
  await assert.rejects(svc.createDevice(valid), ConflictError);
  await assert.rejects(svc.createDevice({ ...valid, customerId: 99, serialNo: 'khac' }), NotFoundError);
});
