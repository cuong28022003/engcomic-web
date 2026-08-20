# Task Breakdown: Word Journey — Frontend Implementation

> **Perspective**: Developer / AI Agent  
> **Purpose**: Answer the question **"EXECUTION & CHECKLIST"**  
> **Instructions for AI**: Execute tasks sequentially. Run `npx ng build --configuration=development` after each Phase to verify before checking `[x]`.

---

## Phase 1: Models & API Service

- [ ] **T001**: Update `shared/models/index.ts` — add new interfaces
  - **Where**: `src/app/shared/models/index.ts`
  - **Add**: `ExerciseResponse`, `ExerciseType`, `ExerciseOption`, `CardBrief`, `SubmitAnswerRequest`, `SubmitAnswerResponse`, `DailyChallenge`
  - **Details**: Exact interface definitions in `plan.md §3`

- [ ] **T002**: Update `CardApiService` — add 7 new methods
  - **Where**: `src/app/core/services/card-api.service.ts`
  - **Add methods**: `getPracticeQueue()`, `getExercise()`, `submitAnswer()`, `getLeechCards()`, `clearLeech()`, `getDailyChallenge()`, `updateConfidence()`
  - **Details**: Exact signatures in `plan.md §4`

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 2: Shared Stage Progress Component

- [ ] **T003**: Create `StageProgressComponent`
  - **Where**: `src/app/shared/components/stage-progress/`
  - **Files**: `stage-progress.component.ts`, `.html`, `.scss`
  - **Input**: `@Input() currentStage: number` (0–6)
  - **HTML**: 7 dots in a row; dot class logic:
    - `completed` if index < currentStage
    - `current` (pulse ring) if index === currentStage
    - `locked` if index > currentStage
  - **Tooltip**: `title="{{ STAGE_NAMES[i] }}"` on each dot
  - **STAGE_NAMES array**:
    ```typescript
    ['Chưa học', 'Nhận diện', 'Ngữ cảnh & sắc thái',
     'Phát âm', 'Sản sinh có hỗ trợ', 'Sản sinh tự do', 'Ứng dụng thực tế']
    ```
  - **SCSS**: dots are 12px circles, `gap: 8px`; completed = primary color fill; current = pulse animation; locked = gray border only

- [ ] **T004**: Export `StageProgressComponent` from `SharedModule` or make it standalone and add to `imports` array of exercise components

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 3: Exercise Sub-Components

> All exercise components are **standalone**, import `CommonModule` and `FormsModule`. They `@Input() exercise: ExerciseResponse` and `@Output() answered = new EventEmitter<{quality: number, answerText?: string, confidenceScore?: number}>()`.

- [ ] **T005**: Create `FlashcardExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/flashcard/`
  - **UI**: Two-sided card with flip animation (CSS `transform: rotateY(180deg)` on click)
    - Front: `target.word` + IPA + audio play button
    - Back: `target.meaning` + first example sentence
  - **Output**: On user clicks "Nhớ 👍" → emit `{quality: 4}`; "Không nhớ 👎" → emit `{quality: 1}`

- [ ] **T006**: Create `MultipleChoiceExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/multiple-choice/`
  - **UI**: Question text + 4 option buttons
  - **Behavior**:
    - On click option: mark selected, show ✓ on correct / ✗ on wrong option (with color)
    - Show "Tiếp theo" button after selection
    - Emit `{quality: isCorrect ? 4 : 1}` on "Tiếp theo"
  - **Handles types**: `multiple_choice_meaning` and `audio_choice`
    - For `audio_choice`: show audio play button at top, then 4 options of word text

- [ ] **T007**: Create `CollocationFillExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/collocation-fill/`
  - **UI**: Sentence with `___` shown; text input below
  - **Behavior**: On submit, compare input to `exercise.answer` (case-insensitive trim)
  - **Emit**: `{quality: isCorrect ? 4 : 1}`

- [ ] **T008**: Create `FillBlankExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/fill-blank/`
  - **UI**: Sentence with blank shown prominently; input field below; hint button (shows first letter)
  - **Behavior**: `exercise.sentence` has `_____` placeholder; compare input to `exercise.answer`
  - **Emit**: `{quality: isCorrect ? 4 : 1, answerText: userInput}`

- [ ] **T009**: Create `WordOrderExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/word-order/`
  - **UI**: Two zones:
    - **Source zone**: shuffled word tiles (from `exercise.shuffledWords`), tap to move to answer zone
    - **Answer zone**: user's assembled words, tap to move back to source
  - **Behavior**: On submit, join answer zone words with space, compare to `exercise.answer`
  - **Emit**: `{quality: isCorrect ? 4 : 1}`

- [ ] **T010**: Create `PronunciationExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/pronunciation/`
  - **UI**:
    - Audio player (HTML5 audio element with `exercise.target.audio` src)
    - Example sentence to read
    - [🎙 Ghi âm] button → toggles Web Speech API recognition
    - After recognition: show recognized text vs target sentence
    - Star rating 1–5 (self-rate)
    - [Skip] button always visible
  - **Skip behavior**: if `exercise.skip === true`, auto-show skip message and emit `{quality: 3}`
  - **Emit**: `{quality: stars - 1, confidenceScore: stars}`
  - **Web Speech API**:
    ```typescript
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Show note if SpeechRecognition is undefined: "Trình duyệt chưa hỗ trợ ghi âm"
    ```

- [ ] **T011**: Create `FreeWriteExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/free-write/`
  - **UI**:
    - Large textarea: "Viết 1 câu dùng từ '{word}'..."
    - Self-check checklist (3 items, checkboxes):
      - "Câu chứa từ mục tiêu"
      - "Ngữ pháp cơ bản đúng"
      - "Câu nghe tự nhiên"
    - Example sentences panel (collapsed by default, toggle "Xem ví dụ mẫu")
    - Star rating 1–5 after checklist
  - **Emit**: `{quality: stars - 1, answerText: textarea, confidenceScore: stars}`

