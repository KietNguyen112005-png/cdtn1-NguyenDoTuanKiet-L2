const $main = document.getElementById('main');
const $nav = document.getElementById('nav');
const $logout = document.getElementById('logout');
const LABEL = { MOI: 'Mới', DA_PHAN_CONG: 'Đã phân công', DANG_XU_LY: 'Đang xử lý', CHO_LINH_KIEN: 'Chờ linh kiện', HOAN_TAT: 'Hoàn tất', DA_DONG: 'Đã đóng', DA_HUY: 'Đã hủy' };
const PRIO = { CAO: 'Cao', TRUNG_BINH: 'Trung bình', THAP: 'Thấp' };
const WARRANTY = { CON_BAO_HANH: ['Còn bảo hành', 'good'], HET_BAO_HANH: ['Hết bảo hành', 'late'], CHUA_XAC_MINH: ['Chưa xác minh bảo hành', 'warn'] };
// Gợi ý nút bấm cho giao diện; máy chủ vẫn là nơi quyết định (BR5).
const NEXT = { MOI: ['DA_PHAN_CONG', 'DA_HUY'], DA_PHAN_CONG: ['DANG_XU_LY', 'DA_HUY'], DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT'], CHO_LINH_KIEN: ['HOAN_TAT'], HOAN_TAT: ['DA_DONG'], DA_DONG: [], DA_HUY: [] };
const fmt = (d) => new Date(d).toLocaleString('vi-VN');

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v);
  }
  el.append(...kids.flat().filter((x) => x != null && x !== false));
  return el;
}
const panel = (...kids) => h('div', { class: 'panel' }, ...kids);

// Ba trạng thái dùng chung: đang tải, rỗng, lỗi (có nút Thử lại).
const loading = () => h('div', { class: 'state', role: 'status' }, 'Đang tải dữ liệu…');
const empty = (title, hint) => h('div', { class: 'state' }, h('strong', {}, title), h('div', {}, hint || ''));
function failure(err, retry) {
  return h('div', { class: 'state error', role: 'alert' }, h('div', {}, err.message || 'Có lỗi xảy ra'),
    retry && h('button', { class: 'btn', onclick: retry }, 'Thử lại'));
}
// Chạy một tác vụ bất đồng bộ và vẽ vào container: tải -> kết quả | lỗi.
async function load(container, task, render) {
  container.replaceChildren(loading());
  try { container.replaceChildren(render(await task())); } catch (err) {
    if (err.status === 401) return showLogin(err.message);
    container.replaceChildren(failure(err, () => load(container, task, render)));
  }
}
const fieldErrors = (err, form) => {
  form.querySelectorAll('.field-err').forEach((n) => n.remove());
  (err.fields || []).forEach((f) => {
    const input = form.querySelector(`[name=${f.field}]`);
    if (input) input.insertAdjacentElement('afterend', h('div', { class: 'field-err' }, f.message));
  });
};

// ---------- Đăng nhập ----------
function showLogin(message) {
  $nav.classList.add('hidden'); $logout.classList.add('hidden');
  const msg = h('div', { class: 'field-err', role: 'alert' }, message || '');
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    try { await ApiClient.login(form.username.value, form.password.value); start(); } catch (err) { msg.textContent = err.message; }
  } },
  h('label', { for: 'username' }, 'Tên đăng nhập'), h('input', { id: 'username', name: 'username', autocomplete: 'username', required: true }),
  h('label', { for: 'password' }, 'Mật khẩu'), h('input', { id: 'password', name: 'password', type: 'password', autocomplete: 'current-password', required: true }),
  msg, h('button', { class: 'btn', type: 'submit' }, 'Đăng nhập'));
  $main.replaceChildren(panel(h('h2', {}, 'Đăng nhập nhân viên'), form));
}

