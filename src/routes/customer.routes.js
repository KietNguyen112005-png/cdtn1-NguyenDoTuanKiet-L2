// Lớp routes: chỉ lo HTTP (đọc req, gọi service, trả res). Không có quy tắc nghiệp vụ.
const express = require('express');
const wrap = require('./async-handler');

module.exports = function customerRoutes(customerService) {
  const router = express.Router();

  router.post('/', wrap(async (req, res) => {
    res.status(201).json({ data: await customerService.create(req.body) });
  }));

  router.get('/', wrap(async (req, res) => {
    if (req.query.phone !== undefined) { // US1: tra cứu theo số điện thoại
      return res.json({ data: await customerService.findByPhone(req.query.phone) });
    }
    res.json({ data: await customerService.list({
      limit: Number(req.query.limit) || 20, offset: Number(req.query.offset) || 0,
    }) });
  }));

  router.get('/:id', wrap(async (req, res) => {
    res.json({ data: await customerService.get(Number(req.params.id)) });
  }));

  router.put('/:id', wrap(async (req, res) => {
    res.json({ data: await customerService.update(Number(req.params.id), req.body) });
  }));

  router.delete('/:id', wrap(async (req, res) => { // BR7: ngừng hoạt động, không xoá vật lý
    res.json({ data: await customerService.deactivate(Number(req.params.id)) });
  }));

  return router;
};
