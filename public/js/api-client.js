// Lớp client API: MỌI lệnh gọi máy chủ của giao diện đều đi qua đây.
const ApiClient = (() => {
  const KEY = 'crm_token';
  const token = () => sessionStorage.getItem(KEY);

  async function request(method, path, body) {
    let res;
    try {
      res = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token() && { Authorization: `Bearer ${token()}` }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw { code: 'NETWORK', message: 'Không kết nối được máy chủ. Kiểm tra máy chủ đang chạy rồi thử lại.' };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) sessionStorage.removeItem(KEY);
      const e = json.error || { code: 'UNKNOWN', message: 'Có lỗi xảy ra, vui lòng thử lại' };
      // Lỗi nhập liệu: hiển thị câu thân thiện của từng trường thay vì câu chung.
      throw { status: res.status, ...e, ...(e.fields && { message: e.fields.map((f) => f.message).join('. ') }) };
    }
    return json.data;
  }
  const q = (obj) => new URLSearchParams(Object.entries(obj).filter(([, v]) => v)).toString();

  return {
    isLoggedIn: () => !!token(),
    async login(username, password) {
      const d = await request('POST', '/auth/login', { username, password });
      sessionStorage.setItem(KEY, d.token);
      return d;
    },
    logout: () => sessionStorage.removeItem(KEY),
    lookupCustomer: (phone) => request('GET', `/customers?phone=${encodeURIComponent(phone)}`),
    createCustomer: (c) => request('POST', '/customers', c),
    createDevice: (d) => request('POST', '/catalog/devices', d),
    listDevices: (customerId) => request('GET', `/catalog/devices?customerId=${customerId}`),
    listCategories: () => request('GET', '/catalog/categories'),
    createTicket: (t) => request('POST', '/tickets', t),
    listTickets: (status) => request('GET', `/tickets?${q({ status, limit: 100 })}`),
    changeStatus: (id, toStatus) => request('PATCH', `/tickets/${id}/status`, { toStatus }),
  };
})();
