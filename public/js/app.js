const $main = document.getElementById('main');
const $nav = document.getElementById('nav');
const LABEL = { MOI: 'Mới', DA_PHAN_CONG: 'Đã phân công', DANG_XU_LY: 'Đang xử lý', CHO_LINH_KIEN: 'Chờ linh kiện', HOAN_TAT: 'Hoàn tất', DA_DONG: 'Đã đóng', DA_HUY: 'Đã hủy' };
const CATEGORY = { MAN_HINH: 'Màn hình', PIN: 'Pin', SAC: 'Sạc', PHAN_MEM: 'Phần mềm', NUOC_VAO: 'Nước vào', KHAC: 'Khác' };
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
    container.replaceChildren(failure(err, () => load(container, task, render)));
  }
}
const fieldErrors = (err, form) => {
  form.querySelectorAll('.field-err').forEach((n) => n.remove());
  let matched = 0;
  (err.fields || []).forEach((f) => {
    const input = form.querySelector(`[name=${f.field}]`);
    if (input) { input.insertAdjacentElement('afterend', h('div', { class: 'field-err' }, f.message)); matched++; }
  });
  return matched; // 0 nghĩa là không gắn được vào ô nào, người gọi tự hiện lỗi chung
};

// ---------- Màn hình 1: tạo phiếu bảo hành (US1–US5) ----------
// Nhập số điện thoại -> Tìm khách. Khách cũ: hiện tên và thiết bị. Khách mới: hiện ô nhập họ tên và thiết bị mới.
function ticketView() {
  const out = h('div');
  const phone = h('input', { id: 'tphone', inputmode: 'numeric', placeholder: 'Nhập số điện thoại 10 chữ số' });
  const step = h('div', { style: 'margin-top:16px' });
  const find = () => load(step, async () => {
    const p = phone.value.trim();
    const categories = await ApiClient.listCategories();
    try {
      const c = await ApiClient.lookupCustomer(p);
      return { c, phone: p, devices: await ApiClient.listDevices(c.id), categories };
    } catch (e) { if (e.status === 404) return { c: null, phone: p, devices: [], categories }; throw e; }
  }, (data) => ticketForm(data, out, step));
  return h('div', {}, panel(h('h2', {}, 'Tạo phiếu bảo hành'),
    h('form', { onsubmit: (e) => { e.preventDefault(); out.replaceChildren(); find(); } }, h('label', { for: 'tphone' }, 'Số điện thoại khách'),
      h('div', { class: 'row' }, phone, h('button', { class: 'btn', style: 'margin:0', type: 'submit' }, 'Tìm khách'))), step), out);
}

