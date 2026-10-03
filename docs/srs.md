# SRS BẢN RÚT GỌN – Luồng L2: Tiếp nhận và phân loại yêu cầu bảo hành (Smart CRM – Mekong Mobile)

---

## 1. GIỚI THIỆU VÀ PHẠM VI

### 1.1. Mục đích tài liệu
Tài liệu này là bản đặc tả yêu cầu phần mềm (SRS) rút gọn cho Luồng L2 – Tiếp nhận và phân loại yêu cầu bảo hành thuộc hệ thống Smart CRM của Mekong Mobile. Tài liệu làm căn cứ thống nhất nghiệp vụ giữa bộ phận phân tích, lập trình và kiểm thử cho các bài tập hiện thực tiếp theo.

### 1.2. Bối cảnh doanh nghiệp
Công ty Cổ phần Bán lẻ & Dịch vụ Mekong Mobile vận hành 24 cửa hàng và 6 trung tâm bảo hành với khoảng 65.000 khách hàng. Khâu tiếp nhận bảo hành hiện gặp các hạn chế:

- Ghi nhận thủ công trên sổ sách, không theo dõi được tiến độ.
- Dữ liệu phân tán trên nhiều file Excel và Zalo.
- Phân loại lỗi và mức ưu tiên cảm tính, không có căn cứ tính thời hạn cam kết (SLA) chuẩn xác.

### 1.3. Luồng nghiệp vụ được chọn & Phạm vi
- **Tên luồng:** L2 – Tiếp nhận và phân loại yêu cầu bảo hành.
- **Phạm vi cốt lõi:** Nhân viên tra cứu thông tin khách qua số điện thoại, ghi nhận thiết bị và mô tả lỗi, chọn nhóm sự cố và mức ưu tiên; hệ thống tự động tính thời hạn cam kết xử lý và khởi tạo phiếu (trạng thái MỚI) để chuyển cho kỹ thuật viên.
- **Dữ liệu & công nghệ:** Dự kiến ~40.000 bản ghi trên MongoDB (5 collections: Customers, Devices, Tickets, Technicians, SLA_Configs), giao diện React.

### 1.4. Điều chủ ý KHÔNG làm (WON'T Have)
- **W1:** Tối ưu hóa phân công kỹ thuật viên theo tay nghề hoặc địa bàn (thuộc Luồng L4).
- **W2:** Theo dõi và cập nhật tiến độ sửa chữa chi tiết sau khi đã chuyển giao phiếu (kể cả API chuyển trạng thái phiếu sau MỚI).
- **W3:** Quản lý kho linh kiện và xuất kho thay thế (thuộc Luồng L5).
- **W4:** Tự động phân loại lỗi bằng mô hình AI/NLP từ mô tả tự do (thuộc Luồng L10).
- **W5:** Tích hợp tổng đài VoIP, SMS gateway hoặc Zalo OA thật.
- **W6:**  Chức năng phê duyệt phiếu "chưa xác minh bảo hành" của Quản lý (L2 chỉ gắn cờ cho phiếu).

### 1.5. Thuật ngữ nghiệp vụ

| Thuật ngữ | Định nghĩa |
| --- | --- |
| Phiếu bảo hành | Bản ghi điện tử lưu thông tin khách hàng, thiết bị, mô tả lỗi, nhóm sự cố, mức ưu tiên và hạn SLA. |
| IMEI/Serial | Mã định danh duy nhất của thiết bị dùng để tra cứu thời hạn bảo hành. |
| SLA (Hạn cam kết) | Service Level Agreement – thời điểm chậm nhất phải hoàn tất phiếu, tính từ lúc tiếp nhận theo mức ưu tiên (BR2). |
| Nhóm sự cố | Phân loại nguyên nhân bảo hành: MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC. |
| Mức ưu tiên | Mức khẩn của phiếu: CAO, TRUNG_BINH, THAP; quyết định hạn cam kết. |
| Trạng thái phiếu | Vòng đời theo Hình 6.2 của case study: MỚI → ĐÃ PHÂN CÔNG → ĐANG XỬ LÝ → CHỜ LINH KIỆN → HOÀN TẤT → ĐÃ ĐÓNG; ngoài ra MỚI hoặc ĐÃ PHÂN CÔNG → ĐÃ HỦY. Luồng L2 chỉ tạo phiếu ở trạng thái **MỚI**; các chuyển trạng thái sau đó thuộc luồng L4/L5. |
| Chưa xác minh bảo hành |  Cờ gắn cho phiếu khi thiết bị không có ngày mua; hệ thống chỉ gắn cờ, việc phê duyệt nằm ngoài phạm vi L2 (W6, BR1). |

---

## 2. VAI TRÒ NGƯỜI DÙNG

