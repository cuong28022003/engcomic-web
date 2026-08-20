# Feature Specification: Word Journey — 7-Stage Practice UI

> **Perspective**: Business / Product Owner & Developer  
> **Purpose**: Answer the question **"WHAT & WHY"**  
> **Extends**: Feature 001 (Vocab Vault UI)  
> **Feature ID**: 002  

---

## 1. Overview

- **Feature ID**: 002
- **Feature Name**: Word Journey — 7-Stage Practice UI
- **Priority**: P1
- **Depends On**: Feature 001 components and models; backend Feature 002 API

### 1.1 Objective

Replace the current flat practice-session component with a **stage-aware, multi-exercise Word Journey** that:
- Shows the user which stage their word is at (visual progress ring 0→6)
- Renders stage-specific exercise UIs (MCQ, fill-blank, word-order, audio, free-write)
- Handles self-rating/confidence stars for Stage 3, 5, and 6
- Adds a **Daily Life Challenge** screen for mature words
- Adds a **Leech Center** to manage problem words

---

## 2. New Screens & Components

### 2.1 Practice Queue Screen (`/vocab/practice`)
> **Replace** current `PracticeSessionComponent`

**Layout**: 
- Top: progress bar showing "X cards remaining today"
- Card area: centered, one card at a time, full-height feel
- Navigation: "Skip for now" (sends to back of queue), "End session"

**States**:
1. **Loading**: skeleton card animation
2. **Empty queue**: celebration illustration + "All done for today! 🎉" + next review date
3. **Active exercise**: renders current stage's exercise subcomponent
4. **Result overlay**: correct/wrong feedback + XP animation before next card

### 2.2 Exercise Components (one per exercise type)

These are **reusable sub-components** rendered inside the Practice Queue:

| Component | Exercise Types | Stage |
| :--- | :--- | :--- |
| `FlashcardExercise` | flashcard (flip animation) | 1 |
| `MultipleChoiceExercise` | multiple_choice_meaning, audio_choice | 1 |
| `FormalityChoiceExercise` | formality_choice | 2 |
| `CollocationFillExercise` | collocation_fill | 2 |
| `SynonymCompareExercise` | synonym_compare | 2 |
| `PronunciationExercise` | pronunciation (Web Speech API) | 3 |
| `FillBlankExercise` | fill_blank | 4 |
| `WordOrderExercise` | word_order (drag or tap-to-order) | 4 |
| `FreeWriteExercise` | free_production | 5 |
| `SituationalRecallExercise` | situational_recall, role_play_mcq | 6 |
| `ConversationChainExercise` | conversation_chain | 6 |

### 2.3 Stage Progress Indicator
- **Where**: inside exercise header
- **Visual**: 7 dots (0–6) with filled/unfilled state; current stage highlighted with pulse ring
- **Tooltip on hover**: stage name (e.g., "Stage 2: Ngữ cảnh & sắc thái")

### 2.4 Leech Center Screen (`/vocab/leech`)
- List of leech cards with `wrongCount` badge
- Per card: "Thêm mẹo ghi nhớ" input + "Ôn lại từ Stage 1" button
- Empty state: "Tuyệt vời! Không có từ bị leech" illustration

### 2.5 Daily Life Challenge Screen (`/vocab/daily-challenge`)
- Shows 3–5 situational prompts (one card each, swipeable)
- Per prompt: scenario text + target word chip + related words
- User writes response in textarea
- Stars 1–5 confidence rating → POST `/api/card/{id}/confidence`
- If no mature cards: "Hãy học thêm từ để mở khóa tính năng này 🔒"

---

## 3. User Flows

### 3.1 Normal Practice Flow
```
/vocab/dashboard → [Luyện tập ngay]
  → GET /api/card/practice/queue
  → Show queue list
  → For each card:
      → GET /api/card/{id}/exercise
      → Render stage-specific component
      → User answers
      → POST /api/card/{id}/submit {quality: 0-5}
      → Show result overlay (correct/wrong + stage advance banner if promoted)
      → Next card
  → Queue empty → show completion screen
```

