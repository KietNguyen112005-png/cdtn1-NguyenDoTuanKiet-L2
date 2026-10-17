const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthService } = require('../src/services/auth.service');
const { UnauthorizedError } = require('../src/errors');

const cfg = { username: 'nv', password: 'mk-dung', secret: 'bi-mat-test-dai-hon-32-ky-tu-abcdef' };

test('[Luồng đúng] đăng nhập đúng nhận được token và token xác thực được', () => {
  const svc = createAuthService(cfg);
  assert.equal(svc.verify(svc.login('nv', 'mk-dung').token).username, 'nv');
});
test('[Dữ liệu sai] sai mật khẩu hoặc token bị sửa đều bị từ chối', () => {
  const svc = createAuthService(cfg);
  assert.throws(() => svc.login('nv', 'sai'), UnauthorizedError);
  const token = svc.login('nv', 'mk-dung').token;
  assert.throws(() => svc.verify(token.slice(0, -2) + 'xx'), UnauthorizedError);
});
test('[Giá trị biên] token hết hạn đúng lúc quá hạn thì bị từ chối', () => {
  let now = 1000;
  const svc = createAuthService({ ...cfg, ttlMs: 500, clock: { now: () => now } });
  const { token } = svc.login('nv', 'mk-dung');
  now = 1500; assert.equal(svc.verify(token).username, 'nv'); // đúng hạn chót vẫn còn hiệu lực
  now = 1501; assert.throws(() => svc.verify(token), UnauthorizedError);
});
