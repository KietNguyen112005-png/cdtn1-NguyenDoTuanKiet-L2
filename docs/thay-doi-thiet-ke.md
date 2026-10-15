# Thay đổi thiết kế sau góp ý của giảng viên

Mỗi điểm góp ý gồm đúng bốn dòng: **Góp ý**, **Nguyên nhân**, **Đã sửa**, **Commit**.

## 1. Số lượng User Story (đề yêu cầu 5–7, bài có 9)

- **Góp ý:** SRS có 9 User Story, vượt mức 5–7; gợi ý gộp US8, US9 hoặc chuyển xuống WON'T.
- **Nguyên nhân:** mỗi chức năng nhỏ được tách thành một story riêng (mô tả lỗi, nhóm sự cố, tính SLA tách khỏi story cha).
- **Đã sửa:** gộp US3+US4 thành US3 (thêm AC3), US5+US6 thành US4, đổi US7–US9 thành US5–US7; cập nhật bảng truy vết, bảng use case, đặc tả UC6, bảng index, bảng wireframe và Lịch sử thay đổi (phiên bản 1.2).
- **Commit:** `docs(srs): gộp 9 User Story còn 7, cập nhật bảng truy vết`

## 2. DDL trong báo cáo chỉ trích 3/6 bảng

- **Góp ý:** phần SQL DDL ở Mục 4 chỉ có customer, device, ticket; thiếu sla_config, issue_category, ticket_status_log.
- **Nguyên nhân:** báo cáo để dạng skeleton "trích các bảng cốt lõi", không khớp với docs/schema.sql có đủ 6 bảng.
- **Đã sửa:** thay bằng DDL đầy đủ 6 bảng, 4 index và dữ liệu mẫu, sao nguyên văn từ schema.sql; đổi tiêu đề thành "SQL DDL đầy đủ 6 bảng".
- **Commit:** `docs(erd): thay DDL skeleton bằng DDL đầy đủ 6 bảng trong báo cáo`
## 3. Repo thiếu file và sai tên file so với bài ghi

- **Góp ý:** repo không có docs/schema.sql và docs/wireframe.drawio; file use case tên UseCaseDiagram.drawio, không phải usecase.drawio như bài ghi.
- **Nguyên nhân:** các file chưa được đưa lên repo, và tên file trong báo cáo không đồng nhất với tên file thật.
- **Đã sửa:** thêm docs/schema.sql và docs/wireframe.drawio vào repo; thống nhất dùng tên docs/UseCaseDiagram.drawio ở mọi nơi nhắc tới (báo cáo, README, ai-disclosure.md).
- **Commit:** `docs(erd): thêm docs/schema.sql` · `docs(wireframe): thêm docs/wireframe.drawio` · `docs(usecase): thống nhất tên file UseCaseDiagram.drawio` 

## 4. Trang bìa và dòng cam kết

- **Góp ý:** bìa ghi chữ "REPO GITHUB" thay vì URL repo, thiếu ngày nộp; dòng cam kết ghi sai MSSV (23740802010260).
- **Nguyên nhân:** để chữ giữ chỗ cho liên kết, chưa điền ngày nộp, và chưa đối chiếu MSSV với thẻ sinh viên.
- **Đã sửa:** thay "REPO GITHUB" bằng URL đầy đủ `https://github.com/<tài-khoản>/<tên-repo>`; thêm ngày nộp trên bìa và điền ô "Ngày nộp" ở dòng cam kết; sửa MSSV ở bìa và dòng cam kết cho giống thẻ sinh viên.
- **Commit:** `docs(report): ghi URL repo, ngày nộp và sửa MSSV ở bìa và dòng cam kết`

## 5. Lịch sử commit chưa đúng quy ước

- **Góp ý:** nhiều commit dạng "Add files via upload", "Update ai-disclosure.md"; nên commit bằng Git với message kiểu `docs(erd): ...`.
- **Nguyên nhân:** tải file lên bằng giao diện web GitHub nên message do GitHub tự sinh, không mô tả nội dung thay đổi.
- **Đã sửa:** từ nay làm việc bằng Git trên máy (`git add`, `git commit`, `git push`), mỗi commit một thay đổi, message theo mẫu `loại(phạm-vi): mô tả ngắn`, ví dụ `docs(srs)`, `docs(erd)`, `docs(wireframe)`, `docs(ai)`.
- **Commit:** `docs(design): them file thay-doi-thiet-ke.md`
