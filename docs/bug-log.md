# Bug Log – Luồng L2 (track SE)

Mỗi bug có đủ bảy dòng: mã và mức độ · phát hiện bởi · triệu chứng · cách tái lập · nguyên nhân gốc · cách sửa · commit và xác nhận. Mức độ phân loại theo hai câu hỏi của học phần (Critical: không dùng được, sai dữ liệu hoặc lộ dữ liệu/lỗ hổng; Major: chức năng quan trọng sai nhưng có cách làm khác; Minor: nghiệp vụ vẫn đúng).

| Mã | Mức độ | Tóm tắt | Trạng thái |
|---|---|---|---|
| BUG-01 | MAJOR | Thiết bị có ngày mua ở tương lai vẫn được chấp nhận, phiếu bị xác định "còn bảo hành" sai | (điền: Đã sửa) |
| BUG-02 | MINOR | Đường dẫn có id không phải số (ví dụ `GET /tickets/abc`) trả 500 thay vì 400 | (điền: Đã sửa) |
| BUG-03 | MINOR | Mã phiếu mang năm sai trong bảy giờ đầu ngày 01/01 (giờ Việt Nam) | (điền: Đã sửa) |
| BUG-04 | MINOR | Nội dung gửi lên quá lớn trả 500 thay vì 413 | (điền: Đã sửa) |
| BUG-05 | MINOR | Token đăng nhập thêm đuôi (ví dụ `<token>.x`) vẫn được chấp nhận | (điền: Đã sửa) |

## BUG-01 – Thiết bị có ngày mua ở tương lai vẫn được chấp nhận, phiếu bị xác định "còn bảo hành" sai

1. **Mã và mức độ:** BUG-01 · **MAJOR**, vì quy tắc bảo hành BR1 cho kết quả sai với dữ liệu bất hợp lý; vẫn có cách làm khác (nhập đúng ngày mua).
2. **Phát hiện bởi:** TC-09 (Test Report).
3. **Triệu chứng:** Thêm thiết bị với ngày mua năm 2999 thành công (mã 201); phiếu lập cho thiết bị đó được xác định CON_BAO_HANH.
4. **Cách tái lập:** 1) Đăng nhập (yêu cầu số 0 trong `requests.http`). 2) Gửi mục "BUG-01 tái lập" (`POST /catalog/devices` với `purchaseDate: "2999-01-01"`): trả 201. 3) Lập phiếu cho thiết bị vừa thêm: `warrantyStatus` là CON_BAO_HANH. Hoặc chạy `npm test` trên bản chưa sửa: TC-09 FAIL.
5. **Nguyên nhân gốc:** `validateDevice` chỉ kiểm tra ngày mua đúng định dạng, không so với ngày hiện tại; `evaluateWarranty` dùng `receivedDate <= expiresOn` nên ngày mua ở tương lai luôn "còn bảo hành".
6. **Cách sửa:** Thêm nhánh so sánh ngày mua với ngày hôm nay theo giờ Việt Nam trong `src/validators/device.validator.js` (tham số `today` được truyền vào để test cố định ngày). Ngày mua đúng hôm nay vẫn hợp lệ.
7. **Commit và xác nhận:** https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2/commit/<mã-commit-sửa-BUG-01> · chạy lại TC-09 sau khi sửa: (điền PASS sau khi chạy thật).

## BUG-02 – Đường dẫn có id không phải số (ví dụ `GET /tickets/abc`) trả 500 thay vì 400

1. **Mã và mức độ:** BUG-02 · **MINOR**, vì chỉ gặp khi gọi API trực tiếp với id sai, giao diện không gửi id như vậy; nghiệp vụ vẫn đúng.
2. **Phát hiện bởi:** TC-11 (Test Report).
3. **Triệu chứng:** Gọi `GET /tickets/abc` nhận mã 500 với thông báo chung "Lỗi hệ thống", thay vì 400 nêu rõ id không hợp lệ. Cùng lỗi với `GET /customers/abc` và `PATCH /tickets/abc/status`.
4. **Cách tái lập:** 1) Đăng nhập. 2) Bấm Send Request ở mục "TC-11" trong `requests.http` (`GET /tickets/abc`). 3) Nhận 500; nhật ký máy chủ (terminal chạy `npm start`) in lỗi cơ sở dữ liệu.
5. **Nguyên nhân gốc:** Route đổi id bằng `Number(req.params.id)`; `Number("abc")` là `NaN`, giá trị này được gửi xuống PostgreSQL làm tham số kiểu bigint và gây lỗi cú pháp (mã 22P02) mà `error-handler` không nhận ra nên rơi vào nhánh 500. Lỗi của người gọi bị xử lý như lỗi của hệ thống.
6. **Cách sửa:** Thêm `src/routes/parse-id.js` chỉ nhận số nguyên dương (sai thì ném lỗi nhập liệu, trả 400) và dùng trong `customer.routes.js`, `ticket.routes.js`, `catalog.routes.js`. Test hồi quy: `tests/bug-02-id-khong-hop-le.test.js`.
7. **Commit và xác nhận:** https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2/commit/<mã-commit-sửa-BUG-02> · chạy lại TC-11 và test hồi quy BUG-02 sau khi sửa: (điền PASS sau khi chạy thật).

## BUG-03 – Mã phiếu mang năm sai trong bảy giờ đầu ngày 01/01 (giờ Việt Nam)

