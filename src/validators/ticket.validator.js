const { ValidationError } = require('../errors');
const { STATUSES } = require('../rules/ticket-status');

const PRIORITIES = ['CAO', 'TRUNG_BINH', 'THAP'];
const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

function checkIssueDesc(value, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ field: 'issueDesc', message: 'Mô tả lỗi là bắt buộc' });
  } else if (value.trim().length < 10 || value.trim().length > 2000) {
    errors.push({ field: 'issueDesc', message: 'Mô tả lỗi phải từ 10 đến 2000 ký tự' });
  }
}

function validateCreateTicket(input = {}) {
  const errors = [];
  for (const f of ['customerId', 'deviceId', 'categoryId']) {
    if (!isPositiveInt(input[f])) errors.push({ field: f, message: `${f} là bắt buộc và phải là số nguyên dương` });
  }
  checkIssueDesc(input.issueDesc, errors);
  if (input.priority !== undefined && !PRIORITIES.includes(input.priority)) {
    errors.push({ field: 'priority', message: `priority phải là một trong: ${PRIORITIES.join(', ')}` });
  }
  if (errors.length) throw new ValidationError(errors);
  return {
    customerId: input.customerId,
    deviceId: input.deviceId,
    categoryId: input.categoryId,
    priority: input.priority,
    issueDesc: input.issueDesc.trim(),
  };
}

function validateIssueDescOnly(input = {}) {
  const errors = [];
  checkIssueDesc(input.issueDesc, errors);
  if (errors.length) throw new ValidationError(errors);
  return input.issueDesc.trim();
}

function validateStatus(value) {
  if (!STATUSES.includes(value)) {
    throw new ValidationError([{ field: 'toStatus', message: `toStatus phải là một trong: ${STATUSES.join(', ')}` }]);
  }
  return value;
}

function validateListFilter(query = {}) {
  const errors = [];
  if (query.status !== undefined && !STATUSES.includes(query.status)) {
    errors.push({ field: 'status', message: `status phải là một trong: ${STATUSES.join(', ')}` });
  }
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) errors.push({ field: 'limit', message: 'limit phải từ 1 đến 100' });
  if (!Number.isInteger(offset) || offset < 0) errors.push({ field: 'offset', message: 'offset phải là số nguyên >= 0' });
  const customerId = query.customerId === undefined ? undefined : Number(query.customerId);
  if (customerId !== undefined && !isPositiveInt(customerId)) errors.push({ field: 'customerId', message: 'customerId không hợp lệ' });
  if (errors.length) throw new ValidationError(errors);
  return { status: query.status, customerId, limit, offset };
}

module.exports = { validateCreateTicket, validateIssueDescOnly, validateStatus, validateListFilter, PRIORITIES };
