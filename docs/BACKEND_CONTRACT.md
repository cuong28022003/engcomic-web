# Backend Contract — EngComic Angular

> ⚠️ **Tài liệu này ghi lại *thực tế* API backend trả về sau khi debug thực tế.**
> Không phải thiết kế lý tưởng — đây là những gì backend hiện tại **thực sự trả về**.

---

## ⚙️ Cấu hình chạy

| Service | URL |
|---|---|
| Backend (Spring Boot) | `http://localhost:8080` |
| Frontend Angular (dev) | `http://localhost:4201` |
| Frontend React (cũ) | `http://localhost:3000` |
| Base API path | `http://localhost:8080/api` |

> Không có Angular proxy cấu hình. Angular gọi **thẳng** sang `http://localhost:8080/api`.

---

## 🔐 Auth — Response envelope thực tế

### `POST /api/auth/login` — Response thực tế:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "681cce6406f2dd257c72e60c",
    "username": "doctor28022003",
    "email": "doctor28022003@gmail.com",
    "fullName": "doctorC",
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "roles": ["USER"]
  }
}
```

> ⚠️ **Lưu ý quan trọng:** Không phải `CurrentUser` trực tiếp mà wrap trong `data`. Field userId trong Angular đến từ `data.id` (không phải `data.userId`). `AuthService.login()` đã xử lý việc map này.

### `POST /api/auth/register` — Response thực tế:
```json
{
  "success": true,
  "message": "Register successful",
  "data": {
    "email": "user@example.com"
  }
}
```

> ⚠️ Backend **không trả về token sau khi register** — người dùng cần đăng nhập lại sau khi đăng ký.

---

## 📚 Comics — Fields thực tế từ backend

Backend `ComicController` trả về các field **khác** với model React gốc:

| Field thực tế (backend) | Field Angular model | Ghi chú |
|---|---|---|
| `name` | `name` hoặc `title` | Cả 2 đều nullable |
| `imageUrl` | `imageUrl` | Ảnh bìa chính (Cloudinary URL) |
| `backgroundUrl` | `backgroundUrl` | Ảnh nền rộng |
| `genre` (string) | `genre` | Một thể loại duy nhất (không phải array) |
| `url` | `url` | Slug URL của truyện |
| `artist` | `artist` | Tên tác giả |
| `rating` | `rating` | Điểm rating trung bình |
| `totalRatings` | `totalRatings` | — |
| `englishLevel` | `englishLevel` | "A1", "A2", "B1", ... |
| `ageRating` | `ageRating` | — |
| `uploader` | `uploader` | Object user đầy đủ (không phải chỉ id) |
| `status` | `status` | `"ACTIVE"`, `"PENDING"`, `"INACTIVE"` |

### Mẫu response thực tế từ `/api/comics`:
```json
{
  "totalElements": 10,
  "totalPages": 1,
  "size": 10,
  "content": [
    {
      "id": "683c613f99c6d542587f1ce5",
      "name": "One Piece",
      "url": "one-piece",
      "description": "Câu chuyện về Monkey D. Luffy...",
      "genre": "Phiêu lưu",
      "artist": "Eiichiro Oda",
      "imageUrl": "https://res.cloudinary.com/.../cover.jpg",
      "backgroundUrl": "https://res.cloudinary.com/.../bg.jpg",
      "uploader": {
        "id": "681cce6406f2dd257c72e60c",
        "username": "doctor28022003",
        "email": "doctor28022003@gmail.com",
        "fullName": "doctorC",
        "imageUrl": "https://res.cloudinary.com/.../avatar.jpg",
        "roles": ["USER"]
      },
      "views": 261,
      "rating": 5.0,
      "totalRatings": 0,
      "totalChapters": 0,
      "status": "ACTIVE",
      "createdAt": "2025-06-03T11:55:49.121",
      "updatedAt": "2025-06-01T21:18:39.569",
      "englishLevel": "B1",
      "ageRating": null
    }
  ]
}
```

> ⚠️ Pagination: field là `content` (không phải `data`), **page index bắt đầu từ 0**. Response từ Spring Boot `Page<T>`.

---

## 🃏 Deck & Card — Actual endpoints

| Method | Actual endpoint | Angular service gọi |
|---|---|---|
| GET user decks | `/api/deck/user/:userId` | `DeckApiService.getDecksByUserId()` |
| GET deck by ID | `/api/deck/:id` | `DeckApiService.getDeckById()` |
| POST create deck | `/api/deck` | Body: `{ name, description }` (không cần `userId`, backend lấy từ JWT) |
| DELETE deck | `/api/deck/:id` | — |
| GET cards of deck | `/api/card/deck/:deckId` | `CardApiService.getCardsByDeckId()` |
| POST create card | `/api/card` | Body: xem `CardRequestDto` |
| POST review card | `/api/card/:cardId/review` | Body: `{ quality: 0-5 }` |

---

## ⭐ Ratings — Actual endpoint

| Method | Actual endpoint | Ghi chú |
|---|---|---|
| GET | `/api/ratings/comic/:comicId` | Trả về `Page<RatingResponseDto>` |

> ⚠️ Đường dẫn là `/api/ratings` (có **s**), không phải `/api/rating`.  
> `RatingApiService.BASE = '/ratings'` — **đã được fix**.

---

## 💬 Comments — Actual endpoint

| Method | Actual endpoint | Ghi chú |
|---|---|---|
| GET | `/api/comment?comicUrl=<slug>` | Nhận `comicUrl` (slug) qua **query param**, không phải path param `/comic/:id` |

```typescript
// Cách gọi đúng:
this.http.get('/api/comment', { params: { comicUrl: 'one-piece' } })
// ❌ SAI: /api/comment/comic/{comicId}
```

---

## 📊 UserStats — Actual endpoint

| Method | Actual endpoint | Auth |
|---|---|---|
| GET | `/api/userstats/me` | ✅ (lấy stats của user hiện tại từ JWT) |

> ⚠️ Không có endpoint `/api/user-stats/:userId`. Chỉ có `GET /api/userstats/me`.

---

## 🌐 CORS — Đã cấu hình

Backend đã cấu hình CORS cho phép:
- `http://localhost:*` (mọi port local)
- `http://127.0.0.1:*`
- `https://*.github.io`
- `https://*.vercel.app`