| Vai trò | Mô tả công việc | Quyền hạn trên hệ thống |
| --- | --- | --- |
| Nhân viên tiếp nhận | Trực tiếp làm việc với khách hàng tại trung tâm bảo hành. | Tra cứu khách hàng; tạo phiếu bảo hành mới; ghi nhận thông tin thiết bị, lỗi, nhóm sự cố, mức ưu tiên. Không có quyền xóa phiếu. Chỉ xem dữ liệu của trung tâm mình (BR8). |
| Kỹ thuật viên | Tiếp nhận phiếu bảo hành được điều phối từ khâu tiếp nhận. | Xem danh sách phiếu mới chuyển giao, xem chi tiết mô tả lỗi và thời hạn cam kết SLA. |
| Quản lý trung tâm | Giám sát vận hành và thiết lập quy định nghiệp vụ. | Xem tổng quan danh sách phiếu tiếp nhận; thiết lập bảng cấu hình thời gian xử lý SLA theo mức ưu tiên; xem số điện thoại đầy đủ. |

---

## 3. YÊU CẦU CHỨC NĂNG VÀ USER STORY

### 3.1. Danh sách Yêu cầu Chức năng (Functional Requirements)

- **FR1:** Hệ thống cho phép nhân viên tiếp nhận tra cứu thông tin khách hàng và lịch sử bảo hành thông qua số điện thoại.
- **FR2:** Hệ thống cho phép tạo mới hồ sơ khách hàng khi số điện thoại chưa tồn tại trong hệ thống.
- **FR3:** Hệ thống cho phép chọn thiết bị từ lịch sử mua hàng hoặc nhập mới mã IMEI/Serial để xác định sản phẩm bảo hành và kiểm tra tình trạng bảo hành.
- **FR4:** Hệ thống cho phép ghi nhận mô tả chi tiết lỗi và đính kèm hình ảnh/video hiện trạng thiết bị.
- **FR5:** Hệ thống cho phép gán nhóm sự cố và chọn mức độ ưu tiên cho yêu cầu bảo hành.
- **FR6:** Hệ thống tự động tính toán và hiển thị thời hạn cam kết xử lý (SLA) dựa trên mức ưu tiên đã chọn.
- **FR7:** Hệ thống cho phép khởi tạo phiếu bảo hành ở trạng thái MỚI, ghi lịch sử trạng thái và gửi thông báo chuyển giao cho bộ phận kỹ thuật .
- **FR8:** Hệ thống cho phép in/xuất phiếu biên nhận tiếp nhận bảo hành dưới dạng PDF cho khách hàng.
- **FR9:**  Hệ thống cho phép Quản lý trung tâm thiết lập thời gian xử lý SLA theo từng mức ưu tiên (mặc định CAO 24 giờ, TRUNG_BINH 72 giờ, THAP 120 giờ).
- **FR10:**  Hệ thống cho phép Quản lý trung tâm xem tổng quan danh sách phiếu tiếp nhận thuộc trung tâm mình.

### 3.2. Danh sách User Story (kèm mức ưu tiên MoSCoW)

**US1 (MUST):** Là nhân viên tiếp nhận, tôi muốn nhập số điện thoại khách hàng để tra cứu thông tin cá nhân và lịch sử bảo hành, **nhờ đó** tôi nhận diện khách cũ trong vài giây và không phải hỏi lại hay nhập lại thông tin.

- **AC1 (Tra cứu thành công khách hàng đã tồn tại):**
  - GIVEN số điện thoại đã có thông tin trên hệ thống.
  - WHEN nhân viên nhập số điện thoại vào ô tìm kiếm và bấm nút Tra cứu.
  - THEN hệ thống tự động điền thông tin (Họ tên, Địa chỉ) và hiển thị bảng danh sách các lần bảo hành trước đó.
- **AC2 (Ngoại lệ – không tìm thấy khách hàng):**
  - GIVEN số điện thoại 0988888888 chưa từng tồn tại trên hệ thống.
  - WHEN nhân viên nhập 0988888888 và bấm nút Tra cứu.
  - THEN hệ thống hiển thị thông báo *"Không tìm thấy thông tin khách hàng"* kèm nút Tạo khách hàng mới.

**US2 (MUST):** Là nhân viên tiếp nhận, tôi muốn tạo mới thông tin khách hàng khi số điện thoại chưa tồn tại để tiếp tục quy trình tiếp nhận bảo hành mà không bị gián đoạn.

- **AC1 (Tạo mới thành công hợp lệ):**
  - GIVEN biểu mẫu tạo khách hàng mới đang mở với số điện thoại 0988888888 đã tự điền sẵn.
  - WHEN nhân viên nhập đầy đủ Họ tên "Nguyễn Văn A" và bấm Lưu thông tin.
  - THEN hệ thống khởi tạo hồ sơ mới, cấp mã khách hàng và tự động chọn khách hàng này cho phiếu đang tạo.
- **AC2 (Ngoại lệ – thiếu trường bắt buộc):**
  - GIVEN biểu mẫu tạo khách hàng mới đang mở.
  - WHEN nhân viên để trống ô Họ tên và bấm Lưu thông tin.
  - THEN hệ thống từ chối lưu, hiển thị cảnh báo đỏ "Họ tên khách hàng là bắt buộc" và giữ nguyên dữ liệu đã nhập.

**US3 (MUST):** Là nhân viên tiếp nhận, tôi muốn chọn thiết bị từ lịch sử mua hàng hoặc nhập mã IMEI/Serial mới để xác định chính xác sản phẩm và kiểm tra thời hạn bảo hành.

