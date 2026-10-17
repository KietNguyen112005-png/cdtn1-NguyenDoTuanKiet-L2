// Nơi duy nhất lắp ráp repositories -> services.
const config = require('./config');
const customerRepo = require('./repositories/customer.repository');
const deviceRepo = require('./repositories/device.repository');
const categoryRepo = require('./repositories/category.repository');
const slaRepo = require('./repositories/sla.repository');
const ticketRepo = require('./repositories/ticket.repository');
const { createCustomerService } = require('./services/customer.service');
const { createAuthService } = require('./services/auth.service');
const { createCatalogService } = require('./services/catalog.service');
const { createTicketService } = require('./services/ticket.service');

module.exports = {
  authService: createAuthService(config.auth),
  catalogService: createCatalogService({ categoryRepo, deviceRepo }),
  customerService: createCustomerService({ customerRepo }),
  ticketService: createTicketService({
    ticketRepo, customerRepo, deviceRepo, categoryRepo, slaRepo, tzOffsetMinutes: config.tzOffsetMinutes,
  }),
};