1. **Mã và mức độ:** BUG-03 · **MINOR**, vì hạn cam kết, bảo hành và trạng thái vẫn đúng; chỉ phần năm trong mã phiếu lệch trong một khoảng thời gian ngắn mỗi năm.
2. **Phát hiện bởi:** Kiểm thử khám phá khi viết TC-01 (rà quy tắc sinh mã phiếu); không thuộc 12 test case nên có test hồi quy riêng.
3. **Triệu chứng:** Phiếu lập lúc 03:00 sáng 01/01/2027 giờ Việt Nam nhận mã `BH-000231/2026` thay vì `BH-000231/2027`.
4. **Cách tái lập:** Chạy `node --test --test-name-pattern="BUG-03"` trên bản chưa sửa: test dùng đồng hồ cố định `2026-12-31T20:00:00Z` (tức 03:00 01/01/2027 giờ VN) và FAIL vì mã mang năm 2026. Không tái lập bằng tay được trừ khi đổi giờ máy.
5. **Nguyên nhân gốc:** `ticket.service.js` lấy năm bằng `receivedAt.getUTCFullYear()` (giờ UTC), trong khi mọi quy tắc khác của hệ thống tính theo giờ Việt Nam (UTC+7).
6. **Cách sửa:** Lấy năm từ ngày địa phương `toLocalDate(receivedAt, tzOffsetMinutes)` trong `src/services/ticket.service.js`. Test hồi quy: `tests/bug-03-nam-ma-phieu.test.js` (kèm ca biên 23:59 ngày 31/12 vẫn là năm cũ).
7. **Commit và xác nhận:** https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2/commit/<mã-commit-sửa-BUG-03> · chạy lại test hồi quy BUG-03 sau khi sửa: (điền PASS sau khi chạy thật).

## BUG-04 – Nội dung gửi lên quá lớn trả 500 thay vì 413

1. **Mã và mức độ:** BUG-04 · **MINOR**, vì chỉ xảy ra khi gửi thân yêu cầu lớn hơn 100 KB, người dùng thông thường không gặp; hệ thống không sập và không lộ chi tiết lỗi.
2. **Phát hiện bởi:** Kiểm thử khám phá theo OWASP A02 (cố tình gây lỗi rồi đọc phản hồi); không thuộc 12 test case nên có test hồi quy riêng.
3. **Triệu chứng:** Gửi `POST /customers` với thân JSON khoảng 200 KB nhận mã 500 "Lỗi hệ thống" thay vì 413 báo nội dung quá lớn.
4. **Cách tái lập:** Trong PowerShell: `$t = (Invoke-RestMethod -Method Post -Uri http://localhost:3000/auth/login -ContentType "application/json" -Body '{"username":"nhanvien","password":"1234"}').data.token`; `$body = '{"fullName":"' + ('a' * 200000) + '","phone":"0912345678"}'`; `[IO.File]::WriteAllText("$PWD\big.json", $body)`; `curl.exe -i -X POST http://localhost:3000/customers -H "Authorization: Bearer $t" -H "Content-Type: application/json" --data-binary "@big.json"`. Bản chưa sửa trả 500.
5. **Nguyên nhân gốc:** `express.json` giới hạn thân yêu cầu 100 KB và ném lỗi loại `entity.too.large` (trạng thái 413), nhưng `error-handler.js` chỉ nhận ra lỗi `entity.parse.failed` nên lỗi này rơi vào nhánh 500.
6. **Cách sửa:** Thêm nhánh trả 413 với mã `PAYLOAD_TOO_LARGE` trong `src/routes/error-handler.js`. Test hồi quy: `tests/bug-04-noi-dung-qua-lon.test.js` (kèm kiểm tra lỗi lạ vẫn trả 500 chung chung, không lộ chi tiết).
7. **Commit và xác nhận:** https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2/commit/<mã-commit-sửa-BUG-04> · chạy lại test hồi quy BUG-04 sau khi sửa: (điền PASS sau khi chạy thật).

## BUG-05 – Token đăng nhập thêm đuôi (ví dụ `<token>.x`) vẫn được chấp nhận

1. **Mã và mức độ:** BUG-05 · **MINOR**, vì không cho phép giả mạo token hay truy cập trái phép (vẫn cần một token hợp lệ); chỉ là bộ kiểm tra token nới lỏng định dạng.
2. **Phát hiện bởi:** TC-10 (Test Report).
3. **Triệu chứng:** Gọi API với `Authorization: Bearer <token>.x` vẫn nhận 200 thay vì 401.
4. **Cách tái lập:** 1) Đăng nhập. 2) Gửi mục "BUG-05 tái lập" trong `requests.http` (`GET /tickets` với `Bearer {{token}}.x`): bản chưa sửa trả 200. Hoặc chạy `npm test` trên bản chưa sửa: TC-10 FAIL.
5. **Nguyên nhân gốc:** `verify` tách token bằng `split(".")` rồi chỉ lấy hai phần đầu và bỏ qua phần thừa, nên token có đuôi vẫn khớp chữ ký.
6. **Cách sửa:** Yêu cầu token có đúng hai phần (`parts.length === 2`) trong `src/services/auth.service.js`. TC-10 kiểm cả bốn biến thể token (không có, sửa một ký tự, thêm đuôi, quá hạn).
7. **Commit và xác nhận:** https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2/commit/<mã-commit-sửa-BUG-05> · chạy lại TC-10 sau khi sửa: (điền PASS sau khi chạy thật).