- **AC1 (Chọn thiết bị có trong lịch sử mua hàng):**
  - GIVEN khách hàng được chọn đã có lịch sử mua sản phẩm "iPhone 13" trên hệ thống.
  - WHEN nhân viên chọn "iPhone 13" từ danh sách gợi ý.
  - THEN hệ thống tự động điền Model, mã IMEI/Serial và hiển thị trạng thái "Còn bảo hành (Hạn đến 12/2026)".
- **AC2 (Nhập thiết bị ngoài lịch sử – không có ngày mua):** 
  - GIVEN thiết bị mang đến không có dữ liệu trong lịch sử mua hàng của khách.
  - WHEN nhân viên chọn Nhập thiết bị ngoài và điền mã IMEI 861234567890123.
  - THEN hệ thống ghi nhận thiết bị, gắn nhãn "Chưa xác minh bảo hành" và yêu cầu ghi chú thêm thông tin hóa đơn/nguồn gốc mua hàng.

**US4 (SHOULD):** Là nhân viên tiếp nhận, tôi muốn ghi nhận mô tả chi tiết lỗi và đính kèm hình ảnh/video hiện trạng thiết bị để cung cấp đầy đủ thông tin đầu vào cho kỹ thuật viên.

**US5 (SHOULD):** Là nhân viên tiếp nhận, tôi muốn gán nhóm sự cố và chọn mức độ ưu tiên để điều phối phiếu đến đúng bộ phận chuyên trách và sắp xếp thứ tự xử lý phù hợp.

**US6 (SHOULD):** Là nhân viên tiếp nhận, tôi muốn hệ thống tự động tính toán thời hạn cam kết (SLA) dựa trên mức ưu tiên để báo chính xác thời gian trả máy cho khách hàng.

**US7 (SHOULD):** Là nhân viên tiếp nhận, tôi muốn khởi tạo phiếu bảo hành ở trạng thái MỚI và tự động gửi thông báo đến bộ phận kỹ thuật để chuyển giao công việc tức thì.

**US8 (COULD):** Là nhân viên tiếp nhận, tôi muốn in phiếu biên nhận (hoặc xuất file PDF) để cung cấp cho khách hàng làm chứng từ xác nhận khi gửi máy bảo hành.

**US9 (COULD):**  Là quản lý trung tâm, tôi muốn thiết lập thời gian xử lý SLA theo mức ưu tiên và xem tổng quan danh sách phiếu tiếp nhận để điều chỉnh cam kết cho phù hợp năng lực và phát hiện sớm phiếu sắp quá hạn.

---

## 4. YÊU CẦU PHI CHỨC NĂNG

(Các con số NFR3, NFR4 là đề xuất của tôi, bạn chỉnh theo ý mình.)

- **NFR1 (Hiệu năng):** Kết quả tra cứu khách hàng và lịch sử bảo hành theo số điện thoại phải hiển thị **dưới 2 giây** với quy mô dữ liệu **40.000 bản ghi**.
- **NFR2 (Khả dụng):** Nhân viên tiếp nhận mới có thể hoàn thành việc tạo 1 phiếu bảo hành chuẩn xác trong **dưới 3 phút** mà không cần người hướng dẫn.
- **NFR3 (Bảo mật):** Chỉ tài khoản có vai trò Nhân viên tiếp nhận hoặc Quản lý trung tâm mới được khởi tạo và ghi nhận dữ liệu phiếu; **100%** yêu cầu ghi dữ liệu từ vai trò khác bị từ chối (HTTP 403). Phiên đăng nhập tự hết hạn sau **30 phút** không thao tác; tài khoản bị khóa **15 phút** sau **5 lần** đăng nhập sai liên tiếp.
- **NFR4 (Tin cậy):** Khi mất kết nối mạng đột ngột lúc đang nhập biểu mẫu, hệ thống giữ nguyên **100%** dữ liệu đã nhập trên màn hình và cho phép gửi lại trong vòng **tối thiểu 15 phút** mà không phải nhập lại từ đầu.

---

## 5. RÀNG BUỘC VÀ QUY TẮC NGHIỆP VỤ

  Các BR dưới đây đã đối chiếu với Bảng 9.1 của case study (mã QT tương ứng ghi trong ngoặc).

