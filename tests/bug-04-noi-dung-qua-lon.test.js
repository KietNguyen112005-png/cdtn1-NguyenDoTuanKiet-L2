// Hồi quy BUG-04: nội dung gửi lên quá lớn là lỗi của người gọi, phải trả 413, không phải 500.
const test = require('node:test');
const assert = require('node:assert/strict');
const errorHandler = require('../src/routes/error-handler');

const run = (err) => {
  const res = { status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  errorHandler(err, {}, res, () => {});
  return res;
};

test('BUG-04 hồi quy: lỗi entity.too.large trả 413 với thông báo rõ ràng', () => {
  const res = run({ type: 'entity.too.large', status: 413 });
  assert.equal(res.code, 413);
  assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  assert.match(res.body.error.message, /quá lớn/);
});

test('BUG-04 hồi quy: lỗi lạ vẫn trả 500 chung chung, không lộ chi tiết', () => {
  const origErr = console.error; console.error = () => {};
  const res = run(new TypeError('chi tiết nội bộ không được lộ'));
  console.error = origErr;
  assert.equal(res.code, 500);
  assert.doesNotMatch(JSON.stringify(res.body), /chi tiết nội bộ/);
});
