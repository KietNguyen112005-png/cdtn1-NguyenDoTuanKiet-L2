const express = require('express');
module.exports = function authRoutes(authService) {
  const router = express.Router();
  router.post('/login', (req, res, next) => {
    try { const b = req.body || {}; res.json({ data: authService.login(b.username, b.password) }); } catch (err) { next(err); }
  });
  return router;
};