- **BR1 (Điều kiện bảo hành – QT-05, QT-03):** Thiết bị được coi là còn bảo hành nếu (ngày tiếp nhận − ngày mua) ≤ số tháng bảo hành của sản phẩm (`warranty_months`, mặc định 12). Thiết bị được xác định duy nhất bằng IMEI/Serial và chỉ thuộc một khách hàng tại một thời điểm. Nếu không có ngày mua, phiếu vẫn được tạo nhưng gắn cờ "chưa xác minh bảo hành"; việc phê duyệt nằm ngoài phạm vi L2 (W6).
- **BR2 (Quy tắc tính SLA – QT-04):** Hạn cam kết = thời điểm tiếp nhận + thời gian xử lý theo mức ưu tiên: **CAO = 24 giờ, TRUNG_BINH = 72 giờ, THAP = 120 giờ**; chỉ tính ngày làm việc (thứ Hai đến thứ Bảy). Giá trị lấy từ collection SLA_Configs (Quản lý trung tâm cấu hình).
- **BR3 (Xác thực dữ liệu đầu vào):** Số điện thoại, Mã thiết bị, Mô tả lỗi, Nhóm sự cố và Mức ưu tiên là BẮT BUỘC. Hệ thống từ chối lưu phiếu nếu thiếu một trong các thông tin này.
- **BR4 (Ràng buộc chỉnh sửa):**   Không cho phép chỉnh sửa thông tin thiết bị hay mô tả lỗi khi phiếu đã rời trạng thái MỚI (tức đã sang ĐÃ PHÂN CÔNG trở đi).
- **BR5 (Vòng đời trạng thái – QT-06):**  Phiếu chỉ chuyển trạng thái theo đúng vòng đời ở mục 1.5, không quay lại trạng thái trước. Mọi lần chuyển (kể cả lần tạo ban đầu) đều ghi vào `ticket_status_log` kèm thời điểm và người thực hiện.
- **BR6 (Số điện thoại – QT-01, QT-02):**  Số điện thoại là duy nhất; nhập số đã tồn tại thì hiển thị hồ sơ có sẵn thay vì tạo mới. Số được chuẩn hóa về 10 chữ số bắt đầu bằng 0 (chấp nhận dạng +84…, 84…, có dấu cách hoặc dấu chấm) trước khi lưu và tra cứu.
- **BR7 (Không xóa vật lý – QT-13):**  Không xóa vật lý phiếu, khách hàng; chỉ đánh dấu ngừng sử dụng.
- **BR8 (Phạm vi dữ liệu và che SĐT – QT-14, QT-15):**  Nhân viên chỉ xem dữ liệu của trung tâm mình. Số điện thoại hiển thị dạng che (ví dụ 090****567) với mọi vai trò trừ Quản lý trung tâm.

---

## 6. BẢNG TRUY VẾT YÊU CẦU (Requirement Traceability Matrix)

| Mã FR | Yêu cầu chức năng | User Story | Use Case liên quan | Mức MoSCoW | Test case (BT3) |
| --- | --- | --- | --- | --- | --- |
| FR1 | Tra cứu khách hàng & lịch sử bảo hành qua SĐT | US1 | UC1: Tra cứu thông tin & lịch sử bảo hành | MUST | TC-FR1 (BT3) |
| FR2 | Tạo mới hồ sơ khách hàng khi SĐT chưa tồn tại | US2 | UC2: Tạo mới thông tin khách hàng | MUST | TC-FR2 (BT3) |
| FR3 | Chọn thiết bị từ lịch sử hoặc nhập mới IMEI/Serial, kiểm tra bảo hành | US3 | UC3: Ghi nhận thông tin thiết bị & mô tả lỗi | MUST | TC-FR3 (BT3) |
| FR4 | Ghi nhận mô tả lỗi, đính kèm ảnh/video | US4 | UC3: Ghi nhận thông tin thiết bị & mô tả lỗi | SHOULD | TC-FR4 (BT3) |
| FR5 | Gán nhóm sự cố, chọn mức ưu tiên | US5 | UC4: Phân loại nhóm sự cố & mức ưu tiên | SHOULD | TC-FR5 (BT3) |
| FR6 | Tự động tính & hiển thị SLA theo mức ưu tiên | US6 | UC5: Tự động tính toán thời hạn cam kết SLA | SHOULD | TC-FR6 (BT3) |
| FR7 | Khởi tạo phiếu trạng thái MỚI, ghi lịch sử, gửi thông báo cho kỹ thuật | US7 | UC6: Khởi tạo phiếu bảo hành & gửi thông báo | SHOULD | TC-FR7 (BT3) |
| FR8 | In/xuất phiếu biên nhận PDF | US8 | UC8: In/Xuất phiếu biên nhận PDF | COULD | TC-FR8 (BT3) |
| FR9 | Quản lý thiết lập thời gian xử lý SLA theo mức ưu tiên | US9 | UC7: Cấu hình quy tắc SLA & xem tổng quan | COULD | TC-FR9 (BT3) |
| FR10 | Quản lý xem tổng quan danh sách phiếu tiếp nhận | US9 | UC7: Cấu hình quy tắc SLA & xem tổng quan | COULD | TC-FR10 (BT3) |

---

## 7. ĐẶC TẢ USE CASE QUAN TRỌNG NHẤT

### UC6 – Khởi tạo phiếu bảo hành & gửi thông báo

| Mục | Nội dung |
| --- | --- |
| Mã / Tên | UC6 – Khởi tạo phiếu bảo hành & gửi thông báo (US7) |
| Actor chính | Nhân viên tiếp nhận |
| Actor phụ | Kỹ thuật viên (nhận thông báo) |
| Mô tả | Nhân viên xác nhận lưu phiếu; hệ thống kiểm tra dữ liệu, tạo phiếu ở trạng thái MỚI, gửi thông báo cho kỹ thuật. |
| Liên quan | include UC3, UC4, UC5; được mở rộng (extend) bởi UC8; tiền đề từ UC1/UC2 |

