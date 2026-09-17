# Implementation Plan: TOEIC Listening (v1) — Frontend Architect

> **Perspective**: Frontend Architect / Lead Developer  
> **Purpose**: How & architecture. Reuse Reading workspace tối đa, giảm thiểu refactor.

---

## 1. Chiến Lược Tái Sử Dụng

| Thành phần | Quyết định |
|---|---|
| `ReadingSessionComponent` | **Sửa nhẹ**: đọc `test.section`; listening → left pane = `PdfViewer` + `ListeningAudioBar` |
| `PdfViewerComponent` | **Giữ nguyên** (Photo Part 1 + câu hỏi in P3/4 nằm trong PDF) |
| `AnswerSheetComponent` / `QuestionRowComponent` | Sửa nhỏ: `optionCount` (Part 2 = 3), filter tab động theo part |
| `TestTimerService` | Sửa trung bình: bảng part theo `section` |
| `PacingStatusBarComponent` | Sửa nhỏ: lấy range từ bảng part của timer (bỏ hardcode) |
| `PreTestConfigModalComponent` | Sửa nhỏ: nhận `section`, danh sách part + counts theo section |
| `TestSessionService`, `ReaderApiService`, attempt pipeline, review/result | **Giữ nguyên** |
| `ReadingSessionModels` | Mở rộng field (không phá vỡ cũ) |

## 2. Thay Đổi Models (`reader/models/`)

- `test.model.ts`: `ToeicSection`, `AudioJobStatus`, thêm `section`/`audioUrl`/`audioStatus` vào `TestSummary`, `TestDetail`, `CreateTestPayload`; question item thêm `audioStartMs?`, `transcript?`.
- `session.model.ts`: `TimeTargetConfig` thêm `part1_minutes..part4_minutes?`; `PartTiming.part` mở rộng `1|2|3|4|5|6|7`.

## 3. Component Mới: `listening-audio-bar`

```
reader/reading-session/listening-audio-bar/
├── listening-audio-bar.component.ts     ← signals, audio element API
├── listening-audio-bar.component.html
└── listening-audio-bar.component.scss
```

**Inputs (signals)**: `audioUrl?: string`, `questions: TestQuestion[]` (đã có `audioStartMs`), `currentQuestionNumber` (từ answer sheet focus).

**Signal core**:
```ts
readonly isPlaying = signal(false);
readonly currentTime = signal(0);       // tick từ <audio>
readonly duration = signal(0);
readonly playbackRate = signal(1);
readonly activeQuestion = signal<number | null>(null); // câu đang phát (derived)
readonly activeSet = computed<{label: string; startQ: number; endQ: number; startMs: number; endMs: number} | null>(...)
```
**Logic**:
- `segments` = computed từ `questions`: câu có `audioStartMs`; nhóm các câu liên tiếp cùng `audioStartMs` → set (Part 3/4); `endMs` = next distinct start.
- `activeQuestion` thuộc `@input.questions` → `seekTo(qNum)` gọi `audio.currentTime = startMs/1000`.
- `@input.currentQuestionNumber` thay đổi → `seekTo`.
- `seekToSet(set)` từ nhãn set.
- Html: dùng native `<audio #audio [src]="audioUrl" preload="metadata">` + API phía trên (không cần thư viện).

**Giao tiếp với AnswerSheet**: `ReadingSessionComponent` trung gian — `(questionFocused)` từ answer sheet → `audioBar().seekTo(q)`; ngược lại `(activeQuestionChanged)` từ audio bar → answer sheet highlight (truyền `currentQuestionNumber` input).

## 4. Sửa Đổi Có Chủ Đích

### `reading-session.component.*`
- `test.section === 'listening'` → render `.pane-pdf` = `<app-listening-audio-bar>` + `<app-pdf-viewer>`.
- Bind `[audioUrl]="t.audioUrl"`, `[questions]="t.questions"`.
- Thêm `audioBarActiveQuestion` signal truyền xuống answer sheet để highlight câu đang phát.

### `question-row.component.ts/html`
- Input mới `optionCount = input<number>(4)`; template render 3 hoặc 4 nút.
- Đặt `optionCount` từ answer-sheet: `q.part === 2 ? 3 : 4`.

### `answer-sheet.component.ts/html`
- Input `section?: ToeicSection`.
- `filterTab` enum → động: build từ `[...new Set(questions.map(q => q.part))]`, tab labels `P1..P4`.
- Truyền `optionCount` xuống question-row.
- Phát `questionFocused` khi scrollToQuestion (đã có) → cho audio bar seek.

### `test-timer.service.ts`
- `init(config, section)` → bảng part theo section:
  - listening: `{1:[1,6,5], 2:[7,31,8], 3:[32,70,16], 4:[71,100,16]}` (phút)
  - reading: `{5:[101,130,20], 6:[131,146,10], 7:[147,200,45]}` (giữ nguyên hành vi)
- `full_test` → listening 45' tổng; `untimed` → 0.
- `getPartByQuestion` dùng bảng đã config (không hardcode).

### `pacing-status-bar.component.ts`
- Bỏ hardcode `101–130/131–146/147–200`; đọc `timerService.partTimings()` → start/end/remaining.

### `pre-test-config-modal.component.ts`
- Input `section`; Listening hiển thị 4 checkbox (6/25/39/30 câu), time default 5/8/16/16, `full_test`=45'.
- Emit `TimeTargetConfig` đủ `part1..4_minutes`.

### `answer-key.service.ts`
- `getAiParsePrompt(section?)`: 2 biến thể prompt (Reading cũ giữ nguyên, Listening mới với map Part 1–4).
- `parseJson(raw, section?)`: map part theo section; phần tử có thể kèm `audio_start_ms`, `transcript` → giữ nguyên truyền xuống (tương lai dùng cho JSON có sẵn).

## 5. Create-Test Wizard (`/reader/new`)

- `create-test.component.ts/html`: thêm state `section = signal<ToeicSection>('reading')`; Step1 nhận thêm `audioFile` (chỉ khi listening).
- `pdf-upload-step.component`: thêm selector section + uploader audio (hỗ trợ MP3/M4A/WAV, 200MB). Emit `{ testName, pdfFile, pdfUrl, audioFile }`.
- `createTestMultipart(payload, pdfFile, audioFile)` trong `reader-api.service.ts` → FormData thêm `audioFile + requestData.audioUrl` (nếu có audioUrl remote).
- Sau create thành công Listening: bắn `readerApi.transcribeAudio(testId)` (nếu backend chỉ transcribe khi có lệnh) hoặc tin backend tự chạy — chốt theo contract API.

## 6. Dashboard & Review

- Dashboard: dropdown filter section; badge chip; `audioStatus` state chips + nút retry gọi `transcribeAudio(id)`.
- `attempt-review`: nút replay (`seekTo` audio) + panel transcript (nếu `transcript` có, render đúng câu/set); input `audioUrl`, `questions`.
- `session-result`: hiển thị `scaledScore` đã có trong response (rút gọn: không đổi gì về API).

## 7. Verify & Quality Checklist
- `npx ng build --configuration=development` = 0 lỗi.
- Reading cũ chạy nguyên vẹn (không đổi JSON tham số).
- Mobile: listening session vẫn dùng tab `pdf | answers`.
- Test thủ công flow tạo đề Listening → transcribe → làm bài → submit → review có transcript.