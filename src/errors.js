// Lỗi nghiệp vụ dùng chung. Chỉ mang "code" (không mang mã HTTP):
// việc đổi code -> mã HTTP là của lớp routes (xem src/routes/error-handler.js).
class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class ValidationError extends AppError {
  // fields: [{ field: 'issueDesc', message: '...' }]
  constructor(fields) {
    super('VALIDATION', `Dữ liệu không hợp lệ: ${fields.map((f) => f.field).join(', ')}`);
    this.fields = fields;
  }
}

class NotFoundError extends AppError {
  constructor(message) { super('NOT_FOUND', message); }
}

class ConflictError extends AppError {
  constructor(message) { super('CONFLICT', message); }
}

class BusinessRuleError extends AppError {
  constructor(message) { super('BUSINESS_RULE', message); }
}

module.exports = { AppError, ValidationError, NotFoundError, ConflictError, BusinessRuleError };