**Điều kiện trước (Pre-conditions)**
1. Nhân viên đã đăng nhập với vai trò Nhân viên tiếp nhận (hoặc Quản lý trung tâm).
2. Đã chọn/tạo khách hàng (UC1, UC2) và đã ghi nhận thiết bị cùng mô tả lỗi (UC3).
3. Đã chọn nhóm sự cố và mức ưu tiên (UC4); SLA đã được tính (UC5).

**Điều kiện sau (Post-conditions)**
- *Thành công:* Phiếu được lưu với mã phiếu duy nhất (dạng BH-000123/2026), đầy đủ thông tin và hạn SLA, ở trạng thái **MỚI**; có 1 bản ghi đầu tiên trong `ticket_status_log`; kỹ thuật viên thấy phiếu trong danh sách phiếu mới.
- *Thất bại:* Không có phiếu nào bị tạo dở dang; dữ liệu nhân viên đã nhập vẫn giữ trên màn hình.

**Luồng chính (Main flow)**
1. Nhân viên kiểm tra lại thông tin trên màn hình tổng hợp phiếu và bấm **Lưu phiếu**.
2. Hệ thống kiểm tra quyền của tài khoản (NFR3, BR8).
3. Hệ thống kiểm tra các trường bắt buộc: SĐT, mã thiết bị, mô tả lỗi, nhóm sự cố, mức ưu tiên (BR3).
4. Hệ thống xác định tình trạng bảo hành của thiết bị theo BR1.
5. Hệ thống tính lại hạn SLA theo BR2 tại thời điểm lưu.
6. Hệ thống lưu phiếu vào collection Tickets với trạng thái **MỚI**, cấp mã phiếu và ghi bản ghi đầu tiên vào lịch sử trạng thái (BR5).
7. Hệ thống gửi thông báo chuyển giao đến bộ phận kỹ thuật.
8. Hệ thống hiển thị mã phiếu, hạn SLA và nút **In biên nhận** (FR8, tùy chọn).

**Luồng ngoại lệ (Exception flows)**

| Mã | Tại bước | Điều kiện | Xử lý |
| --- | --- | --- | --- |
| 2a | 2 | Tài khoản không đúng vai trò | Hệ thống từ chối, báo "Bạn không có quyền tạo phiếu", kết thúc use case. |
| 3a | 3 | Thiếu một hoặc nhiều trường bắt buộc | Hệ thống không lưu, tô đỏ và nêu rõ trường thiếu, giữ nguyên dữ liệu; quay lại bước 1 sau khi nhân viên bổ sung. |
| 4a | 4 | Thiết bị không có ngày mua (không tra được hóa đơn) | Hệ thống **không** cho nhân viên tự ghi "còn bảo hành"; gắn cờ "chưa xác minh bảo hành", yêu cầu ghi chú nguồn gốc mua hàng; phiếu vẫn được lưu kèm cờ này (việc phê duyệt nằm ngoài phạm vi L2 – W6); tiếp tục bước 5. |
| 4b | 4 | Thiết bị đã hết hạn bảo hành | Hệ thống hiển thị cảnh báo "Hết bảo hành – có tính phí", đặt `is_warranty = false`; tiếp tục bước 5 sau khi nhân viên xác nhận. |
| 5a | 5 | SLA_Configs chưa có cấu hình cho mức ưu tiên đã chọn | Hệ thống báo "Chưa cấu hình SLA cho mức ưu tiên này – liên hệ Quản lý", không lưu phiếu. |
| 6a | 6 | Lỗi lưu CSDL hoặc mất kết nối mạng | Hệ thống báo lỗi, giữ dữ liệu trên màn hình, cho phép bấm **Thử lại** (NFR4); không tạo phiếu trùng. |
| 7a | 7 | Gửi thông báo thất bại | Phiếu vẫn ở trạng thái MỚI (đã lưu, vẫn hiện trong danh sách phiếu mới của kỹ thuật); hệ thống cảnh báo nhân viên và tự thử gửi lại; khi thành công thì tiếp tục bước 8. |

---

## 8. MẪU ĐẶC TẢ RIÊNG THEO TRACK – TRACK SE: HỢP ĐỒNG API (API CONTRACT) 

> Điền theo mẫu ở Phần A của "Tài liệu tự học buổi 3". Mẫu này bổ sung cho SRS, không thay thế SRS.

### 8.1. Danh sách endpoint

