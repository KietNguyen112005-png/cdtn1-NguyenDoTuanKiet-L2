// Đăng nhập cơ bản: so khớp tài khoản cấu hình bằng biến môi trường, cấp token ký HMAC có hạn dùng.
const crypto = require('crypto');
const { UnauthorizedError } = require('../errors');

function createAuthService({ username, password, secret, ttlMs = 8 * 3600 * 1000, clock = { now: () => Date.now() } }) {
  const sign = (payload) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const same = (a, b) => {
    const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
  };
  return {
    login(u, p) {
      if (!same(u ?? '', username) || !same(p ?? '', password)) throw new UnauthorizedError('Sai tên đăng nhập hoặc mật khẩu');
      const payload = Buffer.from(JSON.stringify({ u: username, exp: clock.now() + ttlMs })).toString('base64url');
      return { token: `${payload}.${sign(payload)}`, username };
    },
    verify(token) {
      const [payload, sig] = String(token || '').split('.');
      if (!payload || !sig || !same(sig, sign(payload))) throw new UnauthorizedError('Phiên đăng nhập không hợp lệ');
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (data.exp < clock.now()) throw new UnauthorizedError('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại');
      return { username: data.u };
    },
  };
}
module.exports = { createAuthService };
