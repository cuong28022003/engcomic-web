# Tasks: TOEIC Reader — Frontend (003, v2)

> Simplified: PDF display-only, JSON-driven answer sheet.

---

## Phase 1: Foundation

- [ ] Tạo `reader.module.ts` + `reader-routing.module.ts`
- [ ] Tạo models: `TestSummary`, `TestDetail`, `UserAnswer`, `GradedResult`, `SessionResult`, `Mistake`, `AnswerKeyImportJson`
- [ ] Tạo `AnswerKeyService` — parseJson(), validate()
- [ ] Tạo `GradingService` — grade(), buildResult(), buildMistakes() (pure, unit-testable)
- [ ] Tạo `MistakeQueueService` — BehaviorSubject + localStorage + generateAiPrompt()
- [ ] Tạo `ReaderApiService` — mock data
- [ ] Register lazy route `/reader` trong `app-routing.module.ts`
- [ ] Verify `SafePipe` trong Shared hỗ trợ `resourceUrl` type (cho iframe PDF)

## Phase 2: Create Test Wizard

- [ ] `PdfUploadStepComponent` — dropzone, preview tên file, emit File
- [ ] `AnswerKeyStepComponent` — textarea paste JSON, parse, bảng preview, emit questions[]
- [ ] `CreateTestComponent` — stepper 2 bước, submit FormData lên backend

## Phase 3: Reading Session (Core)

- [ ] `PdfViewerComponent` — `<iframe [src]="pdfUrl | safe">` + controls zoom/page (optional)
- [ ] `QuestionRowComponent` — dumb: hiển thị số câu + 4 radio + flag button, emit selected/flagged
- [ ] `AnswerSheetComponent`:
  - [ ] Init userAnswers map từ localStorage (restore khi F5)
  - [ ] Auto-save vào localStorage khi chọn đáp án
  - [ ] Progress indicator "X/Y đã trả lời"
  - [ ] Jump grid (mini số câu để scroll nhanh)
  - [ ] Submit → confirm dialog → emit answers + duration
  - [ ] Post-submit: lock + hiển thị state correct/wrong
- [ ] `ReadingSessionComponent` — load TestDetail, orchestrate PDF + AnswerSheet, gọi submit API, gọi GradingService, push mistakes

## Phase 4: Result & Mistake Queue

- [ ] `SessionResultComponent` — score card, part breakdown table, danh sách câu sai
- [ ] `MistakeItemComponent` — dumb, expand row khi click
- [ ] `AiPromptBuilderComponent` — generate prompt từ mistakes[], copy clipboard
- [ ] `MistakeQueueComponent` — filter tabs, danh sách nhóm theo ngày, textarea AI explanation

## Phase 5: Integration & Polish

- [x] Thay `ReaderApiService` mock bằng backend thực
- [x] Nav badge: inject `MistakeQueueService.getPendingCount()` vào nav component
- [x] Mobile responsive: PDF panel + Answer panel → tabs
- [x] Loading state (`<app-loading>`) và Error state (`<app-error-state>`)
- [x] Unit test & verify build 0 errors

## Phase 6: Pacing Timer, Part-Practice & Shared Components (v4 Extension)

- [x] Xây dựng `TestTimerService` (Angular 21 Signals, Zoneless) quản lý thời gian 3 tầng và tính toán `pacingStatus` (ahead, on_track, behind).
- [x] Xây dựng `PreTestConfigModalComponent` (`app-modal`) chọn phạm vi Part 5/6/7 và tùy chỉnh giờ mục tiêu với tính năng ghi nhớ mặc định (`localStorage`).
- [x] Xây dựng `PacingStatusBarComponent` hiển thị 2 thanh Progress bar so sánh thời gian vs tiến độ câu hỏi theo Part.
- [x] Cập nhật `AnswerSheetComponent` và `ReadingSessionComponent` lọc và hiển thị chính xác các câu hỏi thuộc `selectedParts`.
- [x] Nâng cấp `PaginatorComponent` (`@shared/components/paginator`) chuẩn Signals với dropdown page size và ô nhảy trang trực tiếp trong Mistake Queue (`/reader/mistakes`).
- [x] Tích hợp `WordLookupPopupComponent` tra từ điển Google Translate tức thì khi bôi đen chữ trong PDF.
- [x] Cập nhật `SessionResultComponent` hiển thị phân tích thời gian theo từng Part và cảnh báo câu hỏi mất nhiều thời gian.
- [x] Biên dịch `npx ng build --configuration=development` đạt 0 errors.