| # | Phương thức | Đường dẫn | Mục đích | FR | User Story | Mức |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | GET | `/api/customers?phone={phone}` | Tra cứu khách hàng theo số điện thoại | FR1 | US1 | MUST |
| E2 | GET | `/api/customers/{customer_id}/tickets` | Lịch sử bảo hành của khách | FR1 | US1 | MUST |
| E3 | POST | `/api/customers` | Tạo khách hàng mới khi chưa tồn tại | FR2 | US2 | MUST |
| E4 | GET | `/api/customers/{customer_id}/devices` | Danh sách thiết bị khách đã mua, kèm tình trạng bảo hành | FR3 | US3 | MUST |
| E5 | POST | `/api/devices` | Ghi nhận thiết bị ngoài lịch sử mua hàng | FR3 | US3 | MUST |
| E6 | POST | `/api/attachments` | Tải ảnh/video hiện trạng thiết bị lên | FR4 | US4 | SHOULD |
| E7 | GET | `/api/issue-categories` | Lấy danh mục nhóm sự cố (kèm mức ưu tiên mặc định) | FR5 | US5 | SHOULD |
| E8 | GET | `/api/sla/due-date?priority={priority}` | Xem trước hạn cam kết theo mức ưu tiên | FR6 | US6 | SHOULD |
| E9 | POST | `/api/tickets` | Khởi tạo phiếu bảo hành (trạng thái MỚI) và gửi thông báo | FR4, FR5, FR6, FR7 | US4, US5, US6, US7 | SHOULD |
| E10 | GET | `/api/tickets?status=&page=&size=` | Danh sách phiếu (lọc theo trạng thái): phiếu mới cho kỹ thuật viên; tổng quan cho quản lý | FR7, FR10 | US7, US9 | SHOULD |
| E11 | GET | `/api/tickets/{ticket_id}/receipt` | Xuất phiếu biên nhận PDF | FR8 | US8 | COULD |
| E12 | PUT | `/api/sla-configs/{priority}` | Quản lý thiết lập số giờ xử lý SLA cho một mức ưu tiên | FR9 | US9 | COULD |

Không có endpoint chuyển trạng thái phiếu vì thuộc phạm vi W2 / luồng L4.

### 8.2. Quy ước chung
- Định dạng: JSON, UTF-8; header `Content-Type: application/json` (riêng E6 dùng `multipart/form-data`).
- Tên trường dùng `snake_case`, khớp tên trường trong CSDL.
- Khóa định danh (`*_id`): chuỗi (ObjectId của MongoDB).  Bạn đổi sang số nguyên nếu dùng CSDL quan hệ.
- Thời gian: ISO 8601 kèm múi giờ, ví dụ `2026-10-05T14:30:00+07:00`.
- Số điện thoại: request nhận nhiều dạng và được chuẩn hóa về `0xxxxxxxxx` (BR6); response hiển thị dạng che `090****567` trừ vai trò Quản lý (BR8).
- Phân trang: `page` (từ 1) và `size` (mặc định 20, tối đa 100); response có `total`.
- Cấu trúc lỗi thống nhất:
  ```json
  { "error": { "code": "VALIDATION_FAILED", "message": "Dữ liệu không hợp lệ", "fields": { "full_name": "Họ tên khách hàng là bắt buộc" } } }
  ```
- Mọi endpoint đều có thể trả `401 UNAUTHENTICATED` (thiếu/hết hạn token) và `403 FORBIDDEN` (sai vai trò hoặc sai trung tâm).

### 8.3. Xác thực và phân quyền
- Cơ chế: đăng nhập nhận JWT, gửi qua header `Authorization: Bearer <token>`; hết hạn sau 30 phút không thao tác (NFR3).

| Endpoint | Nhân viên tiếp nhận | Kỹ thuật viên | Quản lý trung tâm |
| --- | --- | --- | --- |
| E1–E9, E11 | Có (trong trung tâm mình) | Không | Có |
| E10 | Có | Có (chỉ xem) | Có |
| E12 | Không | Không | Có |

### 8.4. Chi tiết endpoint của các User Story MUST

#### E1 – `GET /api/customers?phone={phone}` (US1)

Request: query `phone` (bắt buộc).

Response **200 OK** – tìm thấy:
```json
{
  "customer_id": "c1024",
  "full_name": "Nguyễn Văn A",
  "phone": "098****888",
  "address": "12 Lê Lợi, Q.1, TP.HCM",
  "email": null
}
```
Response **404 Not Found** – không tìm thấy (US1-AC2); giao diện hiện "Không tìm thấy thông tin khách hàng" kèm nút Tạo khách hàng mới:
```json
{ "error": { "code": "CUSTOMER_NOT_FOUND", "message": "Không tìm thấy thông tin khách hàng" } }
```
Response **400 Bad Request** – `INVALID_PHONE` khi không quy về được 10 chữ số bắt đầu bằng 0.

#### E2 – `GET /api/customers/{customer_id}/tickets` (US1)

Response **200 OK** (có phân trang):
```json
{
  "total": 2,
  "items": [
    { "ticket_code": "BH-000112/2026", "received_at": "2026-03-02T09:10:00+07:00", "device_model": "iPhone 13", "category_name": "PIN", "status": "DA_DONG" }
  ]
}
```
Response **404** – `CUSTOMER_NOT_FOUND`. Response **403** – khách thuộc trung tâm khác (BR8).

#### E3 – `POST /api/customers` (US2)

Request:
```json
{ "full_name": "Nguyễn Văn A", "phone": "0988888888", "address": "12 Lê Lợi, Q.1, TP.HCM", "email": "a@example.com" }
```
Response **201 Created**: trả đối tượng khách hàng gồm `customer_id`, `full_name`, `phone` (che), `address`, `email`, `created_at`.

