# Implementation Plan: Vocab Vault (Feature 001)

> **Perspective**: Frontend Architect / Lead Developer  
> **Purpose**: Answer the question **"HOW & ARCHITECTURE"** (Angular Standalone + Signals + Services)

---

## 1. Technical Context & Constraints
- **Framework**: Angular 19 (Standalone Components, Signals, RxJS)
- **Styling**: SCSS, Dark Mode Glassmorphism (`styles.scss`, `UI_STYLE_GUIDE.md`)
- **Backend API Base**: `http://localhost:8080/api`
- **Route Prefix**: `/vocab`

---

## 2. Models & Data Contracts (`src/app/shared/models/index.ts`)

```typescript
export interface WordRelation {
  text: string;
  type: 'family' | 'collocation' | 'synonym';
  pos?: string;
  relatedCardId?: string;
}

export interface ExampleSentence {
  id?: string;
  text: string;
  translation?: string;
  formality?: 'formal' | 'informal' | 'written';
}

export interface Card {
  id: string;
  deckId?: string;
  userId?: string;
  word: string;             // từ / cụm từ tiếng Anh
  meaning: string;          // nghĩa tiếng Việt
  ipa?: string;
  audio?: string;
  partOfSpeech?: string;
  definitionEn?: string;
  usageNote?: string;
  topic?: string;
  examples?: ExampleSentence[];
  relations?: WordRelation[];
  stage?: number;           // 0–5
  status?: 'new' | 'learning' | 'mature' | 'leech';
  easeFactor?: number;
  interval?: number;
  repetition?: number;
  wrongCount?: number;
  nextReview?: string;
  lastReviewed?: string;
}

export interface DashboardResponse {
  totalCards: number;
  dueToday: number;
  newCount: number;
  learningCount: number;
  matureCount: number;
  leechCount: number;
  cards: PageResponse<Card>;
}

export interface PendingItem {
  id: string;
  userId: string;
  content: string;
  sourceType?: 'family' | 'collocation' | 'synonym' | 'manual';
  sourceCardId?: string;
  status: 'pending' | 'imported';
  createdAt?: string;
}
```

---

## 3. Services (`src/app/core/services/`)

1. **`CardApiService`**:
   - `getDashboard(params)` $\rightarrow$ `GET /api/card/dashboard`
   - `getCardDetail(id)` $\rightarrow$ `GET /api/card/:id`
   - `getDueCards(limit)` $\rightarrow$ `GET /api/card/practice/due?limit=15`
   - `submitPracticeResult(cardId, req)` $\rightarrow$ `POST /api/card/:id/practice-result`
   - `batchImport(req)` $\rightarrow$ `POST /api/card/batch-import`
2. **`PendingItemApiService`**:
   - `getAll(params)` $\rightarrow$ `GET /api/pending-item`
   - `create(req)` $\rightarrow$ `POST /api/pending-item`
   - `addManual(content)` $\rightarrow$ `POST /api/pending-item/add-manual`
   - `remove(id)` $\rightarrow$ `DELETE /api/pending-item/:id`
   - `generatePrompt()` $\rightarrow$ `GET /api/pending-item/generate-prompt`

---

## 4. Component Structure (`src/app/features/vocab/`)

```
src/app/features/vocab/
├── vocab.routes.ts                   ← lazy routes
├── dashboard/                        ← VocabDashboardComponent
│   ├── vocab-dashboard.component.ts
│   ├── vocab-dashboard.component.html
│   └── vocab-dashboard.component.scss
├── word-detail/                      ← WordDetailComponent
│   ├── word-detail.component.ts
│   ├── word-detail.component.html
│   └── word-detail.component.scss
├── collector/                        ← WordCollectorComponent
│   ├── word-collector.component.ts
│   ├── word-collector.component.html
│   └── word-collector.component.scss
├── import/                           ← VocabImportComponent
│   ├── vocab-import.component.ts
│   ├── vocab-import.component.html
│   └── vocab-import.component.scss
└── practice/                         ← PracticeSessionComponent
    ├── practice-session.component.ts
    ├── practice-session.component.html
    └── practice-session.component.scss

---

## 5. Deck Management & Vocab Vault Deep Integration

### 5.1 Deck Feature Components (`src/app/features/deck/`)
- `DeckListComponent` (`/deck`): Danh sách bộ thẻ, Tạo Deck Modal, Xóa Deck Modal.
- `DeckDetailComponent` (`/deck/:deckId`): Chi tiết bộ thẻ, Thống kê Level 1-4, Live Search, Thêm/Sửa/Xóa Card Modal, AI Bridge.
- `DeckApiService`: `getDecksByUserId`, `getDeckById`, `createDeck`, `updateDeck`, `deleteDeck`.

### 5.2 Vocab Vault & Deck Integration UI
- **Filter**: Dropdown chọn Deck trong Vocab Dashboard (`Tất cả`, `Chưa phân bộ thẻ`, `[Tên Deck]`).
- **Bulk Action Bar**: Checkbox chọn nhiều thẻ từ, thanh nổi gán hàng loạt `POST /api/card/batch-assign-deck`.
- **Card Badges**: Nhãn Deck badge trên từng thẻ từ với liên kết tới `/deck/:deckId`.
- **Quick Assign Modal**: Modal đổi bộ thẻ trực tiếp cho thẻ lẻ.
```
