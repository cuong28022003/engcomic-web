# Architecture Plan: Word Journey — Frontend Implementation

> **Perspective**: Developer / AI Agent  
> **Purpose**: Answer the question **"HOW & ARCHITECTURE"**  
> **Extends**: Feature 001 Vocab Vault frontend  

---

## 1. Folder Structure

```
src/app/features/vocab/
├── practice/                        [REPLACE CURRENT — major rewrite]
│   ├── practice.component.ts        ← Queue controller (loads cards, dispatches to exercise)
│   ├── practice.component.html
│   ├── practice.component.scss
│   └── exercises/                   [NEW sub-folder]
│       ├── flashcard/
│       │   ├── flashcard-exercise.component.ts
│       │   ├── flashcard-exercise.component.html
│       │   └── flashcard-exercise.component.scss
│       ├── multiple-choice/
│       │   ├── multiple-choice-exercise.component.ts
│       │   ├── multiple-choice-exercise.component.html
│       │   └── multiple-choice-exercise.component.scss
│       ├── formality-choice/
│       │   └── ... (ts, html, scss)
│       ├── collocation-fill/
│       │   └── ... (ts, html, scss)
│       ├── pronunciation/
│       │   └── ... (ts, html, scss)
│       ├── fill-blank/
│       │   └── ... (ts, html, scss)
│       ├── word-order/
│       │   └── ... (ts, html, scss)
│       ├── free-write/
│       │   └── ... (ts, html, scss)
│       └── situational-recall/
│           └── ... (ts, html, scss)
│
├── leech/                           [NEW screen]
│   ├── leech.component.ts
│   ├── leech.component.html
│   └── leech.component.scss
│
└── daily-challenge/                 [NEW screen]
    ├── daily-challenge.component.ts
    ├── daily-challenge.component.html
    └── daily-challenge.component.scss
```

---

## 2. Routing (vocab.routes.ts)

Add these routes inside the vocab lazy-loaded module:

```typescript
{
  path: 'practice',
  component: PracticeComponent  // replaces current practice-session
},
{
  path: 'leech',
  component: LeechComponent
},
{
  path: 'daily-challenge',
  component: DailyChallengeComponent
}
```

---

## 3. Models (shared/models/index.ts)

Add these interfaces:

```typescript
export interface ExerciseResponse {
  stage: number;
  exerciseType: ExerciseType;
  target: CardBrief;
  question?: string;
  sentence?: string;
  answer?: string;
  options?: ExerciseOption[];
  shuffledWords?: string[];
  situation?: string;
  relatedWords?: string[];
  skip?: boolean;
  skipReason?: string;
  examples?: ExampleSentence[];
}

export type ExerciseType =
  | 'flashcard' | 'multiple_choice_meaning' | 'audio_choice'
  | 'formality_choice' | 'collocation_fill' | 'synonym_compare'
  | 'pronunciation' | 'fill_blank' | 'word_order'
  | 'free_production' | 'situational_recall' | 'role_play_mcq'
  | 'conversation_chain';

export interface ExerciseOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface CardBrief {
  id: string;
  word: string;
  ipa?: string;
  audio?: string;
  meaning: string;
}

export interface SubmitAnswerRequest {
  quality: number;
  answerText?: string;
  confidenceScore?: number;
}

export interface SubmitAnswerResponse {
  newStage: number;
  newStatus: string;
  nextReviewDate: string;
  intervalDays: number;
  stageAdvanced: boolean;
  message: string;
}

export interface DailyChallenge {
  cardId: string;
  word: string;
  meaning: string;
  situation: string;
  relatedWords: string[];
}
```

---

## 4. API Service (card-api.service.ts)

Add to `CardApiService`:

```typescript
// Practice queue
getPracticeQueue(): Observable<Card[]> {
  return this.http.get<Card[]>(`${this.base}/practice/queue`);
}

// Exercise for a specific card
getExercise(cardId: string): Observable<ExerciseResponse> {
  return this.http.get<ExerciseResponse>(`${this.base}/${cardId}/exercise`);
}

// Submit answer
submitAnswer(cardId: string, body: SubmitAnswerRequest): Observable<SubmitAnswerResponse> {
  return this.http.post<SubmitAnswerResponse>(`${this.base}/${cardId}/submit`, body);
}

// Leech cards
getLeechCards(): Observable<Card[]> {
  return this.http.get<Card[]>(`${this.base}/leech`);
}

// Clear leech
clearLeech(cardId: string, memoryTip: string): Observable<Card> {
  return this.http.post<Card>(`${this.base}/${cardId}/clear-leech`, { memoryTip });
}

// Daily challenge
getDailyChallenge(): Observable<DailyChallenge[]> {
  return this.http.get<DailyChallenge[]>(`${this.base}/daily-challenge`);
}

// Update confidence
updateConfidence(cardId: string, confidenceScore: number): Observable<Card> {
  return this.http.post<Card>(`${this.base}/${cardId}/confidence`, { confidenceScore });
}
```

