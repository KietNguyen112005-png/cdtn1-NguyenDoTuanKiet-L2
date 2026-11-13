-- Dữ liệu mẫu 2: sáu phiếu, mỗi phiếu một trạng thái (trừ DA_HUY) để danh sách phiếu không trống và thử được chuyển trạng thái.
-- Chạy lại không nhân đôi: phiếu dùng ON CONFLICT DO NOTHING; lịch sử chỉ nạp cho phiếu chưa có dòng lịch sử nào.

INSERT INTO ticket (ticket_id, ticket_code, customer_id, device_id, category_id, priority, issue_desc,
                    status, received_at, due_date, is_warranty, closed_at)
SELECT v.id, v.code, c.customer_id, d.device_id, k.category_id, v.prio, v.descr,
       v.st, v.recv::timestamptz, v.due::timestamptz, v.warr, v.closed::timestamptz
FROM (VALUES
    (1, 'BH-000001/2026', '0937482915', '352099001234561', 'PIN',      'TRUNG_BINH', 'Pin sụt nhanh, máy tự tắt nguồn',
        'MOI',           '2026-10-26 09:00+07', '2026-10-29 09:00+07', true,  NULL),
    (2, 'BH-000002/2026', '0937482915', '352099001234562', 'MAN_HINH', 'CAO',        'Màn hình bị sọc ngang sau khi rơi',
        'DA_PHAN_CONG',  '2026-10-26 14:30+07', '2026-10-27 14:30+07', false, NULL),
    (3, 'BH-000003/2026', '0937482915', '352099001234561', 'SAC',      'TRUNG_BINH', 'Sạc chậm và nóng bất thường khi cắm điện',
        'DANG_XU_LY',    '2026-10-22 10:15+07', '2026-10-26 10:15+07', true,  NULL),
    (4, 'BH-000004/2026', '0865139704', '352099001234563', 'NUOC_VAO', 'CAO',        'Máy vào nước, không lên nguồn',
        'CHO_LINH_KIEN', '2026-10-23 16:00+07', '2026-10-24 16:00+07', false, NULL),
    (5, 'BH-000005/2026', '0865139704', '352099001234563', 'PHAN_MEM', 'THAP',       'Máy treo logo sau khi cập nhật phần mềm',
        'HOAN_TAT',      '2026-10-19 09:30+07', '2026-10-24 09:30+07', false, NULL),
    (6, 'BH-000006/2026', '0937482915', '352099001234561', 'KHAC',     'THAP',       'Loa ngoài rè, âm lượng nhỏ',
        'DA_DONG',       '2026-10-12 11:00+07', '2026-10-17 11:00+07', true,  '2026-10-16 15:20+07')
) AS v(id, code, phone, serial, cat, prio, descr, st, recv, due, warr, closed)
JOIN customer       c ON c.phone = v.phone
JOIN device         d ON d.serial_no = v.serial
JOIN issue_category k ON k.category_name = v.cat
ON CONFLICT DO NOTHING;

INSERT INTO ticket_status_log (ticket_id, from_status, to_status, changed_at, changed_by)
SELECT v.tid, v.f, v.t, v.changed::timestamptz, 'nhanvien'
FROM (VALUES
    (1, NULL,            'MOI',           '2026-10-26 09:00+07'),
    (2, NULL,            'MOI',           '2026-10-26 14:30+07'),
    (2, 'MOI',           'DA_PHAN_CONG',  '2026-10-26 15:10+07'),
    (3, NULL,            'MOI',           '2026-10-22 10:15+07'),
    (3, 'MOI',           'DA_PHAN_CONG',  '2026-10-22 10:40+07'),
    (3, 'DA_PHAN_CONG',  'DANG_XU_LY',    '2026-10-23 09:00+07'),
    (4, NULL,            'MOI',           '2026-10-23 16:00+07'),
    (4, 'MOI',           'DA_PHAN_CONG',  '2026-10-23 16:20+07'),
    (4, 'DA_PHAN_CONG',  'DANG_XU_LY',    '2026-10-24 09:00+07'),
    (4, 'DANG_XU_LY',    'CHO_LINH_KIEN', '2026-10-24 13:30+07'),
    (5, NULL,            'MOI',           '2026-10-19 09:30+07'),
    (5, 'MOI',           'DA_PHAN_CONG',  '2026-10-19 10:00+07'),
    (5, 'DA_PHAN_CONG',  'DANG_XU_LY',    '2026-10-20 08:30+07'),
    (5, 'DANG_XU_LY',    'HOAN_TAT',      '2026-10-22 16:45+07'),
    (6, NULL,            'MOI',           '2026-10-12 11:00+07'),
    (6, 'MOI',           'DA_PHAN_CONG',  '2026-10-12 11:30+07'),
    (6, 'DA_PHAN_CONG',  'DANG_XU_LY',    '2026-10-13 09:00+07'),
    (6, 'DANG_XU_LY',    'HOAN_TAT',      '2026-10-15 17:00+07'),
    (6, 'HOAN_TAT',      'DA_DONG',       '2026-10-16 15:20+07')
) AS v(tid, f, t, changed)
WHERE EXISTS (SELECT 1 FROM ticket WHERE ticket_id = v.tid)
  AND NOT EXISTS (SELECT 1 FROM ticket_status_log l WHERE l.ticket_id = v.tid);

-- Số thứ tự phiếu mới (tạo từ giao diện) phải lớn hơn mọi phiếu đã có, để mã phiếu không trùng.
SELECT setval(pg_get_serial_sequence('ticket', 'ticket_id'), GREATEST((SELECT COALESCE(MAX(ticket_id), 0) FROM ticket), 6));
