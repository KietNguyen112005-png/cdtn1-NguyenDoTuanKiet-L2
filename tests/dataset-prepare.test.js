const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv } = require('../scripts/lib/csv');
const { prepare, normalizePhone, cleanName } = require('../scripts/lib/dataset-prepare');

test('[Luồng đúng] bốn dạng số điện thoại trong dataset đều về dạng 0xxxxxxxxx', () => {
  for (const raw of ['0763247885', '0760.833.592', '84763247885', '+84 763 247 885']) {
    assert.match(normalizePhone(raw), /^0\d{9}$/, raw);
  }
  assert.equal(normalizePhone('+84 763 247 885'), '0763247885');
});

test('[Giá trị biên] thiếu một chữ số hoặc thừa một chữ số thì bị loại', () => {
  assert.equal(normalizePhone('076324788'), null); // 9 chữ số
  assert.equal(normalizePhone('07632478851'), null); // 11 chữ số, không phải đầu 84
  assert.equal(normalizePhone('0763247885'), '0763247885'); // đúng 10 chữ số
});

test('[Dữ liệu sai] giá trị rỗng, chữ hoặc không phải chuỗi đều trả null, không ném lỗi', () => {
  for (const bad of [undefined, null, '', 'abc', 123]) assert.equal(normalizePhone(bad), null);
});

test('[Luồng đúng] đọc CSV có dấu ngoặc kép chứa dấu phẩy và xuống dòng kiểu Windows', () => {
  const rows = parseCsv('a,b\r\n1,"x, y"\r\n2,"nói ""vậy"""\r\n');
  assert.deepEqual(rows, [{ a: '1', b: 'x, y' }, { a: '2', b: 'nói "vậy"' }]);
});

test('[Luồng đúng] chuẩn hóa tên viết hoa toàn bộ, giữ nguyên tên đã đúng kiểu', () => {
  assert.equal(cleanName('  NGUYEN   VAN A '), 'Nguyen Van A');
  assert.equal(cleanName('Đỗ Đức Tâm'), 'Đỗ Đức Tâm');
});

const src = () => ({
  customersRaw: [
    { record_id: '1', ho_ten: 'NGUYEN VAN A', so_dien_thoai: '0763247885', email: '', dia_chi: '', ngay_tao: '2024-01-01' },
    { record_id: '2', ho_ten: 'Nguyễn Văn A', so_dien_thoai: '+84 763 247 885', email: 'a@x.com', dia_chi: 'HN', ngay_tao: '2024-01-02' },
    { record_id: '3', ho_ten: 'Lê B', so_dien_thoai: '', email: '', dia_chi: '', ngay_tao: '2024-01-03' },
  ],
  products: [{ product_id: '9', product_name: 'Máy X', warranty_months: '12' }],
  categories: [{ category_id: '1', category_name: 'PIN', default_priority: 'TRUNG_BINH', is_active: 'true' }],
  tickets: [
    { ticket_id: '1', ticket_code: 'BH-000001/2025', customer_id: '2', serial_no: 'SN1', product_id: '9', issue_desc: 'pin sụt nhanh máy tự tắt', category_id: '1',
      priority: 'TRUNG_BINH', status: 'MOI', received_at: '2025-01-01 10:00', due_date: '2025-01-04 10:00', closed_at: '', is_warranty: 'true' },
    { ticket_id: '2', ticket_code: 'BH-000002/2025', customer_id: '3', serial_no: 'SN2', product_id: '9', issue_desc: 'pin sụt nhanh máy tự tắt', category_id: '1',
      priority: 'THAP', status: 'MOI', received_at: '2025-01-01 10:00', due_date: '2025-01-06 10:00', closed_at: '', is_warranty: 'false' },
  ],
  logs: [
    { ticket_id: '1', from_status: '', to_status: 'MOI', changed_at: '2025-01-01 10:00', changed_by: '3' },
    { ticket_id: '2', from_status: '', to_status: 'MOI', changed_at: '2025-01-01 10:00', changed_by: '3' },
  ],
});

test('[Luồng đúng] gộp hồ sơ trùng theo số điện thoại và phiếu trỏ vào bản trùng vẫn gắn đúng khách', () => {
  const p = prepare(src());
  assert.equal(p.customers.length, 1);
  assert.deepEqual([p.customers[0].fullName, p.customers[0].email, p.customers[0].address], ['Nguyen Van A', 'a@x.com', 'HN']);
  assert.equal(p.stats.customersMerged, 1);
  assert.equal(p.tickets.length, 1);
  assert.equal(p.tickets[0].phone, '0763247885'); // customer_id 2 là bản trùng của khách 1
  assert.equal(p.logsByTicket.get('BH-000001/2025').length, 1);
});

test('[Dữ liệu sai] khách không có số điện thoại và phiếu của họ bị loại kèm lý do, không sập', () => {
  const p = prepare(src());
  const reasons = p.rejects.map((r) => `${r.table}:${r.source_id}`);
  assert.deepEqual(reasons.sort(), ['customers_raw:3', 'tickets_history:2']);
  assert.ok(p.rejects.every((r) => r.reason.length > 10));
  assert.equal(p.logsByTicket.has('BH-000002/2025'), false); // log của phiếu bị loại cũng bỏ theo
});
