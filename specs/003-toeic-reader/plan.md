# Implementation Plan: TOEIC Reader â€” Frontend (v2)

> **Perspective**: Frontend Developer  
> **Purpose**: Answer the question **"HOW"** (Technical Architecture & Implementation)
> **Version**: v3 -- AI Parse Prompt added to Create Test Wizard (Step 2)

---

## 1. Dependencies & Prerequisites

- Shared Module pháº£i cÃ³: `SafePipe`, `ConfirmDialogComponent`, `EmptyStateComponent`, `TimeAgoPipe`, `ClickOutsideDirective`.
- Backend Feature 003 API pháº£i available (tests CRUD, submit, mistakes CRUD).
- KhÃ´ng cáº§n thÆ° viá»‡n PDF Ä‘áº·c biá»‡t cho MVP (dÃ¹ng `<iframe>`).

---

## 2. Module Setup

```typescript
// app-routing.module.ts â€” lazy load
{
  path: 'reader',
  loadChildren: () => import('./features/reader/reader.module').then(m => m.ReaderModule),
  canActivate: [authGuard]
}
```

**Routes ná»™i bá»™:**
| Path | Component |
|:---|:---|
| `/reader` | `ReaderDashboardComponent` |
| `/reader/new` | `CreateTestComponent` |
| `/reader/mistakes` | `MistakeQueueComponent` |
| `/reader/:testId` | `ReadingSessionComponent` |
| `/reader/:testId/result` | `SessionResultComponent` |

---

## 3. Data Models (Frontend DTOs)

```typescript
// models/test.model.ts

export interface TestSummary {
  id: string;
  testName: string;
  pdfFileRef: string;           // URL Ä‘á»ƒ load vÃ o iframe
  questionCount: number;
  rawScore?: number;
  scaledScore?: number;
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: Date;
}

export interface AnswerKeyQuestion {
  number: number;               // 101-200
  part: 5 | 6 | 7;
  correctAnswer: 'A' | 'B' | 'C' | 'D';  // hidden until submit
}

export interface TestDetail {
  id: string;
  testName: string;
  pdfFileRef: string;
  questions: Array<{ number: number; part: 5 | 6 | 7 }>;  // NO correctAnswer
}

// models/session.model.ts

export interface UserAnswer {
  questionNumber: number;
  answer: 'A' | 'B' | 'C' | 'D' | null;
  flagged: boolean;
}

export interface GradedResult {
  questionNumber: number;
  part: 5 | 6 | 7;
  userAnswer: 'A' | 'B' | 'C' | 'D' | null;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
}

export interface SessionResult {
  testId: string;
  testName: string;
  rawScore: number;
  scaledScore?: number;
  totalQuestions: number;
  duration: number;             // seconds
  results: GradedResult[];
  partBreakdown: { part: number; correct: number; total: number }[];
}

// models/mistake.model.ts

export interface Mistake {
  id: string;
  testId: string;
  testName: string;
  questionNumber: number;
  part: number;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  status: 'pending' | 'explained' | 'resolved';
  createdAt: Date;
}

// models/answer-key-import.model.ts

export interface AnswerKeyImportJson {
  test_name: string;
  questions: Array<{
    number: number;
    part: 5 | 6 | 7;
    correct_answer: 'A' | 'B' | 'C' | 'D';
  }>;
}

export interface AnswerKeyParseResult {
  valid: boolean;
  questions: AnswerKeyImportJson['questions'];
  errors: string[];
}
```

---

## 4. Services

### 4.1 `AnswerKeyService` â€” Parse & Validate JSON
```typescript
parseJson(raw: string): AnswerKeyParseResult {
  // 1. Strip markdown fences: raw.replace(/```json|```/g, '').trim()
  // 2. JSON.parse()
  // 3. Validate: máº£ng questions, má»—i item cÃ³ number (101-200), part (5/6/7), correct_answer (A/B/C/D)
  // 4. Return { valid, questions, errors[] }
}
```

### 4.2 `GradingService` â€” Pure Logic
```typescript
grade(userAnswers: UserAnswer[], questions: AnswerKeyQuestion[]): GradedResult[]
buildResult(results: GradedResult[], testId: string, duration: number): SessionResult
buildMistakes(results: GradedResult[], testId: string, testName: string): Mistake[]
```

