// Nghiệp vụ khách hàng (FR1, FR2; BR6, BR7). Tầng này không biết gì về giao thức web.
const { NotFoundError, ConflictError } = require('../errors');
const { validateCustomer, validatePhone } = require('../validators/customer.validator');

function createCustomerService({ customerRepo }) {
  async function mustFind(id) {
    const customer = await customerRepo.findById(id);
    if (!customer) throw new NotFoundError('Không tìm thấy thông tin khách hàng');
    return customer;
  }

  return {
    async create(input) {
      const data = validateCustomer(input);
      if (await customerRepo.findByPhone(data.phone)) {
        throw new ConflictError('Số điện thoại đã tồn tại trong hệ thống');
      }
      return customerRepo.insert(data);
    },

    get: (id) => mustFind(id),

    async findByPhone(phone) {
      const customer = await customerRepo.findByPhone(validatePhone(phone)); // BR6
      if (!customer) throw new NotFoundError('Không tìm thấy thông tin khách hàng');
      return customer;
    },

    list: ({ limit = 20, offset = 0 } = {}) => customerRepo.list({ limit, offset }),

    async update(id, input) {
      const data = validateCustomer(input, { partial: true });
      const current = await mustFind(id);
      if (data.phone && data.phone !== current.phone && (await customerRepo.findByPhone(data.phone))) {
        throw new ConflictError('Số điện thoại đã tồn tại trong hệ thống');
      }
      return customerRepo.update(id, data);
    },

    // BR7: không xoá vật lý, chỉ ngừng hoạt động.
    async deactivate(id) {
      await mustFind(id);
      return customerRepo.setActive(id, false);
    },
  };
}

module.exports = { createCustomerService };
