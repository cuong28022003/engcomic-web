# Task Breakdown: TOEIC Listening (v1) — Frontend

> **Perspective**: Frontend Developer / AI Agent  
> **Purpose**: EXECUTION & CHECKLIST  
> **Instructions**: Chạy từng phase tuần tự. Sau mỗi phase chạy `npx ng build --configuration=development` trước khi tick.

---

## Phase 1: Models, Service Layer
- [ ] **T-lis-001**: `reader/models/test.model.ts` — thêm `ToeicSection`, `AudioJobStatus`; `TestSummary`/`TestDetail`/`CreateTestPayload` thêm `section`, `audioUrl`, `audioStatus`; question item thêm `audioStartMs?`, `transcript?`.
- [ ] **T-lis-002**: `reader/models/session.model.ts` — `TimeTargetConfig` thêm `part1..4_minutes?`; `PartTiming.part` mở rộng `1|2|3|4|5|6|7`.
- [ ] **T-lis-003**: `reader-api.service.ts` — multipart nhận thêm `audioFile`; thêm `transcribeAudio(testId)` → `POST /toeic/tests/{id}/transcribe`.

## Phase 2: Component Mới — Listening Audio Bar
- [ ] **T-lis-004**: Scaffold `reading-session/listening-audio-bar/` (ts/html/scss, standalone).
- [ ] **T-lis-005**: Audio element + play/pause/replay/slider/speed; segments computed từ `audioStartMs`; `seekTo(questionNumber)`; `activeSet` label.
- [ ] **T-lis-006**: Đẩy `activeQuestion` ra `output` + nhận `currentQuestionNumber` input để seek.

## Phase 3: Session Integration
- [ ] **T-lis-007**: `reading-session.component.*` — đọc `test.section`; listening → render audio bar + pdf trong pane trái; bind audioUrl/questions.
- [ ] **T-lis-008**: `answer-sheet.component.*` — input `section`; filter tab động theo part; `optionCount=3` cho Part 2; phát `questionFocused` lên audio bar; nhận highlight câu đang phát.
- [ ] **T-lis-009**: `question-row.component.*` — input `optionCount`; render 3 hoặc 4 bubble.

## Phase 4: Timer & Pacing Generalization
- [ ] **T-lis-010**: `test-timer.service.ts` — `init(config, section)`; bảng part listening `{1:[1,6,5],2:[7,31,8],3:[32,70,16],4:[71,100,16]}`; `getPartByQuestion` theo bảng.
- [ ] **T-lis-011**: `pacing-status-bar.component.ts` — lấy range từ `partTimings()` thay hardcode.
- [ ] **T-lis-012**: `pre-test-config-modal.component.ts` — input section; Listening: 4 part 6/25/39/30 câu, default 5/8/16/16 phút, full_test=45'.

## Phase 5: Wizard & Dashboard
- [ ] **T-lis-013**: `create-test.component` + `pdf-upload-step` — selector section; uploader audio (MP3/M4A/WAV, 200MB); emit `{...}, audioFile`.
- [ ] **T-lis-014**: `answer-key.service.ts` — prompt + `parseJson(section?)` theo Listening map; giữ comment về `audio_start_ms`/`transcript`.
- [ ] **T-lis-015**: Dashboard — tab lọc Tất cả/Nghe/Đọc; badge section; chip `audioStatus` (processing/done/failed + nút retry → `transcribeAudio`).

## Phase 6: Review & Result
- [ ] **T-lis-016**: `attempt-review` — nút replay audio theo câu, panel transcript (tự cuộn theo câu chọn).
- [ ] **T-lis-017**: `session-result` — hiển thị score/scaled đúng section; không đổi API.
- [ ] **T-lis-018**: Full build `npx ng build --configuration=development` (0 lỗi) + verify Reading cũ không đổi hành vi.

## Phase 7: Verification (manual, khi backend sẵn)
- [ ] **T-lis-019**: E2E: tạo đề Listening (PDF + audio) → chờ transcribe → làm bài → submit → result → review + transcript + replay.
- [ ] **T-lis-020**: Kiểm tra Range/seek trên `<audio>`; mode degrade khi audioStatus != done.