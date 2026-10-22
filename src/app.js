const express = require('express');
const customerRoutes = require('./routes/customer.routes');
const ticketRoutes = require('./routes/ticket.routes');
const path = require('path');
const catalogRoutes = require('./routes/catalog.routes');
const errorHandler = require('./routes/error-handler');

function createApp({ customerService, ticketService, catalogService }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(express.static(path.join(__dirname, '..', 'public'))); // giao diện web
  app.use('/customers', customerRoutes(customerService));
  app.use('/tickets', ticketRoutes(ticketService));
  app.use('/catalog', catalogRoutes(catalogService));

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn' } }));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
