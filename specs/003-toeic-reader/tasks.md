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

- [ ] Thay `ReaderApiService` mock bằng backend thực
- [ ] Nav badge: inject `MistakeQueueService.getPendingCount()` vào nav component
- [ ] Mobile responsive: PDF panel + Answer panel → tabs
- [ ] Timer (đếm ngược) — optional, có thể skip cho MVP
- [ ] Loading skeleton cho AnswerSheet khi load test
- [ ] Error state + retry
- [ ] Unit test `GradingService.grade()` với các edge case (unanswered → wrong)
- [ ] Unit test `AnswerKeyService.parseJson()` — valid/invalid/partial JSON

