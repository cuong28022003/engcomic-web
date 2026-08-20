# Feature Specification: Vocab Vault (Unified Vocabulary Learning System)

> **Perspective**: Frontend Product Owner & UI/UX  
> **Purpose**: Answer the question **"WHAT & WHY"** (UI / UX / Client Requirements)

---

## 1. Overview & Objective
- **Feature ID**: 001
- **Feature Name**: Vocab Vault (Unified Vocabulary Learning System)
- **Priority**: P1
- **Route**: `/vocab`
- **Objective**: Cung cấp giao diện học từ vựng tiếng Anh toàn diện cho người đọc truyện tranh — từ nhập từ vựng hàng loạt từ AI, tra cứu từ liên quan (Word Family, Collocation, Synonym), thu thập từ vựng chờ học (Word Collector), đến hệ thống luyện tập 5 cấp độ (5-stage practice) kết hợp thuật toán lặp lại ngắt quãng (SM-2 Spaced Repetition).

---

## 2. Permissions & Preconditions
- **Target Audience**: `USER` (người dùng đã đăng nhập)
- **Guards**: `authGuard`
- **Preconditions**: Người dùng có JWT token hợp lệ lưu trong localStorage.

---

## 3. UI Screens Overview

### Screen A: Vocab Dashboard (`/vocab`)
- **Stats Bar**: 6 chỉ số (Tổng, Hôm nay, Mới, Đang học, Thành thạo, Khó nhớ).
- **Bộ lọc**: Tìm kiếm từ, lọc theo trạng thái (`new`, `learning`, `mature`, `leech`), lọc theo chủ đề (`topic`).
- **Danh sách thẻ**: Hiển thị `word`, `ipa`, `topic`, `meaning`, `definitionEn`, stage dots (5 chấm tròn), trạng thái và ngày ôn tập tiếp theo.
- **Actions**: Nút "Collector", "Import", "Luyện tập".

### Screen B: Word Detail (`/vocab/word/:id`)
- **Hero Card**: Tên từ lớn, IPA, nút phát âm audio, nghĩa tiếng Việt, định nghĩa tiếng Anh, ghi chú ngữ cảnh (`usageNote`).
- **Ví dụ (Examples)**: Tabs lọc mức độ trang trọng (Tất cả, Trang trọng, Thông thường, Văn viết).
- **Từ liên quan (Relations)**: 3 tabs:
  - Họ từ (Word Family) + từ loại (`n`, `v`, `adj`, `adv`)
  - Cụm từ (Collocations)
  - Đồng nghĩa (Synonyms)
  - Mỗi mục hiển thị chip "Đã học ✓" (click để mở thẻ) hoặc nút "+ Thêm" (thêm vào Collector).
- **Xuất hiện trong (Reverse Relations)**: Danh sách các từ khác có liên kết tới từ này.

### Screen C: Word Collector (`/vocab/collector`)
- **Danh sách từ chờ học**: Thu thập từ nút "+ Thêm" hoặc nhập thủ công.
- **Nguồn gốc**: Hiển thị nguồn gốc (e.g. `← họ từ`, `← cụm từ`).
- **Tạo AI Prompt**: Nút "Tạo AI Prompt" tự động sinh template prompt kèm danh sách từ để copy sang ChatGPT/Claude.

### Screen D: Vocab Import (`/vocab/import`)
- **Step 1 (Dán JSON)**: Ô textarea dán JSON từ AI kèm nút copy prompt mẫu.
- **Step 2 (Xem trước)**: Bảng preview các từ đã parse kèm cảnh báo lỗi/thiếu trường.
- **Step 3 (Kết quả)**: Thống kê số lượng đã import thành công, bỏ qua (trùng), và lỗi.

### Screen E: Practice Session (`/vocab/practice`)
- **Thanh tiến độ**: Tiến độ hoàn thành `X / 15`, thời gian, stage badge.
- **5 Cấp độ bài tập**:
  - Stage 0 (Mới): Lật thẻ xem từ & nghĩa.
  - Stage 1 (Nhận biết): Trắc nghiệm chọn nghĩa tiếng Việt đúng.
  - Stage 2 (Gợi nhớ): Nhập từ tiếng Anh tương ứng với nghĩa tiếng Việt.
  - Stage 3 (Phát âm): Hiển thị IPA và câu ví dụ để tự đánh giá phát âm.
  - Stage 4 (Điền từ): Điền từ còn thiếu vào câu ví dụ thực tế.
- **Feedback Overlay**: Phản hồi tức thì đúng (xanh lá) / sai (đỏ kèm đáp án).
- **Kết quả**: Màn hình tổng kết sau khi hoàn thành buổi học.

---

## 4. Business & UI Invariants
- [x] **Rule 1**: Đồng bộ tên trường: `word` (từ tiếng Anh) và `meaning` (nghĩa tiếng Việt).
- [x] **Rule 2**: Hệ thống thiết kế chuẩn Dark Glassmorphism (`UI_STYLE_GUIDE.md`).
- [x] **Rule 3**: Mọi tương tác bất đồng bộ đều có loading state và fallback gracefully khi lỗi.
