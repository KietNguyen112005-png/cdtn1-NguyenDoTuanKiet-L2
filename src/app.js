const express = require('express');
const customerRoutes = require('./routes/customer.routes');
const ticketRoutes = require('./routes/ticket.routes');
const errorHandler = require('./routes/error-handler');

function createApp({ customerService, ticketService }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/customers', customerRoutes(customerService));
  app.use('/tickets', ticketRoutes(ticketService));

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn' } }));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
