// Danh mục cho màn hình tạo phiếu: nhóm sự cố, thiết bị của khách và thêm thiết bị mới (US3).
const { ValidationError, NotFoundError, ConflictError } = require('../errors');
const { validateDevice } = require('../validators/device.validator');

function createCatalogService({ categoryRepo, deviceRepo, customerRepo }) {
  return {
    listCategories: () => categoryRepo.list(),
    listDevices: (customerId) => deviceRepo.listByCustomer(customerId),

    async createDevice(input = {}) {
      const customerId = input.customerId;
      if (!Number.isInteger(customerId) || customerId < 1) {
        throw new ValidationError([{ field: 'customerId', message: 'customerId là bắt buộc' }]);
      }
      const data = validateDevice(input);
      const customer = await customerRepo.findById(customerId);
      if (!customer || !customer.isActive) throw new NotFoundError('Không tìm thấy khách hàng');
      if (await deviceRepo.findBySerial(data.serialNo)) throw new ConflictError('IMEI/Serial này đã tồn tại trong hệ thống');
      return deviceRepo.insert({ customerId, ...data });
    },
  };
}
module.exports = { createCatalogService };
