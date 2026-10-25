// Nghiệp vụ phiếu bảo hành (FR3–FR7, FR10; BR1–BR5). Tầng này không biết gì về giao thức web.
const { NotFoundError, ConflictError, BusinessRuleError, ValidationError } = require('../errors');
const {
  validateCreateTicket, validateIssueDescOnly, validateStatus, validateListFilter,
} = require('../validators/ticket.validator');
const { evaluateWarranty } = require('../rules/warranty');
const { addWorkingHours, toLocalDate } = require('../rules/sla');
const { canTransition, isClosing } = require('../rules/ticket-status');
const { formatTicketCode } = require('../rules/ticket-code');

function createTicketService({
  ticketRepo, customerRepo, deviceRepo, categoryRepo, slaRepo,
  clock = { now: () => new Date() },
  tzOffsetMinutes = 420,
}) {
  async function mustFind(id) {
    const ticket = await ticketRepo.findById(id);
    if (!ticket) throw new NotFoundError('Không tìm thấy phiếu bảo hành');
    return ticket;
  }

  // Chi tiết phiếu: ghép thông tin khách, thiết bị, nhóm sự cố và lịch sử trạng thái.
  async function buildDetail(ticket) {
    const [customer, device, category, history] = await Promise.all([
      customerRepo.findById(ticket.customerId), deviceRepo.findById(ticket.deviceId),
      categoryRepo.findById(ticket.categoryId), ticketRepo.listHistory(ticket.id),
    ]);
    return { ticket, customer, device, category, history };
  }

  async function changeStatus(id, toStatus, actor) {
    validateStatus(toStatus);
    const ticket = await mustFind(id);
    if (!canTransition(ticket.status, toStatus)) { // BR5
      throw new BusinessRuleError(`Không thể chuyển phiếu từ ${ticket.status} sang ${toStatus}`);
    }
    const closedAt = isClosing(toStatus) ? clock.now() : null;
    const updated = await ticketRepo.updateStatus(id, ticket.status, toStatus, actor, closedAt);
    if (!updated) throw new ConflictError('Phiếu vừa được người khác thay đổi trạng thái, hãy tải lại');
    return updated;
  }

  return {
    // FR3–FR6, BR1–BR3
    async create(input, actor = 'system') {
      const data = validateCreateTicket(input); // BR3: thiếu trường bắt buộc thì không lưu

      const customer = await customerRepo.findById(data.customerId);
      if (!customer || !customer.isActive) {
        throw new BusinessRuleError('Khách hàng không tồn tại hoặc đã ngừng hoạt động');
      }
      const device = await deviceRepo.findById(data.deviceId);
      if (!device) throw new NotFoundError('Không tìm thấy thiết bị');
      if (device.customerId !== customer.id) {
        throw new BusinessRuleError('Thiết bị không thuộc khách hàng này');
      }
      const category = await categoryRepo.findById(data.categoryId);
      if (!category || !category.isActive) {
        throw new BusinessRuleError('Nhóm sự cố không tồn tại hoặc đã ngừng sử dụng');
      }

      const priority = data.priority || category.defaultPriority || 'TRUNG_BINH';
      const sla = await slaRepo.findByPriority(priority);
      if (!sla) throw new BusinessRuleError(`Chưa cấu hình SLA cho mức ưu tiên ${priority}`);

      const receivedAt = clock.now();
      const warranty = evaluateWarranty(device, toLocalDate(receivedAt, tzOffsetMinutes)); // BR1
      const dueDate = addWorkingHours(receivedAt, sla.hours, tzOffsetMinutes); // BR2

      const id = await ticketRepo.reserveId();
      const ticket = await ticketRepo.insertWithLog({
        id,
        ticketCode: formatTicketCode(id, receivedAt.getUTCFullYear()),
        customerId: customer.id,
        deviceId: device.id,
        categoryId: category.id,
        priority,
        issueDesc: data.issueDesc,
        status: 'MOI',
        receivedAt,
        dueDate,
        isWarranty: warranty.isWarranty,
      }, actor);

      return { ...ticket, warrantyStatus: warranty.status, warrantyExpiresOn: warranty.expiresOn };
    },

    get: (id) => mustFind(id),

    detail: async (id) => buildDetail(await mustFind(id)),

    async detailByCode(code) {
      const c = String(code || '').trim();
      if (!c) throw new ValidationError([{ field: 'code', message: 'Nhập mã phiếu, ví dụ BH-000001/2026' }]);
      const ticket = await ticketRepo.findByCode(c);
      if (!ticket) throw new NotFoundError('Không tìm thấy phiếu có mã này');
      return buildDetail(ticket);
    },

    list: (query) => ticketRepo.list(validateListFilter(query)),

    // BR4: chỉ sửa mô tả lỗi khi phiếu còn ở trạng thái MỚI.
    async updateDescription(id, input) {
      const issueDesc = validateIssueDescOnly(input);
      const ticket = await mustFind(id);
      if (ticket.status !== 'MOI') {
        throw new BusinessRuleError('Không thể sửa mô tả lỗi khi phiếu đã rời trạng thái MỚI');
      }
      return ticketRepo.updateDescription(id, issueDesc);
    },

    changeStatus,

    // "Xoá" phiếu = huỷ phiếu (không xoá vật lý), chỉ hợp lệ theo BR5.
    cancel: (id, actor = 'system') => changeStatus(id, 'DA_HUY', actor),
  };
}

module.exports = { createTicketService };
