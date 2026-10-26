const express = require('express');
const wrap = require('./async-handler');

module.exports = function ticketRoutes(ticketService) {
  const router = express.Router();
  const actorOf = (req) => (req.user && req.user.username) || 'system';

  router.post('/', wrap(async (req, res) => {
    res.status(201).json({ data: await ticketService.create(req.body, actorOf(req)) });
  }));

  router.get('/', wrap(async (req, res) => {
    res.json({ data: await ticketService.list(req.query) });
  }));

  router.get('/:id', wrap(async (req, res) => {
    res.json({ data: await ticketService.get(Number(req.params.id)) });
  }));

  router.put('/:id', wrap(async (req, res) => { // BR4: chỉ sửa khi phiếu còn MỚI
    res.json({ data: await ticketService.updateDescription(Number(req.params.id), req.body) });
  }));

  router.patch('/:id/status', wrap(async (req, res) => { // BR5
    res.json({ data: await ticketService.changeStatus(Number(req.params.id), req.body.toStatus, actorOf(req)) });
  }));

  router.delete('/:id', wrap(async (req, res) => { // "xoá" = huỷ phiếu
    res.json({ data: await ticketService.cancel(Number(req.params.id), actorOf(req)) });
  }));

  return router;
};
