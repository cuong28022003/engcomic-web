# API Reference — EngComic Angular

> Base URL: `http://localhost:8080/api`  
> Tất cả request bảo mật cần header: `Authorization: Bearer <accessToken>`

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/auth/login` | `{ username, password }` | `{ success, data: AuthData }` | ❌ |
| POST | `/auth/register` | `{ username, email, password }` | `{ success, message, data: { email } }` | ❌ |
| POST | `/auth/refreshtoken` | `{ refreshToken }` | `{ accessToken }` | ❌ |
| GET | `/auth/logout` | — | — | ✅ |
| GET | `/auth/active` | `?token=` | — | ❌ |

```typescript
// Thực tế data nằm trong wrapper:
// { success: true, message: "...", data: { ... } }

// Login data.* fields (mapped → CurrentUser trong AuthService):
interface LoginResponseData {
  id: string;          // → mapped thành userId
  username: string;
  email: string;
  fullName?: string;
  accessToken: string;
  refreshToken: string;
  roles: string[];     // ['USER'] or ['USER', 'ADMIN']
  imageUrl?: string;   // → mapped thành avatarUrl
}

// Angular model sau khi map:
interface CurrentUser {
  userId: string;      // từ data.id
  username: string;
  email: string;
  avatarUrl?: string;  // từ data.imageUrl hoặc data.avatarUrl
  roles: string[];
  accessToken: string;
  refreshToken: string;
}
```

---

## 📚 Comics (`/comics`)

| Method | Endpoint | Params / Body | Response | Auth |
|---|---|---|---|---|
| GET | `/comics` | `page, size, sort, genre, status, keyword` | `Page<Comic>` | ❌ |
| GET | `/comics/:id` | — | `Comic` | ❌ |
| POST | `/comics` | `FormData { title, description, genre, coverImage }` | `Comic` | ✅ |
| PUT | `/comics/:id` | `FormData` | `Comic` | ✅ |
| DELETE | `/comics/:id` | — | — | ✅ |
| GET | `/comics/top` | `limit` | `Comic[]` | ❌ |
| GET | `/comics/recent` | `limit` | `Comic[]` | ❌ |

```typescript
// ⚠️ Backend trả về field name KHÁC với thiết kế ban đầu:
interface Comic {
  id: string;
  name?: string;       // ← backend dùng 'name' không phải 'title'
  title?: string;      // optional fallback
  description?: string;
  imageUrl?: string;   // ← backend dùng 'imageUrl' không phải 'coverImage'
  backgroundUrl?: string;
  genre?: string;      // ← string đơn, không phải array
  genres?: string[];   // optional array (không luôn có)
  url?: string;        // slug URL
  artist?: string;
  uploader?: { id: string; username: string; imageUrl?: string; roles: string[] };
  views?: number;
  rating?: number;
  totalRatings?: number;
  totalChapters?: number;
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  englishLevel?: string;  // 'A1', 'A2', 'B1', 'B2', ...
  ageRating?: string;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
// Template: dùng (comic.title || comic.name) và (comic.imageUrl || comic.coverImage)
```

---

## 📖 Chapters (`/chapters`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/chapters/comic/:comicId` | — | `Chapter[]` | ❌ |
| GET | `/chapters/:id` | — | `Chapter` | ❌ |
| POST | `/chapters` | `FormData { comicId, title, images[] }` | `Chapter` | ✅ |
| PUT | `/chapters/:id` | `FormData` | `Chapter` | ✅ |
| DELETE | `/chapters/:id` | — | — | ✅ |

```typescript
interface Chapter {
  id: string;
  comicId: string;
  title: string;
  chapterNumber: number;
  images: string[];        // mảng URL ảnh
  createdAt?: string;
}
```

---

## 🃏 Decks & Cards (`/deck`, `/card`)

### Decks
| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/deck/user/:userId` | `page, size` | `Page<Deck>` | ✅ |
| GET | `/deck/:deckId` | — | `Deck` | ✅ |
| POST | `/deck` | `{ name, description, userId }` | `Deck` | ✅ |
| PUT | `/deck/:deckId` | `{ name, description }` | `Deck` | ✅ |
| DELETE | `/deck/:deckId` | — | — | ✅ |

### Cards
| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/card/deck/:deckId` | `page, size` | `Page<Card>` | ✅ |
| POST | `/card` | `{ deckId, front, back, phonetic, exampleSentence }` | `Card` | ✅ |
| PUT | `/card/:cardId` | `{ front, back, ... }` | `Card` | ✅ |
| DELETE | `/card/:cardId` | — | — | ✅ |
| POST | `/card/:cardId/review` | `{ rating: 1-4, userId }` | `Card` | ✅ |
| GET | `/card/deck/:deckId/due` | — | `Card[]` | ✅ |

```typescript
interface Deck {
  deckId: string;
  name: string;
  description?: string;
  userId: string;
  totalCards?: number;
  dueCards?: number;
  createdAt?: string;
}

interface Card {
  cardId: string;
  deckId: string;
  front: string;          // từ tiếng Anh
  back: string;           // nghĩa tiếng Việt
  phonetic?: string;      // phiên âm IPA
  exampleSentence?: string;
  interval?: number;      // SRS interval (ngày)
  easeFactor?: number;    // SRS ease factor
  dueDate?: string;       // ngày ôn tập tiếp theo
}
```

---

## 👤 Users (`/users`)

| Method | Endpoint | Response | Auth |
|---|---|---|---|
| GET | `/users/:userId` | `UserProfile` | ✅ |
| PUT | `/users/:userId` | `UserProfile` | ✅ |
| PUT | `/users/:userId/change-password` | — | ✅ |
| DELETE | `/users/:userId` | — | ✅ |

```typescript
interface UserProfile {
  userId: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}
```

---

## 📊 User Stats (`/user-stats`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/user-stats/:userId` | — | `UserStats` | ✅ |
| POST | `/user-stats/add-xp` | `{ userId, xp }` | `UserStats` | ✅ |
| POST | `/user-stats/add-diamond` | `{ userId, diamonds }` | `UserStats` | ✅ |
| POST | `/user-stats/streak` | `{ userId }` | `UserStats` | ✅ |

```typescript
interface UserStats {
  userId: string;
  xp: number;
  diamonds: number;
  streakDays: number;
  lastStudyDate?: string;
  rank?: Rank;
}
```

---

## 🎴 Gacha (`/gacha`, `/character`, `/character-usage`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/gacha/pull` | `{ userId, pullCount: 1|10 }` | `GachaResult[]` | ✅ |
| GET | `/character` | — | `GachaCharacter[]` | ❌ |
| GET | `/character-usage/user/:userId` | — | `CharacterUsage[]` | ✅ |
| POST | `/character-usage` | `{ userId, characterId }` | `CharacterUsage` | ✅ |

```typescript
interface GachaCharacter {
  characterId: string;
  name: string;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  imageUrl?: string;
  skills?: string[];
  atk?: number;
  def?: number;
  hp?: number;
}

interface GachaResult {
  id: string;
  character: GachaCharacter;
  userId: string;
  isNew: boolean;
}
```

---

## 🏆 Ranks & Leaderboard (`/rank`)

| Method | Endpoint | Response | Auth |
|---|---|---|---|
| GET | `/rank` | `Rank[]` | ❌ |
| GET | `/rank/leaderboard` | `LeaderboardEntry[]` | ❌ |
| GET | `/rank/user/:userId` | `Rank` | ✅ |

```typescript
interface Rank {
  rankId: string;
  name: string;
  minXp: number;
  maxXp?: number;
  iconUrl?: string;
  color?: string;
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  rank?: Rank;
  position: number;
}
```

---

## ⭐ Ratings (`/rating`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/rating` | `{ comicId, userId, rating: 1-5 }` | `Rating` | ✅ |
| GET | `/rating/comic/:comicId` | — | `Rating[]` | ❌ |
| GET | `/rating/comic/:comicId/average` | — | `{ average: number }` | ❌ |

---

## 🔖 Saved Comics (`/saved`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/saved/user/:userId` | — | `SavedComic[]` | ✅ |
| POST | `/saved` | `{ userId, comicId }` | `SavedComic` | ✅ |
| DELETE | `/saved/:savedId` | — | — | ✅ |
| GET | `/saved/check` | `userId, comicId` | `{ saved: boolean }` | ✅ |

---

## 📜 Reading History (`/reading`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/reading` | `{ userId, comicId, chapterId }` | `ReadingHistory` | ✅ |
| GET | `/reading/user/:userId` | `page, size` | `Page<ReadingHistory>` | ✅ |

---

## 💎 Topup (`/topup`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| GET | `/topup/history` | `userId, page, size` | `Page<TopupRequest>` | ✅ |
| POST | `/topup` | `{ userId, amount, diamonds }` | `TopupRequest` | ✅ |
| GET | `/topup` | `page, size` (admin) | `Page<TopupRequest>` | ✅ ADMIN |
| PUT | `/topup/:id/approve` | — | `TopupRequest` | ✅ ADMIN |
| PUT | `/topup/:id/reject` | — | `TopupRequest` | ✅ ADMIN |

---

## 🚩 Reports (`/report`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/report` | `{ userId, comicId, reason }` | `Report` | ✅ |
| GET | `/report` | `page, size` (admin) | `Page<Report>` | ✅ ADMIN |
| PUT | `/report/:id/resolve` | — | `Report` | ✅ ADMIN |
| DELETE | `/report/:id` | — | — | ✅ ADMIN |

---

## 🌐 Translator (`/translate`)

| Method | Endpoint | Body | Response | Auth |
|---|---|---|---|---|
| POST | `/translate` | `{ text, sourceLang, targetLang }` | `TranslationResult` | ✅ |
| POST | `/translate/define` | `{ word }` | `DictionaryResult` | ✅ |

---

## 🛡️ Admin (`/admin`)

| Method | Endpoint | Response | Auth |
|---|---|---|---|
| GET | `/admin/users` | `Page<CurrentUser>` | ✅ ADMIN |
| DELETE | `/admin/users/:id` | — | ✅ ADMIN |
| GET | `/admin/comics` | `Page<Comic>` | ✅ ADMIN |
| PUT | `/admin/comics/:id/status` | `{ status }` | ✅ ADMIN |
| DELETE | `/admin/comics/:id` | — | ✅ ADMIN |

---

## 📦 Common Response Types

```typescript
// Pagination
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;      // current page (0-indexed)
  size: number;
}

// Pagination params
interface PageParams {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  size?: number;
  sort?: string;
}
```