function ticketForm({ c, phone, devices, categories }, out, step) {
  let customer = c; let createdDevice = null; // giữ lại nếu lần gửi trước đã tạo được, để bấm lại không tạo trùng
  const hasDevices = devices.length > 0;
  const sel = h('select', { name: 'deviceId', onchange: () => toggle() }, devices.map((d) => h('option', { value: d.id }, `${d.modelName} (${d.serialNo})`)),
    h('option', { value: 'new' }, 'Thiết bị khác (nhập mới)'));
  const newDev = h('div', {}, h('label', {}, 'Model thiết bị'), h('input', { name: 'modelName' }),
    h('label', {}, 'IMEI/Serial'), h('input', { name: 'serialNo' }),
    h('label', {}, 'Ngày mua (bỏ trống nếu không có hóa đơn)'), h('input', { name: 'purchaseDate', type: 'date' }),
    h('label', {}, 'Số tháng bảo hành'), h('input', { name: 'warrantyMonths', type: 'number', min: '1', value: '12' }),
    h('label', {}, 'Ghi chú nguồn gốc mua hàng (bắt buộc nếu không có ngày mua)'), h('input', { name: 'purchaseNote' }));
  const useNew = () => !hasDevices || sel.value === 'new';
  const toggle = () => newDev.classList.toggle('hidden', !useNew());
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    try {
      if (!customer) customer = await ApiClient.createCustomer({ fullName: form.fullName.value, phone });
      let deviceId = Number(sel.value);
      if (useNew()) {
        createdDevice = createdDevice || await ApiClient.createDevice({ customerId: customer.id, modelName: form.modelName.value, serialNo: form.serialNo.value,
          purchaseDate: form.purchaseDate.value || undefined, warrantyMonths: Number(form.warrantyMonths.value) || undefined, purchaseNote: form.purchaseNote.value || undefined });
        deviceId = createdDevice.id;
      }
      const t = await ApiClient.createTicket({ customerId: customer.id, deviceId, categoryId: Number(form.categoryId.value),
        ...(form.priority.value && { priority: form.priority.value }), issueDesc: form.issueDesc.value });
      const [wl, wc] = WARRANTY[t.warrantyStatus];
      step.replaceChildren();
      out.replaceChildren(h('div', { class: 'panel success' }, h('strong', {}, `Đã tạo phiếu ${t.ticketCode}`), h('div', {}, 'Bảo hành: ', h('span', { class: wc }, wl)),
        h('div', {}, `Mức ưu tiên: ${PRIO[t.priority]} · Hạn cam kết: ${fmt(t.dueDate)}`)));
    } catch (err) {
        if (!fieldErrors(err, form)) out.replaceChildren(failure(err));
    }
  } },
  customer ? h('p', {}, h('strong', {}, customer.fullName), ` · ${customer.phone}`)
    : h('div', {}, h('p', {}, h('strong', {}, 'Chưa có khách với số này.'), ' Nhập họ tên để tạo hồ sơ mới.'), h('label', {}, 'Họ tên khách hàng'), h('input', { name: 'fullName' })),
  hasDevices && h('label', {}, 'Thiết bị'), hasDevices && sel, newDev,
  h('label', {}, 'Nhóm sự cố'), h('select', { name: 'categoryId' }, categories.map((k) => h('option', { value: k.id }, CATEGORY[k.name] || k.name))),
  h('label', {}, 'Mức ưu tiên'), h('select', { name: 'priority' }, h('option', { value: '' }, 'Theo nhóm sự cố'), Object.entries(PRIO).map(([v, t]) => h('option', { value: v }, t))),
  h('label', {}, 'Mô tả lỗi'), h('textarea', { name: 'issueDesc' }), h('div', {}), h('button', { class: 'btn', type: 'submit' }, 'Tạo phiếu'));
  toggle();
  return form;
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
      h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Mã phiếu', 'Khách hàng', 'Số điện thoại', 'Trạng thái', 'Ưu tiên', 'Hạn cam kết', 'Bảo hành', 'Chuyển trạng thái'].map((t) => h('th', {}, t)))),
        h('tbody', {}, tickets.map((t) => {
          const over = !['DA_DONG', 'DA_HUY', 'HOAN_TAT'].includes(t.status) && new Date(t.dueDate) < now;
          return h('tr', {}, h('td', {}, h('button', { class: 'linklike', title: 'Xem chi tiết phiếu', onclick: () => go('detail', t.ticketCode) }, t.ticketCode)), h('td', {}, t.customerName), h('td', {}, t.customerPhone), h('td', {}, h('span', { class: 'badge' }, LABEL[t.status])), h('td', {}, PRIO[t.priority]),
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

// ---------- Màn hình 3: chi tiết phiếu và lịch sử trạng thái (BR5) ----------
const span = (ms) => {
  const m = Math.round(Math.abs(ms) / 60000); const d = Math.floor(m / 1440); const hr = Math.floor((m % 1440) / 60);
  return d ? `${d} ngày ${hr} giờ` : hr ? `${hr} giờ ${m % 60} phút` : `${m} phút`;
};

function detailView(code) {
  const body = h('div');
  const input = h('input', { id: 'tcode', placeholder: 'Ví dụ: BH-000001/2026', value: code || '' });
  const search = () => load(body, () => ApiClient.getTicketByCode(input.value.trim()).catch((e) => {
    if (e.status === 404) return { notFound: true }; throw e; }), (d) => (d.notFound
    ? empty('Không tìm thấy phiếu', 'Kiểm tra lại mã phiếu, hoặc bấm vào mã phiếu ở màn hình Danh sách phiếu.') : ticketDetail(d)));
  if (code) search(); else body.replaceChildren(empty('Nhập mã phiếu để xem chi tiết', 'Hoặc bấm vào mã phiếu ở màn hình Danh sách phiếu.'));
  return panel(h('h2', {}, 'Chi tiết phiếu'),
    h('form', { onsubmit: (e) => { e.preventDefault(); search(); } }, h('label', { for: 'tcode' }, 'Mã phiếu'),
      h('div', { class: 'row' }, input, h('button', { class: 'btn', style: 'margin:0', type: 'submit' }, 'Tra cứu'))),
    h('div', { style: 'margin-top:16px' }, body));
}

function ticketDetail({ ticket: t, customer, device, category, history }) {
  const now = Date.now(); const due = new Date(t.dueDate).getTime();
  const terminal = ['DA_DONG', 'DA_HUY'].includes(t.status);
  // Mốc so sánh cho hạn cam kết: đã đóng thì so với lúc đóng, chưa đóng thì so với hiện tại.
  let note; let noteClass = '';
  if (terminal && t.closedAt) {
    const diff = new Date(t.closedAt).getTime() - due;
    note = diff <= 0 ? `Đóng sớm hơn hạn ${span(diff)}` : `Đóng trễ hơn hạn ${span(diff)}`; noteClass = diff <= 0 ? 'good' : 'late';
  } else if (!terminal) {
    note = due >= now ? `Còn ${span(due - now)} đến hạn` : `Quá hạn ${span(now - due)}`; noteClass = due >= now ? 'good' : 'late';
  }
  const rows = history.map((l, i) => {
    const start = new Date(l.changedAt).getTime(); const next = history[i + 1];
    const end = next ? new Date(next.changedAt).getTime() : (terminal ? null : now);
    return h('tr', {}, h('td', {}, fmt(l.changedAt)),
      h('td', {}, l.fromStatus ? `${LABEL[l.fromStatus]} → ${LABEL[l.toStatus]}` : `Tạo phiếu (${LABEL[l.toStatus]})`),
      h('td', {}, l.changedBy), h('td', {}, end === null ? '—' : span(end - start)));
  });
  const row = (k, v) => [h('dt', {}, k), h('dd', {}, v)];
  return h('div', {}, h('h3', {}, `${t.ticketCode} · ${LABEL[t.status]}`),
    h('dl', { class: 'info' },
      row('Khách hàng', customer ? `${customer.fullName} · ${customer.phone}` : 'Không rõ'),
      row('Thiết bị', device ? `${device.modelName} (${device.serialNo})` : 'Không rõ'),
      row('Nhóm sự cố', category ? (CATEGORY[category.name] || category.name) : 'Không rõ'),
      row('Mức ưu tiên', PRIO[t.priority]),
      row('Bảo hành', t.isWarranty ? 'Còn bảo hành' : 'Ngoài bảo hành hoặc chưa xác minh'),
      row('Tiếp nhận lúc', fmt(t.receivedAt)),
      row('Hạn cam kết', [fmt(t.dueDate), note && h('span', { class: noteClass }, ` · ${note}`)]),
      row('Mô tả lỗi', t.issueDesc)),
    h('h3', {}, 'Lịch sử trạng thái'),
    history.length ? h('div', { class: 'tbl' }, h('table', {}, h('thead', {}, h('tr', {}, ...['Thời điểm', 'Thay đổi', 'Người thực hiện', 'Ở trạng thái này'].map((x) => h('th', {}, x)))), h('tbody', {}, rows)))
      : empty('Chưa có lịch sử trạng thái', 'Phiếu này chưa ghi nhận lần chuyển trạng thái nào.'));
}

// ---------- Điều hướng ----------
const VIEWS = { ticket: ticketView, list: listView, detail: detailView };
function go(name, arg) {
  $nav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === name)));
  $main.replaceChildren(VIEWS[name](arg));
}
$nav.addEventListener('click', (e) => e.target.dataset.view && go(e.target.dataset.view));
go('ticket');