- [ ] **T012**: Create `SituationalRecallExerciseComponent`
  - **Path**: `features/vocab/practice/exercises/situational-recall/`
  - **UI**:
    - Situation scenario card (blue gradient background)
    - Target word chip + related words chips
    - Textarea: "Viết phản hồi hoặc câu của bạn..."
    - Star rating 1–5 confidence
    - "Tiếp theo" button
  - **Handles types**: `situational_recall`, `role_play_mcq`, `conversation_chain`
  - **Emit**: `{quality: stars - 1, answerText: textarea, confidenceScore: stars}`

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 4: Main Practice Component (Rewrite)

- [ ] **T013**: Rewrite `PracticeComponent`
  - **Where**: `src/app/features/vocab/practice/practice.component.ts` (and `.html`, `.scss`)
  - **State machine** (see `plan.md §5`):
    - `phase`: `'loading' | 'exercise' | 'result' | 'empty'`
    - `queue: Card[]` — loaded on init
    - `currentCard: Card | null`
    - `currentExercise: ExerciseResponse | null`
    - `resultState: 'correct' | 'wrong' | 'self_check' | null`
    - `stageAdvancedTo: number | null`
    - `remainingCount: number`
  - **Init**:
    ```typescript
    ngOnInit() {
      this.cardApi.getPracticeQueue().subscribe(queue => {
        this.queue = queue;
        if (queue.length === 0) { this.phase = 'empty'; return; }
        this.loadNextExercise();
      });
    }
    ```
  - **loadNextExercise()**:
    ```typescript
    this.currentCard = this.queue[this.currentIndex];
    this.cardApi.getExercise(this.currentCard.id).subscribe(exercise => {
      this.currentExercise = exercise;
      this.phase = 'exercise';
    });
    ```
  - **onAnswer(event)**: POST submit → show result → wait 1.5s → next card
  - **Template**: `@switch` dispatch + result overlay + stage advance banner
  - **Stage progress**: `<app-stage-progress [currentStage]="currentCard.stage" />`
  - **Header**: "X từ còn lại hôm nay" countdown

- [ ] **T014**: Add result overlay animations in SCSS
  - Correct: `@keyframes correctFlash` — green bg, scale from 0.9 to 1.0
  - Wrong: `@keyframes wrongShake` — red bg, horizontal shake
  - Stage advance: `@keyframes stageBurst` — gold gradient, scale up + fade out

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 5: Leech Center Screen

- [ ] **T015**: Create `LeechComponent`
  - **Where**: `src/app/features/vocab/leech/`
  - **Files**: `.ts`, `.html`, `.scss`
  - **Init**: `GET /api/card/leech` → populate `leechCards`
  - **Per card**: show word, meaning, wrongCount badge, personalNote, textarea for memory tip, "Ôn lại từ Stage 1" button
  - **clearLeech(card)**: POST `/api/card/{id}/clear-leech` → remove from list
  - **Empty state**: illustration + "Tuyệt vời! Không có từ bị leech 🎉"

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 6: Daily Challenge Screen

- [ ] **T016**: Create `DailyChallengeComponent`
  - **Where**: `src/app/features/vocab/daily-challenge/`
  - **Files**: `.ts`, `.html`, `.scss`
  - **Init**: `GET /api/card/daily-challenge`
    - If 204 or empty: show locked state
  - **UI**: Swipeable challenge cards (use CSS scroll snap or simple prev/next buttons)
  - **Per challenge card**: situation text, target word chip, related word chips, textarea, star rating
  - **Submit all**: POST `/api/card/{id}/confidence` for each card that has a rating
  - **Summary**: "Bạn đã luyện tập X từ hôm nay! 🌟"
  - **No mature cards**: "Học thêm từ để mở khóa tính năng này 🔒" with link to dashboard

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 7: Routing & Navigation

- [ ] **T017**: Update `vocab.routes.ts` — add new routes
  - Add `{ path: 'leech', component: LeechComponent }`
  - Add `{ path: 'daily-challenge', component: DailyChallengeComponent }`
  - **Important**: Remove or rename old `practice-session` route if it existed; the new route is just `practice`

- [ ] **T018**: Update `VocabDashboardComponent` — add 2 new buttons
  - Add **"🌍 Daily Life Challenge"** button: `[routerLink]="['/vocab/daily-challenge']"` + `[disabled]="stats.matureCount === 0"`
  - Add **"⚠️ Leech Center"** link with badge: `[routerLink]="['/vocab/leech']"` + badge showing `stats.leechCount` (only show badge if > 0)

### ⚙ Checkpoint: `npx ng build --configuration=development`

---

## Phase 8: Final QA

- [ ] **T019**: End-to-end manual test
  - Navigate `/vocab/practice`: verify queue, flashcard flip, MCQ 4 options, result overlays
  - Submit correct answers → verify stage advance banner appears
  - Navigate `/vocab/leech`: verify empty state message
  - Navigate `/vocab/daily-challenge`: verify locked state (no mature cards)
  - Verify stage progress dots render (0–6 range)
  - Verify pronunciation component shows "Trình duyệt chưa hỗ trợ ghi âm" when unsupported

- [ ] **T020**: Update `BACKEND_CONTRACT.md` in project root
  - Document all new endpoints used by frontend
  - Note: `GET /daily-challenge` may return 204 → handle `null` body
  - Note: `GET /{id}/exercise` returns 403 if stage 6 requires mature but card is not mature
