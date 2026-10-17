// Danh mục tra cứu cho màn hình tạo phiếu: nhóm sự cố và thiết bị của khách.
function createCatalogService({ categoryRepo, deviceRepo }) {
  return {
    listCategories: () => categoryRepo.list(),
    listDevices: (customerId) => deviceRepo.listByCustomer(customerId),
  };
}
module.exports = { createCatalogService };
