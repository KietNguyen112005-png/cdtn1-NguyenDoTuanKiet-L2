// Nơi DUY NHẤT đổi lỗi nghiệp vụ thành mã HTTP. Không bao giờ trả lỗi thô của thư viện.
const STATUS_BY_CODE = { VALIDATION: 400, NOT_FOUND: 404, CONFLICT: 409, BUSINESS_RULE: 422 };
const DB_DOWN_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '57P03', '08006', '08001'];

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (STATUS_BY_CODE[err.code]) {
    return res.status(STATUS_BY_CODE[err.code]).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Nội dung JSON gửi lên không hợp lệ' } });
  }
  if (DB_DOWN_CODES.includes(err.code) || (err.errors || []).some((e) => DB_DOWN_CODES.includes(e.code))) {
    // Không in chuỗi kết nối hay chi tiết lỗi ra ngoài.
    return res.status(503).json({ error: { code: 'DB_UNAVAILABLE', message: 'Không kết nối được cơ sở dữ liệu, vui lòng thử lại sau' } });
  }
  console.error(err); // chi tiết chỉ ghi vào log phía máy chủ
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Lỗi hệ thống, vui lòng thử lại sau' } });
}

module.exports = errorHandler;
