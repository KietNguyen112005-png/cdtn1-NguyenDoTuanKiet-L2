const express = require('express');
const customerRoutes = require('./routes/customer.routes');
const ticketRoutes = require('./routes/ticket.routes');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const requireAuth = require('./routes/require-auth');
const catalogRoutes = require('./routes/catalog.routes');
const errorHandler = require('./routes/error-handler');

function createApp({ customerService, ticketService, authService, catalogService }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use(express.static(path.join(__dirname, '..', 'public'))); // giao diện web
  app.use('/auth', authRoutes(authService));
  const guard = requireAuth(authService); // mọi API nghiệp vụ đều cần đăng nhập
  app.use('/customers', guard, customerRoutes(customerService));
  app.use('/tickets', guard, ticketRoutes(ticketService));
  app.use('/catalog', guard, catalogRoutes(catalogService));

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy đường dẫn' } }));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
