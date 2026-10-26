// Làm sạch và ghép dữ liệu dataset. Hàm thuần: không đụng DB, kiểm thử được.
const normalizePhone = (raw) => {
  if (typeof raw !== 'string') return null;
  let d = raw.replace(/\D/g, ''); // bỏ dấu cách, dấu chấm, dấu +
  if (d.startsWith('84') && d.length === 11) d = `0${d.slice(2)}`;
  return /^0\d{9}$/.test(d) ? d : null;
};

const cleanName = (raw) => {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const letters = s.replace(/[^\p{L}]/gu, '');
  if (letters !== letters.toLowerCase() && letters !== letters.toUpperCase()) return s; // đã viết hoa đúng kiểu
  return s.toLocaleLowerCase('vi').replace(/(^|\s)(\p{L})/gu, (m, sp, c) => sp + c.toLocaleUpperCase('vi'));
};

function prepare({ customersRaw, products, categories, tickets, logs }) {
  const rejects = []; const reject = (table, id, reason) => rejects.push({ table, source_id: id, reason });
  const stats = { customersRead: customersRaw.length, customersMerged: 0 };

  // 1. Khách hàng: chuẩn hóa SĐT, gộp bản trùng theo SĐT (giữ hồ sơ đầu tiên, bổ sung email/địa chỉ còn thiếu)
  const byPhone = new Map(); const recordPhone = new Map();
  for (const r of customersRaw) {
    const phone = normalizePhone(r.so_dien_thoai);
    if (!phone) { reject('customers_raw', r.record_id, 'Thiếu hoặc sai định dạng số điện thoại'); continue; }
    const name = cleanName(r.ho_ten);
    if (!name) { reject('customers_raw', r.record_id, 'Thiếu họ tên'); continue; }
    recordPhone.set(r.record_id, phone);
    const cur = byPhone.get(phone);
    if (!cur) {
      byPhone.set(phone, { phone, fullName: name.slice(0, 120), address: (r.dia_chi || '').slice(0, 255) || null,
        email: (r.email || '').slice(0, 120) || null, createdAt: r.ngay_tao || null });
    } else { stats.customersMerged++; cur.address = cur.address || (r.dia_chi || '').slice(0, 255) || null; cur.email = cur.email || (r.email || '').slice(0, 120) || null; }
  }

  // 2. Phiếu và thiết bị
  const prodById = new Map(products.map((p) => [p.product_id, p]));
  const catById = new Map(categories.map((c) => [c.category_id, c]));
  const devices = new Map(); const out = []; const codeByDatasetId = new Map();
  for (const t of tickets) {
    const phone = recordPhone.get(t.customer_id); const prod = prodById.get(t.product_id); const cat = catById.get(t.category_id);
    const desc = (t.issue_desc || '').trim();
    const why = !phone ? 'Khách hàng không có số điện thoại hợp lệ nên không gắn được'
      : !prod ? 'Không tìm thấy sản phẩm' : !cat ? 'Không tìm thấy nhóm sự cố'
      : (desc.length < 10 || desc.length > 2000) ? 'Mô tả lỗi ngoài khoảng 10–2000 ký tự'
      : (t.closed_at && t.closed_at < t.received_at) ? 'Thời điểm đóng sớm hơn thời điểm tiếp nhận'
      : (t.due_date < t.received_at) ? 'Hạn cam kết sớm hơn thời điểm tiếp nhận' : null;
    if (why) { reject('tickets_history', t.ticket_id, why); continue; }
    if (!devices.has(t.serial_no)) {
      devices.set(t.serial_no, { phone, serial: t.serial_no, model: prod.product_name.slice(0, 120),
        warrantyMonths: Number(prod.warranty_months) || 12, note: 'Nhập từ tickets_history.csv, không có ngày mua' });
    }
    codeByDatasetId.set(t.ticket_id, t.ticket_code);
    out.push({ code: t.ticket_code, phone, serial: t.serial_no, categoryName: cat.category_name, priority: t.priority, desc,
      status: t.status, receivedAt: t.received_at, dueDate: t.due_date, closedAt: t.closed_at || null, isWarranty: t.is_warranty === 'true' });
  }

  // 3. Lịch sử trạng thái, gom theo phiếu (mỗi phiếu nằm trọn trong một lô khi nạp)
  const logsByTicket = new Map();
  for (const l of logs) {
    const code = codeByDatasetId.get(l.ticket_id);
    if (!code) { continue; } // phiếu đã bị loại thì bỏ log theo
    if (!logsByTicket.has(code)) logsByTicket.set(code, []);
    logsByTicket.get(code).push({ code, from: l.from_status || null, to: l.to_status, at: l.changed_at, by: String(l.changed_by || 'system') });
  }
  const maxTicketNo = Math.max(0, ...out.map((t) => Number((t.code.match(/^BH-(\d+)\//) || [])[1]) || 0));
  return { customers: [...byPhone.values()], devices: [...devices.values()], tickets: out, logsByTicket, rejects, stats, maxTicketNo,
    categories: categories.map((c) => ({ name: c.category_name, defaultPriority: c.default_priority, isActive: c.is_active === 'true' })) };
}
module.exports = { prepare, normalizePhone, cleanName };