### 4.3 `MistakeQueueService` â€” App-wide State
```typescript
// BehaviorSubject<Mistake[]>
// localStorage key: 'reader_mistake_queue'

pushMistakes(mistakes: Mistake[]): void
updateMistake(id: string, patch: Partial<Mistake>): void
resolve(id: string): void
getPendingCount(): Observable<number>
generateAiPrompt(mistakes: Mistake[]): string
// Prompt template:
// "TÃ´i lÃ m bÃ i TOEIC vÃ  cÃ³ cÃ¡c cÃ¢u sau bá»‹ sai:\n
//  - BÃ i [testName], CÃ¢u [number] (Part [part]): TÃ´i chá»n [userAnswer], Ä‘Ã¡p Ã¡n Ä‘Ãºng lÃ  [correctAnswer]
//  HÃ£y giáº£i thÃ­ch vÃ¬ sao cÃ¢u tráº£ lá»i Ä‘Ãºng lÃ  Ä‘Ãºng, vÃ  tÃ´i cÃ³ thá»ƒ ghi nhá»› nhÆ° tháº¿ nÃ o?"
```

### 4.4 `ReaderApiService` â€” HTTP
```typescript
getTests(): Observable<TestSummary[]>
getTestDetail(id: string): Observable<TestDetail>
createTest(formData: FormData): Observable<TestSummary>     // upload PDF + metadata
submitSession(testId: string, req: SubmitRequest): Observable<SessionResult>
getMistakes(filter?: string): Observable<Mistake[]>
createMistakesBatch(mistakes: Mistake[]): Observable<Mistake[]>
updateMistake(id: string, patch: UpdateMistakeRequest): Observable<Mistake>
```

---

## 5. Auto-Save Logic (localStorage)

Khi user chá»n Ä‘Ã¡p Ã¡n â†’ lÆ°u ngay vÃ o localStorage Ä‘á»ƒ trÃ¡nh máº¥t khi F5:

```typescript
// answer-sheet.component.ts
readonly STORAGE_KEY = (testId: string) => `reader_session_${testId}`;

saveAnswer(questionNumber: number, answer: string) {
  this.userAnswers[questionNumber] = answer;
  localStorage.setItem(this.STORAGE_KEY(this.testId),
    JSON.stringify(this.userAnswers));
}

restoreAnswers() {
  const saved = localStorage.getItem(this.STORAGE_KEY(this.testId));
  if (saved) this.userAnswers = JSON.parse(saved);
}
```

---

## 6. PDF Viewer â€” Phase 1 (iframe)

```typescript
// pdf-viewer.component.ts
@Input() pdfUrl: string;

// Template
// <iframe [src]="pdfUrl | safe" ...></iframe>
// SafePipe Ä‘Ã£ cÃ³ trong Shared module
```

Cáº§n add `SafePipe` support cho `resourceUrl` type:
```typescript
// safe.pipe.ts (update náº¿u chÆ°a cÃ³)
transform(value: string, type: 'html' | 'url' | 'resourceUrl' = 'url')
```

---

## 7. Implementation Order (Phases)

### Phase 1: Foundation
- [ ] Táº¡o `reader.module.ts` + `reader-routing.module.ts`
- [ ] Táº¡o táº¥t cáº£ models/DTOs
- [ ] Táº¡o `AnswerKeyService` (parse + validate JSON)
- [ ] Táº¡o `GradingService` (pure functions, dá»… unit test)
- [ ] Táº¡o `MistakeQueueService` (BehaviorSubject + localStorage)
- [ ] Táº¡o `ReaderApiService` (mock data trÆ°á»›c)
- [ ] Register lazy route `/reader`

### Phase 2: Create Test Wizard
- [ ] `PdfUploadStepComponent` â€” dropzone, hiá»‡n tÃªn file
- [ ] `AnswerKeyStepComponent` â€” textarea, parse, preview table
- [ ] `CreateTestComponent` â€” orchestrate 2 bÆ°á»›c, submit lÃªn backend

### Phase 3: Reading Session (core)
- [ ] `PdfViewerComponent` â€” `<iframe [src]="pdfUrl | safe">`
- [ ] `QuestionRowComponent` â€” dumb: nháº­n question + userAnswer + state, emit select/flag
- [ ] `AnswerSheetComponent` â€” smart: owns userAnswers map, auto-save, progress, submit
- [ ] `ReadingSessionComponent` â€” orchestrator: load test, pass pdfUrl + questions xuá»‘ng