// ---------- Màn hình 1: tra cứu / tạo khách hàng (US1, US2) ----------
function customerView() {
  const result = h('div');
  const phone = h('input', { id: 'phone', name: 'phone', inputmode: 'numeric', placeholder: '0901234567' });
  const search = () => load(result, () => ApiClient.lookupCustomer(phone.value.trim()).then(async (c) => ({ c, devices: await ApiClient.listDevices(c.id) })).catch((e) => {
    if (e.status === 404) return { notFound: true }; throw e; }), ({ c, devices, notFound }) => {
    if (notFound) return newCustomerForm(phone.value.trim(), result);
    return h('div', {}, h('p', {}, h('strong', {}, c.fullName), ` · ${c.phone}${c.address ? ' · ' + c.address : ''}`),
      devices.length ? h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Thiết bị', 'IMEI/Serial', 'Ngày mua'].map((t) => h('th', {}, t)))),
        h('tbody', {}, devices.map((d) => h('tr', {}, h('td', {}, d.modelName), h('td', {}, d.serialNo), h('td', {}, d.purchaseDate || 'Chưa có ngày mua'))))))
        : empty('Khách chưa có thiết bị nào', 'Thiết bị mới sẽ được thêm khi tiếp nhận.'));
  });
  return panel(h('h2', {}, 'Tra cứu khách hàng'),
    h('form', { onsubmit: (e) => { e.preventDefault(); search(); } }, h('label', { for: 'phone' }, 'Số điện thoại'),
      h('div', { class: 'row' }, phone, h('button', { class: 'btn', style: 'margin:0', type: 'submit' }, 'Tra cứu'))), h('div', { style: 'margin-top:16px' }, result));
}
function newCustomerForm(phone, container) {
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    try { const c = await ApiClient.createCustomer({ fullName: form.fullName.value, phone, address: form.address.value, email: form.email.value });
      container.replaceChildren(h('div', { class: 'panel success' }, `Đã tạo khách hàng ${c.fullName} (${c.phone}).`)); } catch (err) { fieldErrors(err, form); if (!err.fields) form.append(failure(err)); }
  } }, h('p', {}, h('strong', {}, 'Chưa có khách với số này.'), ' Nhập thông tin để tạo hồ sơ mới.'),
  h('label', {}, 'Họ tên'), h('input', { name: 'fullName' }), h('label', {}, 'Địa chỉ'), h('input', { name: 'address' }),
  h('label', {}, 'Email'), h('input', { name: 'email' }), h('button', { class: 'btn', type: 'submit' }, 'Tạo khách hàng'));
  return form;
}

// ---------- Màn hình 2: tạo phiếu bảo hành (US3–US5) ----------
function ticketView() {
  const out = h('div');
  const phone = h('input', { id: 'tphone', inputmode: 'numeric', placeholder: '0901234567' });
  const step = h('div', { style: 'margin-top:16px' });
  const find = () => load(step, async () => {
    const c = await ApiClient.lookupCustomer(phone.value.trim());
    const [devices, categories] = await Promise.all([ApiClient.listDevices(c.id), ApiClient.listCategories()]);
    return { c, devices, categories };
  }, ({ c, devices, categories }) => {
    if (!devices.length) return empty('Khách chưa có thiết bị', 'Cần có thiết bị trước khi tạo phiếu.');
    const form = h('form', { onsubmit: async (e) => {
      e.preventDefault();
      try {
        const t = await ApiClient.createTicket({ customerId: c.id, deviceId: Number(form.deviceId.value), categoryId: Number(form.categoryId.value),
          ...(form.priority.value && { priority: form.priority.value }), issueDesc: form.issueDesc.value });
        const [wl, wc] = WARRANTY[t.warrantyStatus];
        out.replaceChildren(h('div', { class: 'panel success' }, h('strong', {}, `Đã tạo phiếu ${t.ticketCode}`), h('div', {}, 'Bảo hành: ', h('span', { class: wc }, wl)),
          h('div', {}, `Mức ưu tiên: ${PRIO[t.priority]} · Hạn cam kết: ${fmt(t.dueDate)}`)));
        form.reset();
      } catch (err) { fieldErrors(err, form); if (!err.fields) out.replaceChildren(failure(err)); }
    } }, h('p', {}, h('strong', {}, c.fullName), ` · ${c.phone}`),
    h('label', {}, 'Thiết bị'), h('select', { name: 'deviceId' }, devices.map((d) => h('option', { value: d.id }, `${d.modelName} (${d.serialNo})`))),
    h('label', {}, 'Nhóm sự cố'), h('select', { name: 'categoryId' }, categories.map((k) => h('option', { value: k.id }, k.name))),
    h('label', {}, 'Mức ưu tiên'), h('select', { name: 'priority' }, h('option', { value: '' }, 'Theo nhóm sự cố'), Object.entries(PRIO).map(([v, t]) => h('option', { value: v }, t))),
    h('label', {}, 'Mô tả lỗi'), h('textarea', { name: 'issueDesc' }), h('div', {}), h('button', { class: 'btn', type: 'submit' }, 'Tạo phiếu'));
    return form;
  });
  return h('div', {}, panel(h('h2', {}, 'Tạo phiếu bảo hành'),
    h('form', { onsubmit: (e) => { e.preventDefault(); out.replaceChildren(); find(); } }, h('label', { for: 'tphone' }, 'Số điện thoại khách'),
      h('div', { class: 'row' }, phone, h('button', { class: 'btn', style: 'margin:0', type: 'submit' }, 'Tìm khách'))), step), out);
}

