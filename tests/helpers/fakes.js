// Đối tượng giả (in-memory) thay cho repositories: kiểm thử không cần DB, không phụ thuộc máy nào.
const FIXED_NOW = new Date('2026-10-16T03:00:00Z'); // thứ Sáu 16/10/2026, 10:00 giờ Việt Nam

function makeTicketDeps(overrides = {}) {
  const calls = { inserted: [], statusUpdates: [] };
  const tickets = new Map();

  const deps = {
    clock: { now: () => FIXED_NOW },
    customerRepo: {
      findById: async (id) => (id === 1 ? { id: 1, fullName: 'Nguyễn Văn B', phone: '0937482915', isActive: true } : null),
    },
    deviceRepo: {
      findById: async (id) => (id === 10
        ? { id: 10, customerId: 1, modelName: 'iPhone 13', purchaseDate: '2025-12-15', warrantyMonths: 12 }
        : null),
    },
    categoryRepo: {
      findById: async (id) => (id === 2 ? { id: 2, name: 'PIN', defaultPriority: 'TRUNG_BINH', isActive: true } : null),
    },
    slaRepo: {
      findByPriority: async (p) => ({ CAO: 24, TRUNG_BINH: 72, THAP: 120 }[p] ? { priority: p, hours: { CAO: 24, TRUNG_BINH: 72, THAP: 120 }[p] } : null),
    },
    ticketRepo: {
      reserveId: async () => 231,
      insertWithLog: async (t, actor) => { calls.inserted.push({ t, actor }); tickets.set(t.id, t); return { ...t }; },
      findById: async (id) => tickets.get(id) || null,
      updateStatus: async (id, from, to, actor, closedAt) => {
        calls.statusUpdates.push({ id, from, to, actor, closedAt });
        const t = { ...tickets.get(id), status: to, closedAt };
        tickets.set(id, t);
        return t;
      },
      updateDescription: async (id, desc) => ({ ...tickets.get(id), issueDesc: desc }),
      findByCode: async (code) => [...tickets.values()].find((t) => t.ticketCode === code) || null,
      listHistory: async () => [{ fromStatus: null, toStatus: 'MOI', changedAt: FIXED_NOW, changedBy: 'system' }],
    },
    ...overrides,
  };
  return { deps, calls, tickets };
}

function makeCustomerRepo() {
  const rows = [];
  const calls = { setActive: [] };
  return {
    rows, calls,
    repo: {
      findById: async (id) => rows.find((r) => r.id === id) || null,
      findByPhone: async (phone) => rows.find((r) => r.phone === phone) || null,
      insert: async (d) => { const r = { id: rows.length + 1, isActive: true, ...d }; rows.push(r); return r; },
      update: async (id, d) => Object.assign(rows.find((r) => r.id === id), d),
      setActive: async (id, v) => { calls.setActive.push([id, v]); return Object.assign(rows.find((r) => r.id === id), { isActive: v }); },
      list: async () => rows,
    },
  };
}

module.exports = { FIXED_NOW, makeTicketDeps, makeCustomerRepo };
