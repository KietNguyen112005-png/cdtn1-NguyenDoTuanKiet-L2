// BR1: điều kiện bảo hành. Hàm thuần, không đụng DB hay HTTP.
// Ngày dùng chuỗi 'YYYY-MM-DD' để tránh lệch múi giờ.

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m: m - 1, d };
}

// Cộng tháng, nếu ngày không tồn tại thì lùi về ngày cuối tháng (31/08 + 6 tháng = 28/02).
function addMonths(dateStr, months) {
  const { y, m, d } = parseDate(dateStr);
  const target = m + months;
  const lastDay = new Date(Date.UTC(y, target + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, target, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

// Ngày cuối cùng còn bảo hành = ngày mua + warrantyMonths tháng (tính cả ngày đó).
function evaluateWarranty({ purchaseDate, warrantyMonths }, receivedDate) {
  if (!purchaseDate) {
    return { status: 'CHUA_XAC_MINH', isWarranty: false, expiresOn: null };
  }
  const expiresOn = addMonths(purchaseDate, warrantyMonths);
  const isWarranty = receivedDate <= expiresOn; // so sánh chuỗi ISO chính là so sánh ngày
  return { status: isWarranty ? 'CON_BAO_HANH' : 'HET_BAO_HANH', isWarranty, expiresOn };
}

module.exports = { evaluateWarranty, addMonths };