### 3.2 Stage 6 Flow
```
Stage 5 answer submitted → stage advances to 6
→ Show "🎉 Từ này đã chín! Thử thách thực tế đang chờ bạn"
→ Next time card is due: GET /api/card/{id}/exercise → Stage 6 situational prompt
→ User writes response (free text)
→ Self-rates confidence 1–5
→ POST /api/card/{id}/submit {quality: 4, confidenceScore: 4}
```

### 3.3 Leech Flow
```
Wrong 4 times → backend sets status='leech'
→ Frontend: result overlay shows "Từ này đang bị leech ⚠️"
→ Card disappears from main queue
→ User goes to /vocab/leech → adds memory tip
→ POST /api/card/{id}/clear-leech
→ Card re-enters stage 1 queue
```

### 3.4 Daily Challenge Flow
```
Dashboard → [Daily Life Challenge] button (only enabled if has mature cards)
  → GET /api/card/daily-challenge
  → Swipeable situational cards
  → User writes + rates confidence per card
  → POST /api/card/{id}/confidence for each
  → Summary: "Hôm nay bạn đã thực hành X từ"
```

---

## 4. Data Models (Frontend)

```typescript
// New/updated interfaces in models/index.ts

export interface ExerciseResponse {
  stage: number;
  exerciseType: ExerciseType;
  target: CardBrief;
  question?: string;
  sentence?: string;           // for fill_blank / word_order
  answer?: string;
  options?: ExerciseOption[];
  shuffledWords?: string[];     // for word_order
  situation?: string;           // Stage 6
  relatedWords?: string[];      // Stage 6 Conversation Chain
  skip?: boolean;               // Stage 3 skip
  skipReason?: string;
  examples?: ExampleSentence[]; // Stage 5 comparison
}

export type ExerciseType =
  | 'flashcard'
  | 'multiple_choice_meaning'
  | 'audio_choice'
  | 'formality_choice'
  | 'collocation_fill'
  | 'synonym_compare'
  | 'pronunciation'
  | 'fill_blank'
  | 'word_order'
  | 'free_production'
  | 'situational_recall'
  | 'role_play_mcq'
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
  quality: number;         // 0–5
  answerText?: string;
  confidenceScore?: number; // 1–5
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

## 5. Design Guidelines

Refer to `UI_STYLE_GUIDE.md` for tokens. Additional rules specific to practice UI:

- **Exercise card**: `max-width: 720px`, centered, `border-radius: var(--radius-xl)`, glassmorphism background, `box-shadow: var(--shadow-xl)`
- **Correct feedback overlay**: green gradient flash + ✓ icon + scale-in animation (200ms)
- **Wrong feedback overlay**: red gradient flash + ✗ icon + shake animation (300ms)
- **Stage advance banner**: gold gradient, star burst animation, "Lên Stage N! 🌟"
- **Confidence stars**: large interactive stars (48px), hover glow, click to select with bounce
- **Word order tiles**: pill-shaped, drag-and-drop with smooth reorder animation (or tap-to-place fallback)
- **Leech badge**: pulsing red dot on `status='leech'` cards in dashboard

---

## 6. Accessibility & UX Rules

- Audio auto-plays only when user explicitly clicks play (no auto-play)
- All interactive elements have `aria-label`
- Tab order: question → options → submit (never reversed)
- Skip button always visible during Stage 3 pronunciation
- Timer: NO countdown timers (causes anxiety; this is a learning app)

---

## 7. Out of Scope for Feature 002

- Actual server-side audio storage (Stage 5 recording stored locally via IndexedDB or skipped)
- Real-time scoring via AI (all exercises use static data from DB)
- Gamification/XP points system (deferred to Feature 003)
- Push notifications for due reviews
