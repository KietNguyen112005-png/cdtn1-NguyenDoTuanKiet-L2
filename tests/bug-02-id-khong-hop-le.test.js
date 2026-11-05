// Hồi quy BUG-02: id trên đường dẫn không phải số nguyên dương phải bị từ chối bằng lỗi nhập liệu (400), không thành NaN rồi lỗi 500 ở CSDL.
const test = require('node:test');
const assert = require('node:assert/strict');
const parseId = require('../src/routes/parse-id');
const { ValidationError } = require('../src/errors');

test('BUG-02 hồi quy: id hợp lệ được đổi thành số, id sai bị ValidationError kèm tên trường', () => {
  assert.equal(parseId('7801'), 7801);
  assert.equal(parseId('1'), 1); // biên dưới
  for (const bad of ['abc', '0', '-5', '1.5', '1e3', ' 7', '12abc', '', undefined, '9007199254740993']) {
    assert.throws(() => parseId(bad), (e) => e instanceof ValidationError && e.fields[0].field === 'id', `id=${bad}`);
  }
  assert.throws(() => parseId('x', 'customerId'), (e) => e.fields[0].field === 'customerId');
});