> File: [CorsConfig.java](../EngComic_backend/src/main/java/mobile/security/config/CorsConfig.java)

---

## 🧠 Vocab Vault (`/api/card` & `/api/pending-item`)

### `GET /api/card/dashboard`
Response trả về flat fields thay vì nested `stats`:
```json
{
  "totalCards": 12,
  "dueToday": 3,
  "matureCount": 2,
  "learningCount": 4,
  "leechCount": 1,
  "newCount": 5,
  "cards": {
    "content": [...],
    "totalPages": 1,
    "totalElements": 12,
    "size": 20,
    "number": 0
  }
}
```

### `GET /api/card/:id`
```json
{
  "card": {
    "id": "...",
    "word": "decision",
    "meaning": "sự quyết định",
    "ipa": "/dɪˈsɪʒ.ən/",
    "partOfSpeech": "noun",
    "definitionEn": "a choice or judgment made after considering options",
    "examples": [
      { "id": "...", "text": "The manager made a quick decision.", "translation": null, "formality": "formal" }
    ],
    "relations": [
      { "text": "decide", "type": "family", "pos": "verb", "relatedCardId": "..." }
    ]
  },
  "reverseRelations": [
    { "id": "...", "word": "decide", "meaning": "quyết định", ... }
  ]
}
```

---

## 🐛 Bugs đã gặp & cách fix

| Bug | Nguyên nhân | Cách đã fix |
|---|---|---|
| `404 Cannot POST /auth/register` | `AuthService.BASE = '/auth'` → Angular gọi nhầm vào dev server port 4201 thay vì backend | Chuyển thành `${environment.apiUrl}/auth` |
| CORS block từ `http://localhost:4200` | `CorsConfig` chỉ whitelist `http://localhost:3000/` (có dấu `/` cuối) + Spring Security disable cors | Dùng `allowedOriginPatterns("http://localhost:*")` và `Customizer.withDefaults()` |
| `Comic.title` undefined | Backend trả `name`, không phải `title` | Cập nhật `Comic` interface thêm `name?`, template dùng `comic.title \|\| comic.name` |
| `Comic.coverImage` undefined | Backend trả `imageUrl`, không phải `coverImage` | Cập nhật `Comic` interface, template dùng `comic.imageUrl \|\| comic.coverImage` |
| `PageParams` type error | `PageParams` interface thiếu index signature | Thêm `[key: string]: string \| number \| boolean \| undefined` vào `PageParams` |
| Rating 404 | `RatingApiService.BASE = '/rating'` nhưng backend route là `/ratings` | Đổi thành `/ratings` |
| `Cannot read properties of undefined (reading 'dueToday')` | Backend `GET /api/card/dashboard` trả về `totalCards`, `dueToday`, `newCount`... ở root object thay vì nested trong `stats` | Cập nhật `DashboardResponse` interface và map trực tiếp từ `res.totalCards`, `res.dueToday` |
| `ExampleSentence` và `WordRelation` chỉ lưu `_id` | `BatchImportCardInteractor` map cứng key `en`, `vi`, `context`, `word`, `meaning` trong khi AI trả `text`, `formality`, `pos`... | Cập nhật hàm `getString()` hỗ trợ đa dạng alias (snake_case + camelCase) và map đầy đủ vào entity |
| Thuật ngữ `front`/`back` khó hình dung | Thuật ngữ cũ từ flashcard | Đã đổi sang `word` (từ tiếng Anh) và `meaning` (nghĩa tiếng Việt) trên cả Backend và Frontend |
| Data câu sai trả về thiếu (cắt ở 50 câu) & thứ tự lộn xộn | `getMistakes` default size 50 và backend sắp xếp theo createdAt DESC | Tăng default size lên 1000 và backend/frontend sắp xếp theo `questionNumber ASC` |