Response **400 Bad Request** – thiếu họ tên (US2-AC2); giao diện giữ nguyên dữ liệu đã nhập:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Dữ liệu không hợp lệ", "fields": { "full_name": "Họ tên khách hàng là bắt buộc" } } }
```
Response **409 Conflict** – `PHONE_ALREADY_EXISTS` (BR6/QT-01), kèm `existing_customer_id` để giao diện mở hồ sơ có sẵn.

Bảng validation E3:

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| full_name | Có | Chuỗi, 1–120 ký tự | Họ tên khách hàng là bắt buộc |
| phone | Có | Quy về 10 chữ số bắt đầu bằng 0; duy nhất | Số điện thoại không hợp lệ / Số điện thoại đã tồn tại |
| address | Không | Chuỗi, ≤ 255 ký tự | Địa chỉ tối đa 255 ký tự |
| email | Không | Đúng định dạng email, ≤ 120 ký tự | Email không hợp lệ |

#### E4 – `GET /api/customers/{customer_id}/devices` (US3)

Response **200 OK**:
```json
[
  {
    "device_id": "d3311",
    "model": "iPhone 13",
    "serial_no": "861234567890123",
    "purchase_date": "2025-12-20",
    "warranty_months": 12,
    "warranty_status": "CON_BAO_HANH",
    "warranty_expires_on": "2026-12-20"
  }
]
```
`warranty_status` nhận một trong: `CON_BAO_HANH`, `HET_BAO_HANH`, `CHUA_XAC_MINH` (BR1). Giao diện hiển thị "Còn bảo hành (Hạn đến 12/2026)" từ các trường này (US3-AC1).

Response **404** – `CUSTOMER_NOT_FOUND`. Response **403** – khách thuộc trung tâm khác.

#### E5 – `POST /api/devices` (US3, nhập thiết bị ngoài lịch sử)

Request:
```json
{ "customer_id": "c1024", "product_id": "p77", "serial_no": "861234567890123", "purchase_date": null, "purchase_note": "Khách mua ở cửa hàng ngoài, mất hóa đơn" }
```
Response **201 Created**: trả thiết bị với `warranty_status = "CHUA_XAC_MINH"` khi `purchase_date` là null (US3-AC2).

Response **400** – `VALIDATION_FAILED` (ví dụ thiếu `purchase_note`). Response **404** – `CUSTOMER_NOT_FOUND` hoặc `PRODUCT_NOT_FOUND`. Response **409** – `SERIAL_ALREADY_REGISTERED`: serial/IMEI đã thuộc khách hàng khác (BR1/QT-03).

Bảng validation E5:

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| customer_id | Có | Phải tồn tại | Không tìm thấy khách hàng |
| product_id | Có | Phải tồn tại | Không tìm thấy sản phẩm |
| serial_no | Có | Chuỗi 1–50 ký tự, duy nhất toàn hệ thống | Mã IMEI/Serial không hợp lệ / đã được đăng ký |
| purchase_date | Không | Ngày ISO, không lớn hơn ngày hiện tại | Ngày mua không hợp lệ |
| purchase_note | Có (khi không có `purchase_date`) | Chuỗi 1–255 ký tự | Cần ghi chú nguồn gốc/hóa đơn mua hàng |

### 8.5. Chi tiết các endpoint còn lại

#### E6 – `POST /api/attachments` (US4)
Request `multipart/form-data`, trường `file`. Response **201**: `{ "attachment_id": "a501", "file_name": "man-hinh-nut.jpg", "size_bytes": 1048576 }`. Lỗi: **400** `INVALID_FILE_TYPE` (chỉ nhận jpg, png, mp4); **413** `FILE_TOO_LARGE` (> 20 MB).  Giới hạn 20 MB và 5 tệp/phiếu là đề xuất của tôi.

#### E7 – `GET /api/issue-categories` (US5)
Response **200**: `[ { "category_id": 3, "category_name": "SAC", "default_priority": "TRUNG_BINH" } ]` (chỉ trả nhóm `is_active = true`). Lỗi: 401, 403.

#### E8 – `GET /api/sla/due-date?priority={priority}` (US6)
Response **200**: `{ "priority": "CAO", "received_at": "2026-10-05T14:30:00+07:00", "due_date": "2026-10-06T14:30:00+07:00" }` (BR2, chỉ tính T2–T7). Lỗi: **400** `INVALID_PRIORITY`; **422** `SLA_NOT_CONFIGURED` (luồng ngoại lệ 5a của UC6).

#### E9 – `POST /api/tickets` (US4, US5, US6, US7)

Request:
```json
{
  "customer_id": "c1024",
  "device_id": "d3311",
  "center_id": "tc02",
  "issue_desc": "Máy sạc không vào, cắm sạc báo lỗi phụ kiện",
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "accessories": ["SAC", "HOP"],
  "attachment_ids": ["a501"]
}
```
Response **201 Created**:
```json
{
  "ticket_id": "t88231",
  "ticket_code": "BH-000231/2026",
  "status": "MOI",
  "category_id": 3,
  "priority": "TRUNG_BINH",
  "warranty_status": "CON_BAO_HANH",
  "is_warranty": true,
  "received_at": "2026-10-05T14:30:00+07:00",
  "due_date": "2026-10-08T14:30:00+07:00",
  "notification_status": "DA_GUI"
}
```
Các response lỗi:
- **400** `VALIDATION_FAILED` – thiếu/sai trường (luồng 3a của UC6).
- **404** `CUSTOMER_NOT_FOUND` hoặc `DEVICE_NOT_FOUND`.
- **409** `DEVICE_HAS_OPEN_TICKET` – thiết bị đang có phiếu chưa đóng.  Quy tắc này lấy từ ví dụ của mẫu, chưa có trong case study; nếu giữ thì cần thêm 1 BR, nếu không thì xóa dòng này.
- **422** `DEVICE_NOT_OWNED` – thiết bị không thuộc khách hàng (BR1/QT-03); **422** `SLA_NOT_CONFIGURED` (luồng 5a).

Ghi chú nghiệp vụ: nếu thiết bị chưa xác minh bảo hành, phiếu vẫn trả **201** với `warranty_status = "CHUA_XAC_MINH"` và `is_warranty = false` (việc phê duyệt nằm ngoài phạm vi L2 – W6; xem luồng 4a). Nếu `notification_status = "CHO_GUI_LAI"` thì phiếu vẫn đã lưu (luồng 7a).

Bảng validation E9:

| Trường | Bắt buộc | Kiểu / ràng buộc | Thông báo lỗi |
| --- | --- | --- | --- |
| customer_id | Có | Phải tồn tại | Không tìm thấy khách hàng |
| device_id | Có | Phải tồn tại và thuộc `customer_id` | Thiết bị không thuộc về khách hàng này |
| center_id | Có | Phải tồn tại, khớp trung tâm của người dùng | Trung tâm không hợp lệ |
| issue_desc | Có | Chuỗi 10–2000 ký tự | Mô tả lỗi phải có từ 10 đến 2000 ký tự |
| category_id | Có | Thuộc `issue_categories` đang dùng | Nhóm sự cố không hợp lệ |
| priority | Có | CAO / TRUNG_BINH / THAP | Mức ưu tiên không hợp lệ |
| accessories | Không | Mảng, mỗi phần tử thuộc SAC / TAI_NGHE / HOP / KHAC | Phụ kiện không hợp lệ |
| attachment_ids | Không | Mảng, mỗi phần tử là `attachment_id` đã tải lên | Tệp đính kèm không tồn tại |

#### E10 – `GET /api/tickets?status=&page=&size=` (US7, US9)
Response **200**: `{ "total": 12, "items": [ { "ticket_code": "BH-000231/2026", "category_name": "SAC", "priority": "TRUNG_BINH", "due_date": "...", "status": "MOI" } ] }`, sắp theo `due_date` tăng dần. Lỗi: **400** `INVALID_STATUS`; **403** nếu truy cập trung tâm khác.

#### E11 – `GET /api/tickets/{ticket_id}/receipt` (US8)
Response **200** `application/pdf`. Lỗi: **404** `TICKET_NOT_FOUND`; **403** FORBIDDEN.

#### E12 – `PUT /api/sla-configs/{priority}` (US9)
Request: `{ "hours": 72 }` (số giờ làm việc, tính T2–T7 theo BR2). Response **200**: `{ "priority": "TRUNG_BINH", "hours": 72, "updated_at": "2026-10-05T15:00:00+07:00" }`. Lỗi: **400** `VALIDATION_FAILED` (`hours` phải là số nguyên từ 1 đến 720 –  ngưỡng 720 là đề xuất); **403** `FORBIDDEN` (không phải Quản lý trung tâm); **404** `PRIORITY_NOT_FOUND` (không thuộc CAO / TRUNG_BINH / THAP).

### 8.6. Tự kiểm hợp đồng API (theo checklist của mẫu)

| Mục tự kiểm | Kết quả |
| --- | --- |
| Mỗi endpoint nối được về ≥ 1 User Story trong bảng truy vết | Đạt (cột FR/US ở mục 8.1) |
| Mỗi endpoint có ≥ 1 response thành công và ≥ 2 response lỗi | Đạt (kể cả 401/403 theo mục 8.2) |
| Mọi trường request đều tồn tại trong mô hình dữ liệu |  Đối chiếu với ERD/schema MongoDB của bạn (đặc biệt `purchase_note`, `notification_status`, `attachment_ids`) |
| Không có endpoint nào không phục vụ US nào | Đạt |
| Quy tắc nghiệp vụ liên quan đã xuất hiện trong validation hoặc mã lỗi | Đạt (BR1, BR2, BR3, BR6, BR8 xuất hiện trong mục 8.4–8.5) |

---

## Phụ lục – Chú thích đề xuất cho Use Case Diagram (đặt trong file .drawio) 

- Nét liền (actor – use case): actor tham gia use case.
- `«include»` (nét đứt, mũi tên về use case được bao gồm): use case gốc luôn gọi use case kia.
- `«extend»` (nét đứt, mũi tên về use case gốc): use case mở rộng chỉ xảy ra trong điều kiện nhất định.
- Khung ngoài: ranh giới hệ thống Smart CRM – Luồng L2.
- Nhãn (USn): User Story mà use case thỏa mãn.

---

## Gợi ý commit

```
docs: add SRS L2 warranty intake (srs.md, usecase.drawio)
```
 Đổi lại cho đúng quy ước commit của học phần (buổi 1 có hướng dẫn quy ước commit).