---

## 5. PracticeComponent State Machine

```typescript
// State
queue: Card[] = [];               // ordered list from API
currentIndex = 0;
currentExercise: ExerciseResponse | null = null;
phase: 'loading' | 'exercise' | 'result' | 'empty' = 'loading';
resultState: 'correct' | 'wrong' | 'self_check' | null = null;
stageAdvancedTo: number | null = null;

// On init:
// 1. GET /practice/queue → queue
// 2. Load first card's exercise

// On submit:
// 1. POST /{id}/submit → SubmitAnswerResponse
// 2. Show result overlay (phase='result')
//    - if stageAdvanced: show stage banner
// 3. After 1500ms: advance to next card or show empty

// exercise outlet: use @switch on exerciseType to render sub-component
```

**Exercise dispatch pattern (in template):**
```html
@switch (currentExercise.exerciseType) {
  @case ('flashcard') {
    <app-flashcard-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @case ('multiple_choice_meaning') {
    <app-multiple-choice-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @case ('fill_blank') {
    <app-fill-blank-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @case ('word_order') {
    <app-word-order-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @case ('free_production') {
    <app-free-write-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @case ('situational_recall') {
    <app-situational-recall-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
  @default {
    <app-multiple-choice-exercise [exercise]="currentExercise" (answered)="onAnswer($event)" />
  }
}
```

**Common exercise component interface (EventEmitter output):**
```typescript
// All exercise components emit:
(answered) = EventEmitter<{ quality: number; answerText?: string; confidenceScore?: number }>
```

---

## 6. Stage Progress Indicator (Shared Component)

Create `shared/components/stage-progress/stage-progress.component.ts`:

```typescript
@Input() currentStage: number; // 0-6
// Renders 7 dots; dot[i] = filled if i < currentStage, pulsing if i == currentStage
```

Stage names array:
```typescript
const STAGE_NAMES = [
  'Chưa học', 'Nhận diện', 'Ngữ cảnh & sắc thái',
  'Phát âm', 'Sản sinh có hỗ trợ', 'Sản sinh tự do', 'Ứng dụng thực tế'
];
```

---

## 7. Pronunciation Exercise (Stage 3)

Uses Web Speech API (browser-native):
```typescript
// Check support
const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

// Start recording
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript.toLowerCase();
  // Compare transcript to card.word (fuzzy match)
};
```

Self-rate stars output: `quality = confidenceScore - 1` (so stars 3 → quality 2, stars 5 → quality 4)

---

## 8. Word Order Exercise (Stage 4)

Implementation: **tap-to-place** (simpler than drag-and-drop):
```
Rendered as: two zones
- Top zone: shuffled word tiles (tap to pick up)
- Bottom zone: user's assembled sentence slots (tap to remove)

On submit: join bottom zone words and compare to card.answer
```

Use `CDK DragDrop` from Angular Material only if already installed; otherwise use tap-to-place with array manipulation.

---

## 9. Daily Challenge Component

```typescript
// State
challenges: DailyChallenge[] = [];
currentIdx = 0;
responses: Map<string, { text: string; confidence: number }> = new Map();
submitted = false;

// On card: textarea for response + star rating
// On "Tiếp theo": move to next challenge
// On "Hoàn thành": POST confidence for each submitted card
```

---

## 10. Leech Component

```typescript
// State
leechCards: Card[] = [];
memoryTips: Map<string, string> = new Map();  // cardId → tip

// clearLeech(card):
//   tip = memoryTips.get(card.id) || ''
//   POST /{id}/clear-leech {memoryTip: tip}
//   Remove from local list
```

---

## 11. Dashboard Updates (vocab-dashboard.component)

Add:
- `"Daily Life Challenge"` button (disabled if no mature cards — check `dashboardStats.matureCount === 0`)
- `"Leech Center"` link with badge count (if `dashboardStats.leechCount > 0`)
- Stage distribution mini-chart: 7 bars (one per stage), showing how many cards are at each stage
  - Requires a new API endpoint `GET /api/card/stage-distribution` OR compute client-side from a full card list (choose: API endpoint is cleaner)

> **Decision for AI**: For MVP, skip the stage distribution chart. Add the two new buttons only.

---

## 12. Verification Plan

1. `npx ng build --configuration=development` → must pass with 0 errors
2. Run dev server, navigate to `/vocab/practice`:
   - Verify queue loads
   - Verify flashcard flip animation
   - Verify MCQ renders with 4 options
   - Verify submitting correct answer shows green overlay
   - Verify submitting wrong answer shows red overlay
3. Navigate to `/vocab/daily-challenge`:
   - Verify empty state if no mature cards
4. Navigate to `/vocab/leech`:
   - Verify empty state
5. Verify stage progress dots render correctly (stage 0: all unfilled, stage 3: 3 dots filled)
