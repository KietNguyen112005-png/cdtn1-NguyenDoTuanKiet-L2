// Nạp bộ dữ liệu Mekong Mobile (CSV) vào PostgreSQL. TÙY CHỌN, không thuộc `npm run setup`.
//   npm run import:dataset -- data/raw            nạp thật (cần đã chạy npm run setup)
//   npm run import:dataset -- data/raw --dry-run  chỉ làm sạch và đếm, không cần cơ sở dữ liệu
// Chạy lại nhiều lần không nhân đôi dữ liệu (ON CONFLICT DO NOTHING; log chỉ nạp cho phiếu chưa có log).
const fs = require('fs');
const path = require('path');
const { parseCsv, toCsv } = require('./lib/csv');
const { prepare } = require('./lib/dataset-prepare');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'data', 'raw'));
const read = (f) => parseCsv(fs.readFileSync(path.join(dir, f), 'utf8'));
const chunks = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, (i + 1) * n));
const ts = (s) => (s ? `${s}+07` : null); // dữ liệu không có múi giờ, coi là giờ Việt Nam

async function load(p) {
  const db = require('../src/db');
  const report = {};
  await db.withTransaction(async (client) => {
    const sla = await client.query('SELECT count(*)::int AS n FROM sla_config');
    if (!sla.rows[0].n) throw new Error('Chưa có cấu hình SLA. Hãy chạy "npm run setup" trước.');

    for (const c of p.categories) {
      await client.query(`INSERT INTO issue_category (category_name, default_priority, is_active) VALUES ($1,$2,$3)
        ON CONFLICT (category_name) DO UPDATE SET default_priority = EXCLUDED.default_priority, is_active = EXCLUDED.is_active`,
      [c.name, c.defaultPriority, c.isActive]);
    }
    const catId = new Map((await client.query('SELECT category_id, category_name FROM issue_category')).rows.map((r) => [r.category_name, r.category_id]));

    report.customers = 0;
    for (const b of chunks(p.customers, 5000)) {
      const r = await client.query(`INSERT INTO customer (full_name, phone, address, email, created_at)
        SELECT n, p, a, e, COALESCE(c::timestamptz, now()) FROM unnest($1::text[],$2::text[],$3::text[],$4::text[],$5::text[]) AS v(n,p,a,e,c)
        ON CONFLICT (phone) DO NOTHING`,
      [b.map((x) => x.fullName), b.map((x) => x.phone), b.map((x) => x.address), b.map((x) => x.email), b.map((x) => x.createdAt)]);
      report.customers += r.rowCount;
    }
    const custId = new Map((await client.query('SELECT customer_id, phone FROM customer')).rows.map((r) => [r.phone, Number(r.customer_id)]));

    report.devices = 0;
    for (const b of chunks(p.devices, 5000)) {
      const r = await client.query(`INSERT INTO device (customer_id, model_name, serial_no, purchase_date, warranty_months, purchase_note)
        SELECT cid, m, s, NULL::date, w, note FROM unnest($1::bigint[],$2::text[],$3::text[],$4::int[],$5::text[]) AS v(cid,m,s,w,note)
        ON CONFLICT (serial_no) DO NOTHING`,
      [b.map((x) => custId.get(x.phone)), b.map((x) => x.model), b.map((x) => x.serial), b.map((x) => x.warrantyMonths), b.map((x) => x.note)]);
      report.devices += r.rowCount;
    }
    const devId = new Map();
    for (const b of chunks(p.devices.map((d) => d.serial), 5000)) {
      (await client.query('SELECT device_id, serial_no FROM device WHERE serial_no = ANY($1)', [b])).rows.forEach((r) => devId.set(r.serial_no, Number(r.device_id)));
    }

    report.tickets = 0;
    for (const b of chunks(p.tickets, 2000)) {
      const r = await client.query(`INSERT INTO ticket (ticket_code, customer_id, device_id, category_id, priority, issue_desc, status, received_at, due_date, is_warranty, closed_at)
        SELECT code, cid, did, cat, pri, d, st, ra::timestamptz, dd::timestamptz, w, ca::timestamptz
        FROM unnest($1::text[],$2::bigint[],$3::bigint[],$4::int[],$5::text[],$6::text[],$7::text[],$8::text[],$9::text[],$10::boolean[],$11::text[]) AS v(code,cid,did,cat,pri,d,st,ra,dd,w,ca)
        ON CONFLICT (ticket_code) DO NOTHING`,
      [b.map((x) => x.code), b.map((x) => custId.get(x.phone)), b.map((x) => devId.get(x.serial)), b.map((x) => catId.get(x.categoryName)),
        b.map((x) => x.priority), b.map((x) => x.desc), b.map((x) => x.status), b.map((x) => ts(x.receivedAt)), b.map((x) => ts(x.dueDate)),
        b.map((x) => x.isWarranty), b.map((x) => ts(x.closedAt))]);
      report.tickets += r.rowCount;
    }
    const tid = new Map();
    for (const b of chunks(p.tickets.map((t) => t.code), 5000)) {
      (await client.query('SELECT ticket_id, ticket_code FROM ticket WHERE ticket_code = ANY($1)', [b])).rows.forEach((r) => tid.set(r.ticket_code, Number(r.ticket_id)));
    }

    // Log: gom nguyên từng phiếu vào một lô; chỉ nạp cho phiếu chưa có dòng log nào.
    report.logs = 0;
    const groups = [...p.logsByTicket.values()]; let batch = [];
    const flush = async () => {
      if (!batch.length) return;
      const r = await client.query(`INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by)
        SELECT v.tid, v.f, v.t, v.changed::timestamptz, v.who FROM unnest($1::bigint[],$2::text[],$3::text[],$4::text[],$5::text[]) AS v(tid,f,t,changed,who)
        WHERE NOT EXISTS (SELECT 1 FROM ticket_status_log l WHERE l.ticket_id = v.tid)`,
      [batch.map((x) => tid.get(x.code)), batch.map((x) => x.from), batch.map((x) => x.to), batch.map((x) => ts(x.at)), batch.map((x) => x.by)]);
      report.logs += r.rowCount; batch = [];
    };
    for (const g of groups) { batch.push(...g); if (batch.length >= 5000) await flush(); }
    await flush();

    // Mã phiếu mới tạo từ giao diện phải lớn hơn mọi số mã trong dataset để không trùng.
    await client.query(`SELECT setval(pg_get_serial_sequence('ticket','ticket_id'), GREATEST($1::bigint, (SELECT COALESCE(MAX(ticket_id),0) FROM ticket), 1))`, [p.maxTicketNo]);
  });
  await db.pool.end();
  return report;
}

