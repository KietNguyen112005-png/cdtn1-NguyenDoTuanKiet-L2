// Hồi quy BUG-03: năm trong mã phiếu phải theo NGÀY GIỜ VIỆT NAM, không theo UTC.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTicketService } = require('../src/services/ticket.service');
const { makeTicketDeps } = require('./helpers/fakes');

const input = { customerId: 1, deviceId: 10, categoryId: 2, issueDesc: 'Pin sụt nhanh, máy tự tắt nguồn' };
const codeAt = async (iso) => (await createTicketService(makeTicketDeps({ clock: { now: () => new Date(iso) } }).deps).create(input)).ticketCode;

test('BUG-03 hồi quy: 03:00 sáng 01/01/2027 giờ VN thì mã phiếu mang năm 2027', async () => {
  assert.equal(await codeAt('2026-12-31T20:00:00Z'), 'BH-000231/2027'); // 03:00 01/01/2027 giờ VN
});

test('BUG-03 hồi quy (biên): 23:59 ngày 31/12/2026 giờ VN vẫn mang năm 2026', async () => {
  assert.equal(await codeAt('2026-12-31T16:59:00Z'), 'BH-000231/2026');
});
