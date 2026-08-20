# Task Breakdown: Vocab Vault (Feature 001)

> **Perspective**: Frontend Developer / AI Agent  
> **Status**: Completed (15/15) ✅

---

## Phase 1: Models & API Services
- [x] **T001**: Cập nhật `Card`, `WordRelation`, `ExampleSentence`, `DashboardResponse`, `BatchImportResult`, `PendingItem` trong `src/app/shared/models/index.ts`.
- [x] **T002**: Bổ sung các phương thức Vocab Vault vào `CardApiService` (`getDashboard`, `getCardDetail`, `getDueCards`, `submitPracticeResult`, `batchImport`).
- [x] **T003**: Tạo mới `PendingItemApiService` trong `src/app/core/services/pending-item-api.service.ts`.

---

## Phase 2: Routing & Scaffold
- [x] **T004**: Khởi tạo `vocab.routes.ts` và đăng ký route `/vocab` vào `app.routes.ts` với `authGuard`.
- [x] **T005**: Scaffold 5 components standalone (`VocabDashboard`, `WordDetail`, `WordCollector`, `VocabImport`, `PracticeSession`).

---

## Phase 3: Dashboard & Word Detail (P1)
- [x] **T006**: Xây dựng `VocabDashboardComponent` — Stats bar (6 chỉ số), bộ lọc tìm kiếm/status/topic, danh sách thẻ với stage dots, phân trang.
- [x] **T007**: Xây dựng `WordDetailComponent` — Hero card, phân loại ví dụ theo formality, tabs từ liên quan (họ từ, cụm từ, đồng nghĩa), nút "+ Thêm" và "Đã học ✓", danh sách reverse relations.

---

## Phase 4: Collector & Batch Import (P1)
- [x] **T008**: Xây dựng `WordCollectorComponent` — Danh sách từ chờ học, thêm thủ công, tạo và copy AI prompt.
- [x] **T009**: Xây dựng `VocabImportComponent` — 3 bước (Dán JSON $\rightarrow$ Parse preview bảng dữ liệu $\rightarrow$ Kết quả import).

---

## Phase 5: Practice Session & Spaced Repetition (P2)
- [x] **T010**: Xây dựng khung `PracticeSessionComponent` với thanh tiến độ, feedback overlay đúng/sai.
- [x] **T011**: Triển khai bài tập Stage 0 (Lật thẻ) và Stage 1 (Trắc nghiệm nghĩa).
- [x] **T012**: Triển khai bài tập Stage 2 (Nhập từ tiếng Anh) và Stage 4 (Điền từ vào câu ví dụ).
- [x] **T013**: Triển khai bài tập Stage 3 (Tự đánh giá phát âm IPA) và màn hình hoàn thành.

---

## Phase 6: Navigation & Polish
- [x] **T014**: Thêm link **🧠 Vocab** vào thanh điều hướng Header (`header.component.ts`).
- [x] **T015**: Đổi toàn bộ thuật ngữ `front`/`back` ➔ `word`/`meaning`, sửa lỗi import Example/Relation và xác thực `ng build` thành công 100%.
