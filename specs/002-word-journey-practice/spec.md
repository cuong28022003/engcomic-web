# Feature Specification: Word Journey — 4-Level Practice UI (v3)

> **Perspective**: Frontend Product Owner & UI/UX  
> **Purpose**: Answer the question **"WHAT & WHY"** (Angular 21 Workspace, 4-Level Dumb Exercises, AI Import Bridge)  
> **Feature ID**: 002  
> **Version**: v3 — AI Prompt & JSON Import + 4-Level Mastery UI

---

## 1. Overview & UI Architecture

- **Feature ID**: 002
- **Feature Name**: Word Journey — 4-Level Practice UI
- **Route**: `/vocab/practice`
- **Objective**: Không gian luyện tập từ vựng tương tác cao với phản hồi Đúng/Sai tức thì, kết nối với ngân hàng bài tập AI:
  - Header với thanh tiến trình tổng số từ và Level Stepper (4 dots).
  - 4 Component bài tập chuyên biệt cho từng Level.
  - 2 Modal AI Bridge: Trích xuất System Prompt cho ChatGPT/Claude và Import JSON bài tập.
  - Trung tâm cứu hộ từ vựng Leech Center (`/vocab/leech`).

---

## 2. Các Màn Hình & Thành Phần UI

### 2.1 Phòng Luyện Tập (`/vocab/practice`)
- **Level Indicator**: Thanh 4 nốt tròn hiển thị cấp độ hiện tại của từ với vòng tròn phát sáng (`Level 1` ➔ `Level 4`).
- **Khung Bài Tập**:
  - `Level 1`: Trắc nghiệm 4 đáp án (MCQ) với phản hồi xanh (đúng) / đỏ (sai).
  - `Level 2`: Điền từ vào câu ngữ cảnh + Gợi ý Collocation.
  - `Level 3`: Các thẻ từ đảo trật tự (Word Ordering Tiles) hỗ trợ click hoặc kéo thả.
  - `Level 4`: Khung tình huống thực tế + Thang đánh giá mức độ tự tin 1–5 sao.
- **Nộp & Phản hồi**: Chấm điểm tự động tức thì (Level 1, 2, 3) và cập nhật tiến độ SRS.

### 2.2 Modal AI Bridge
- `PracticePromptModalComponent`: Hiển thị Prompt mẫu, nút 1-Click Copy to Clipboard.
- `PracticeImportModalComponent`: Textarea dán JSON, kiểm tra lỗi cú pháp, gọi API import kèm Loading & Toast.

### 2.3 Leech Center (`/vocab/leech`)
- Danh sách từ làm sai liên tiếp ≥ 4 lần.
- Input nhập mẹo ghi nhớ và nút đưa từ trở lại Level 1.
