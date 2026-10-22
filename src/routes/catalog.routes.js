const express = require('express');
const wrap = require('./async-handler');
module.exports = function catalogRoutes(catalogService) {
  const router = express.Router();
  router.get('/categories', wrap(async (req, res) => res.json({ data: await catalogService.listCategories() })));
  router.get('/devices', wrap(async (req, res) => res.json({ data: await catalogService.listDevices(Number(req.query.customerId)) })));
  router.post('/devices', wrap(async (req, res) => res.status(201).json({ data: await catalogService.createDevice(req.body) })));
  return router;
};