---

## 📖 TOEIC Reader & Translator Contract

### `POST /api/toeic/tests/{id}/submit`
Payload gửi lên:
```json
{
  "duration": 1200,
  "timeMode": "per_part",
  "selectedParts": [5],
  "part5TargetSeconds": 1200,
  "part6TargetSeconds": 0,
  "part7TargetSeconds": 0,
  "part5ElapsedSeconds": 1150,
  "part6ElapsedSeconds": 0,
  "part7ElapsedSeconds": 0,
  "answers": [
    { "questionNumber": 101, "answer": "C", "flagged": false, "timeSpentSeconds": 25 }
  ]
}
```

Response trả về:
```json
{
  "testId": "68a...",
  "testName": "ETS 2024 Test 5",
  "rawScore": 27,
  "totalQuestions": 30,
  "accuracyPercentage": 90.0,
  "duration": 1150,
  "partBreakdown": [
    {
      "part": 5,
      "correctCount": 27,
      "totalCount": 30,
      "accuracyPercentage": 90.0,
      "targetSeconds": 1200,
      "elapsedSeconds": 1150,
      "avgSecondsPerQuestion": 38.3
    }
  ],
  "results": [
    {
      "questionNumber": 101,
      "part": 5,
      "userAnswer": "C",
      "correctAnswer": "C",
      "isCorrect": true,
      "flagged": false,
      "timeSpentSeconds": 25
    }
  ],
  "newMistakes": []
}
```

### `GET /api/toeic/attempts/test/{testId}`
- Lấy danh sách lịch sử các lần thi của người dùng theo `testId`.
- Response:
```json
[
  {
    "id": "68b4e7...",
    "testId": "68a1f2...",
    "rawScore": 85,
    "scaledScore": 425,
    "totalQuestions": 100,
    "durationSeconds": 3600,
    "completedAt": "2026-08-21T09:15:00Z"
  }
]
```

### `GET /api/toeic/attempts/{attemptId}/review`
- Lấy chi tiết bài thi đã làm để xem lại song song với PDF đề thi.
- Response:
```json
{
  "id": "68b4e7...",
  "testId": "68a1f2...",
  "testTitle": "ETS 2024 Test 01",
  "pdfUrl": "/uploads/toeic/ets2024_01.pdf",
  "rawScore": 85,
  "scaledScore": 425,
  "totalQuestions": 100,
  "durationSeconds": 3600,
  "answers": [
    {
      "questionNumber": 101,
      "part": 5,
      "userAnswer": "C",
      "correctAnswer": "C",
      "isCorrect": true,
      "flagged": false,
      "timeSpentSeconds": 24,
      "aiExplanation": "Giải thích chi tiết từ AI..."
    }
  ]
}
```

### `GET /api/toeic/mistakes`
- Lấy danh sách toàn bộ câu hỏi làm sai trong Hàng đợi lỗi sai.
- Default query params: `size=1000`, sắp xếp `questionNumber ASC`.

### `GET /api/toeic/mistakes/prompt`
- Trích xuất System Prompt chuẩn hóa cho ChatGPT/Claude để giải thích các câu làm sai.

### `POST /api/toeic/mistakes/import-ai-review`
- Import JSON lời giải từ AI, tự động cập nhật vào `mistake_queue` và đồng bộ vào `test_attempts`.

---

### `GET /api/translator/translate` (Public)
- Query params: `text=hello`, `from=en`, `to=vi`
- Response:
```json
{
  "translatedText": "xin chào",
  "sourceLanguage": "en",
  "targetLanguage": "vi"
}
```
