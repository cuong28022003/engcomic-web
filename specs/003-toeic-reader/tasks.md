# Task Checklist: TOEIC Reader Frontend (v4)

> **Feature ID**: 003  
> **Trạng thái**: Hoàn thành & Đã kiểm thử

---

- [x] **Task 1: Tạo đề thi & Upload PDF**
  - [x] Tạo `CreateTestComponent` với stepper upload PDF và answer keys.
  - [x] Chuyển hướng về `/reader` kèm Toast notification sau khi tạo thành công.

- [x] **Task 2: Phòng thi Split-Screen PDF**
  - [x] Tạo `ReadingSessionComponent` với layout 2 cột: PDF Viewer + Bubble Sheet.
  - [x] Tích hợp Pacing Timer và chức năng đánh cờ câu hỏi (`flagged`).
  - [x] Modal xác nhận khi bấm Nộp bài (Confirm Dialog).
  - [x] Fullscreen Loading indicator khi đang nộp bài.

- [x] **Task 3: Lịch sử làm bài theo Session**
  - [x] Tạo `AttemptHistoryModalComponent` xem các lượt thi theo `attemptId`.
  - [x] Hiển thị nút "Bắt đầu làm bài" cho đề mới và "Làm lại" / "Lịch sử bài làm" cho đề đã làm.

- [x] **Task 4: Màn hình Xem lại bài làm (Attempt Review)**
  - [x] Tạo `AttemptReviewComponent` giữ PDF bên phải để so sánh Part 7 và ảnh Part 6.
  - [x] Phân biệt màu sắc: 🟢 Xanh lá (Đúng), 🔴 Đỏ cam (Sai), 🟡 Vàng (Đánh cờ).
  - [x] Nút "Quay lại danh sách đề thi".
  - [x] Helper `isAnswerCorrect()` kiểm tra boolean và chuỗi chữ hoa chống lỗi serialization.

- [x] **Task 5: Hàng đợi lỗi sai (Mistake Queue) & AI Review**
  - [x] Tự động đẩy câu sai vào Mistake Queue sau khi nộp bài.
  - [x] Nút trích xuất System Prompt cho ChatGPT/Claude.
  - [x] Modal import JSON lời giải AI kèm Loading indicator và Toast thông báo.
  - [x] Đồng bộ lời giải AI trực tiếp vào từng câu hỏi của session làm bài mà không tạo bản ghi trùng lặp.

- [x] **Task 6: Kiểm tra biên dịch & Chuẩn hóa**
  - [x] Chạy `npx ng build --configuration=development` ➔ **0 errors**.
