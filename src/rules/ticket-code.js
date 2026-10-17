// Mã phiếu dạng BH-000231/2026
const formatTicketCode = (id, year) => `BH-${String(id).padStart(6, '0')}/${year}`;
module.exports = { formatTicketCode };