### Phase 4: Result & Mistake Queue
- [ ] `SessionResultComponent` â€” score card + part breakdown + mistake list
- [ ] `MistakeItemComponent` â€” dumb, expand/collapse
- [ ] `AiPromptBuilderComponent` â€” generate + copy
- [ ] `MistakeQueueComponent` â€” filter + list + textarea

### Phase 5: Integration & Polish
- [ ] Thay mock báº±ng backend API thá»±c
- [ ] Nav badge mistake count (inject `MistakeQueueService.getPendingCount()`)
- [ ] Mobile responsive: tabs PDF / CÃ¢u há»i
- [ ] Timer component (Ä‘áº¿m ngÆ°á»£c náº¿u test cÃ³ thá»i gian)
- [ ] Loading states + error handling

---

## 8. API Contract

| Method | Path | Body/Params | Response |
|:---|:---|:---|:---|
| GET | `/api/v1/tests` | - | `TestSummary[]` |
| GET | `/api/v1/tests/:id` | - | `TestDetail` (NO correctAnswer) |
| POST | `/api/v1/tests` | `FormData {pdf, metadata}` | `TestSummary` |
| POST | `/api/v1/tests/:id/submit` | `{answers[], duration}` | `SessionResult` |
| GET | `/api/v1/mistakes` | `?status=` | `Mistake[]` |
| POST | `/api/v1/mistakes/batch` | `Mistake[]` | `Mistake[]` |
| PATCH | `/api/v1/mistakes/:id` | `{status, explanation}` | `Mistake` |

---

## 9. Pacing Timer Engine, Shared Components & Part Practice Architecture (v4 Extension)

### 9.1 Component Structure
```
src/app/features/reader/
├── reading-session/
│   ├── reading-session.component.ts/.html/.scss
│   ├── pre-test-config-modal/
│   │   └── pre-test-config-modal.component.ts/.html/.scss   -- Cấu hình Part & Giờ mục tiêu
│   ├── pacing-status-bar/
│   │   └── pacing-status-bar.component.ts/.html/.scss        -- Live Pacing indicator
│   ├── answer-sheet/
│   │   └── answer-sheet.component.ts/.html/.scss             -- Render câu hỏi theo selectedParts
│   ├── question-row/
│   │   └── question-row.component.ts/.html/.scss
│   └── pdf-viewer/
│       ├── pdf-viewer.component.ts/.html/.scss
│       └── word-lookup-popup/                               -- Instant mouseup lookup popup
│           └── word-lookup-popup.component.ts/.html/.scss
├── mistake-queue/
│   ├── mistake-queue.component.ts/.html/.scss               -- Tích hợp app-paginator
│   └── mistake-item/
│       └── mistake-item.component.ts/.html/.scss
├── session-result/
│   └── session-result.component.ts/.html/.scss              -- Timing breakdown & slow warnings
└── services/
    ├── reader-api.service.ts
    ├── mistake-queue.service.ts
    ├── answer-key.service.ts
    └── test-timer.service.ts                                -- Core timing & pacing signals engine
```

### 9.2 `TestTimerService` (Angular 21 Zoneless Signal Primitives)
- Quản lý trạng thái:
  - `totalElapsed = signal(0)`
  - `currentPart = signal<5 | 6 | 7>(5)`
  - `partTimings = signal<Record<number, PartTiming>>({})`
  - `questionTimings: Record<number, number> = {}`
- Key Methods:
  - `init(config: TimeTargetConfig, onExpire)`: Khởi tạo với `selectedParts` và mục tiêu thời gian từng Part.
  - `onQuestionFocus(questionNum)`: Tính `timeSpentSeconds` cho câu vừa hoàn thành và tự động chuyển `currentPart`.
  - `pacingStatus = computed(...)`: Tính toán tỷ lệ `% time elapsed` vs `% questions done` để đưa ra trạng thái `ahead` / `on_track` / `behind`.

### 9.3 Custom Part Practice Data Flow
1. User chọn Part (ví dụ: `[5]`) trong `PreTestConfigModalComponent`.
2. `ReadingSessionComponent` tính `filteredQuestions = test.questions.filter(q => selectedParts.includes(q.part))`.
3. `AnswerSheetComponent` nhận `[questions]="filteredQuestions()"` (30 câu).
4. Khi submit, gửi `selectedParts: [5]` cùng `timeSpentSeconds` của 30 câu.
5. Backend chấm điểm trên 30 câu và chỉ sinh lỗi sai cho các câu thuộc Part 5.