async function main() {
  const p = prepare({
    customersRaw: read('customers_raw.csv'), products: read('products.csv'), categories: read('issue_categories.csv'),
    tickets: read('tickets_history.csv'), logs: read('ticket_status_log.csv'),
  });
  const rejDir = path.join(__dirname, '..', 'data', 'reject');
  if (p.rejects.length) {
    fs.mkdirSync(rejDir, { recursive: true });
    fs.writeFileSync(path.join(rejDir, 'rejected.csv'), toCsv(p.rejects, ['table', 'source_id', 'reason']));
  }
  const reasons = {}; p.rejects.forEach((r) => { const k = `${r.table}: ${r.reason}`; reasons[k] = (reasons[k] || 0) + 1; });
  console.log(`Khách hàng thô: ${p.stats.customersRead} dòng -> ${p.customers.length} khách duy nhất (gộp ${p.stats.customersMerged} bản trùng)`);
  console.log(`Thiết bị: ${p.devices.length} · Phiếu hợp lệ: ${p.tickets.length} · Phiếu có log: ${p.logsByTicket.size}`);
  console.log(`Dòng bị loại: ${p.rejects.length}${p.rejects.length ? ` (chi tiết: data/reject/rejected.csv)` : ''}`);
  Object.entries(reasons).forEach(([k, n]) => console.log(`  - ${n} × ${k}`));
  if (dryRun) { console.log('Chế độ chạy thử (--dry-run): chưa ghi gì vào cơ sở dữ liệu.'); return; }
  const r = await load(p);
  console.log(`Đã nạp mới: ${r.customers} khách, ${r.devices} thiết bị, ${r.tickets} phiếu, ${r.logs} dòng log (phần đã có sẵn được bỏ qua).`);
}
main().catch((err) => {
  const inner = (err.errors || []).find((e) => e.code) || err;
  console.error('Nạp dataset thất bại:', err.message || inner.message || inner.code || err);
  process.exitCode = 1;
});