// ---------- Màn hình 3: danh sách phiếu (US7) ----------
function listView() {
  const body = h('div');
  const filter = h('select', { id: 'status', onchange: () => refresh() }, h('option', { value: '' }, 'Tất cả trạng thái'),
    Object.entries(LABEL).map(([v, t]) => h('option', { value: v }, t)));
  const refresh = () => load(body, () => ApiClient.listTickets(filter.value), (tickets) => {
    if (!tickets.length) return filter.value ? empty('Không có phiếu khớp bộ lọc', `Không có phiếu nào ở trạng thái "${LABEL[filter.value]}". Chọn trạng thái khác.`)
      : empty('Chưa có phiếu nào', 'Phiếu mới tạo ở màn hình "Tạo phiếu" sẽ hiện ở đây.');
    const now = Date.now();
    const late = tickets.filter((t) => !['DA_DONG', 'DA_HUY', 'HOAN_TAT'].includes(t.status) && new Date(t.dueDate) < now).length;
    return h('div', {}, h('p', { class: 'sum' }, `${late} phiếu quá hạn trên tổng ${tickets.length} phiếu đang hiển thị`),
      h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Mã phiếu', 'Trạng thái', 'Ưu tiên', 'Hạn cam kết', 'Bảo hành', 'Chuyển trạng thái'].map((t) => h('th', {}, t)))),
        h('tbody', {}, tickets.map((t) => {
          const over = !['DA_DONG', 'DA_HUY', 'HOAN_TAT'].includes(t.status) && new Date(t.dueDate) < now;
          return h('tr', {}, h('td', {}, t.ticketCode), h('td', {}, h('span', { class: 'badge' }, LABEL[t.status])), h('td', {}, PRIO[t.priority]),
            h('td', { class: over ? 'late' : '' }, fmt(t.dueDate), over ? ' (quá hạn)' : ''), h('td', {}, t.isWarranty ? 'Còn bảo hành' : 'Ngoài bảo hành hoặc chưa xác minh'),
            h('td', {}, NEXT[t.status].map((s) => h('button', { class: 'btn ghost', style: 'margin:0 4px 4px 0', onclick: async (e) => {
              e.target.disabled = true;
              try { await ApiClient.changeStatus(t.id, s); refresh(); } catch (err) { alert(err.message); e.target.disabled = false; }
            } }, LABEL[s]))));
        })))));
  });
  refresh();
  return panel(h('h2', {}, 'Danh sách phiếu (sắp theo hạn cam kết)'), h('label', { for: 'status' }, 'Lọc theo trạng thái'), filter, h('div', { style: 'margin-top:16px' }, body));
}

// ---------- Điều hướng ----------
const VIEWS = { customer: customerView, ticket: ticketView, list: listView };
function go(name) {
  $nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === name)));
  $main.replaceChildren(VIEWS[name]());
}
$nav.addEventListener('click', (e) => e.target.dataset.view && go(e.target.dataset.view));
$logout.addEventListener('click', () => { ApiClient.logout(); showLogin(); });
function start() { $nav.classList.remove('hidden'); $logout.classList.remove('hidden'); go('customer'); }
ApiClient.isLoggedIn() ? start() : showLogin();
