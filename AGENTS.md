# AI Agent Rules — EngComic Angular

> Đây là file hướng dẫn cho AI assistant làm việc với project này.
> Đọc file này **trước tiên** trước khi làm bất kỳ thay đổi nào.

---

## 📚 Tài liệu cần đọc theo thứ tự

Khi nhận task mới, AI phải đọc theo thứ tự ưu tiên:

1. **`specs/`** — Thư mục đặc tả từng tính năng (`spec.md` cho yêu cầu, `plan.md` cho kiến trúc frontend, `tasks.md` cho checklist thực thi). Khi làm feature mới, copy từ `specs/000-template/`.
2. **`BACKEND_CONTRACT.md`** — Đọc trước khi viết bất kỳ API call nào. Chứa response format thực tế, field name thực tế, và các bugs đã fix.
3. **`UI_STYLE_GUIDE.md`** — Đọc trước khi viết bất kỳ UI/template/style nào. Chứa color tokens, component patterns, animation rules, DO/DON'T.
4. **`ARCHITECTURE.md`** — Đọc khi cần thêm feature mới hoặc refactor. Chứa cấu trúc folder, pattern, design system tokens.
5. **`DEVELOPMENT_GUIDE.md`** — Đọc khi cần biết cách đặt tên, tạo component/service/model mới.
6. **`API_REFERENCE.md`** — Tham khảo danh sách endpoint. Nhưng **luôn ưu tiên** `BACKEND_CONTRACT.md` nếu có mâu thuẫn.
7. **`README.md`** — Tổng quan project.

---

## ⚠️ Quy tắc bắt buộc

### 1. Không giả định field name của backend
Backend EngComic_backend **không** dùng camelCase chuẩn nhất quán. Trước khi code:
- Kiểm tra `BACKEND_CONTRACT.md`
- Hoặc xem file `*Controller.java` tương ứng trong `EngComic_backend/src/main/java/mobile/apis/`
- Đặc biệt: Comic dùng `name` (không phải `title`), `imageUrl` (không phải `coverImage`), `genre` string (không phải `genres` array)

### 2. Không giả định endpoint path
- Kiểm tra `BACKEND_CONTRACT.md` hoặc dùng `grep @RequestMapping` trong backend
- Đặc biệt: `/api/ratings` (có `s`), `/api/comment?comicUrl=` (query param), `/api/userstats/me`

### 3. Không dùng relative path trong AuthService
`AuthService` gọi thẳng đến backend, KHÔNG đi qua `ApiBaseService`:
```typescript
// ✅ Đúng
private readonly BASE = `${environment.apiUrl}/auth`;

// ❌ Sai — gọi vào Angular dev server
private readonly BASE = '/auth';
```

### 4. Luôn unwrap response envelope khi cần
Backend auth trả về `{ success, data: { id, username, ... } }` — không phải `CurrentUser` trực tiếp.
`AuthService.login()` đã xử lý mapping này — đừng thay đổi hàm `login()` mà không đọc kỹ.

### 5. Không hardcode port hay origin vào CORS
CORS được cấu hình bằng `allowedOriginPatterns("http://localhost:*")` ở backend.
Không cần sửa Angular để fix CORS — sửa backend `CorsConfig.java`.

### 6. Luôn chạy `ng build` để verify trước khi kết luận "done"
```bash
cd d:\Others\my-projects\EngComic_angular
npx ng build --configuration=development
```
Build phải **không có lỗi** (warnings về `?.` là chấp nhận được).

---

## 🗂️ Cấu trúc Services quan trọng

### Các service dùng `ApiBaseService` (gọi qua `environment.apiUrl`):
- `ComicApiService`, `ChapterApiService`, `DeckApiService`, `CardApiService`
- `UserApiService`, `UserStatsApiService`, `GachaApiService`
- `RatingApiService`, `SavedApiService`, `TopupApiService`, `ReportApiService`
- `ReadingApiService`, `TranslatorApiService`, `CharacterApiService`, `AdminApiService`

### Các service **KHÔNG** dùng `ApiBaseService`:
- **`AuthService`** — Dùng `HttpClient` trực tiếp với `BASE = \`${environment.apiUrl}/auth\``

---

## 🎨 Design System — Class names chuẩn

Dùng các class sau thay vì viết CSS inline:

```html
<!-- Layout panels -->
<div class="glass-panel">      <!-- Dark glassmorphism card -->
<div class="container">        <!-- Max-width container -->
<div class="page-header">      <!-- Page title section -->

<!-- Buttons -->
<button class="btn-primary">   <!-- Pink gradient CTA -->
<button class="btn-secondary"> <!-- Outline button -->
<button class="btn-icon">      <!-- Icon-only round button -->

<!-- Badges -->
<span class="badge badge-primary">   <!-- Pink badge -->
<span class="badge badge-vip">       <!-- Gold VIP badge -->
<span class="badge badge-genre">     <!-- Dark genre tag -->

<!-- Feedback -->
<span class="loading-spinner">
<div class="empty-state">
```

CSS tokens dùng trong `styles` của component:
```scss
var(--primary-color)     // #ff3377
var(--bg-card)           // #161926
var(--bg-main)           // #0e0f1a
var(--text-muted)        // #8892a4
var(--border-color)      // rgba(255,255,255,0.07)
var(--success-color)     // #10b981
var(--danger-color)      // #ef4444
var(--radius-md)         // 10px
var(--radius-lg)         // 18px
```

---

## 📦 Model conventions

- Tất cả interfaces trong `src/app/shared/models/index.ts`
- Import: `import { Comic } from '@models/index'`
- Khi thêm field mới vào interface, thêm `?` optional vì backend có thể không trả về tất cả fields
- `Comic` interface hỗ trợ cả `name` và `title` (cả hai optional) vì backend không nhất quán

---

## 🔀 Pattern async trong components

```typescript
// ✅ Luôn handle cả next + error
this.someApi.getData().subscribe({
  next: (data) => {
    this.data = data;
    this.loading = false;
  },
  error: () => {
    this.toast.error('Không tải được dữ liệu');
    this.loading = false;
  }
});

// ❌ Không dùng .subscribe(callback) một mình
this.someApi.getData().subscribe(data => this.data = data);
```

---

## 🗺️ Path Aliases

```typescript
@core/*      → src/app/core/*
@shared/*    → src/app/shared/*
@features/*  → src/app/features/*
@models/*    → src/app/shared/models/*
@services/*  → src/app/core/services/*
@env/*       → src/environments/*
```
