# Kiến trúc Hệ thống — EngComic Angular

## 1. Tổng quan kiến trúc

EngComic Angular áp dụng kiến trúc **Feature-based Standalone Components** theo chuẩn **Angular 21 (Zoneless Change Detection)**, loại bỏ hoàn toàn `zone.js` và `NgModule` để đạt hiệu năng tối đa.

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │             AppComponent (Shell)              │   │
│  │  ┌────────┐  ┌────────────────┐  ┌────────┐  │   │
│  │  │ Header │  │  Router Outlet  │  │ Footer │  │   │
│  │  └────────┘  │  (Lazy Pages)  │  └────────┘  │   │
│  │              └────────────────┘               │   │
│  │  ┌─────────────────────────────────────────┐  │   │
│  │  │          ToastContainerComponent        │  │   │
│  │  └─────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────────────────┐  ┌────────────────────────┐  │
│  │   Core Services    │  │   Shared Components    │  │
│  │  • AuthService     │  │  • ComicCardComponent  │  │
│  │  • ToastService    │  │  • ...                 │  │
│  │  • UserStateService│  └────────────────────────┘  │
│  │  • *ApiService     │                              │
│  └────────────────────┘                              │
└─────────────────────────────────────────────────────┘
                        │ HTTP (JWT)
                        ▼
       ┌──────────────────────────────┐
       │  EngComic_backend (Spring Boot│
       │  http://localhost:8080/api)  │
       └──────────────────────────────┘
```

---

## 2. Các lớp kiến trúc

### 2.1 Core Layer (`src/app/core/`)

**Nguyên tắc**: Chỉ khởi tạo một lần (`providedIn: 'root'`). Không bao giờ import vào `SharedModule`.

| File | Mục đích |
|---|---|
| `auth.service.ts` | JWT decode, login/logout/refresh, `currentUser$` stream |
| `storage.service.ts` | Type-safe `localStorage` / `sessionStorage` wrapper |
| `toast.service.ts` | Global notification: `success()`, `error()`, `warning()`, `info()` |
| `user-state.service.ts` | Reactive state: XP, Diamonds, Streak, Character team |
| `api-base.service.ts` | Base HTTP: `get<T>()`, `post<T>()`, `postForm<T>()`, `put<T>()`, `delete<T>()` |
| `auth.interceptor.ts` | Tự động attach `Authorization: Bearer <token>`, xử lý 401 & token refresh |
| `auth.guard.ts` | `authGuard`: yêu cầu đăng nhập; `adminGuard`: yêu cầu role ADMIN |

### 2.2 Shared Layer (`src/app/shared/`)

**Nguyên tắc**: Các component/model/constant dùng chung giữa nhiều feature. Không chứa business logic.

```
shared/
├── components/
│   ├── header/          # Navbar, tìm kiếm, streak, diamonds
│   ├── footer/          # Footer links
│   ├── comic-card/      # Card truyện tranh có thể tái sử dụng
│   └── toast-container/ # Hiển thị toast notifications
├── constants/
│   ├── route.ts         # Enum-like ROUTE object + FULL_ROUTE
│   └── genres.ts        # Array thể loại + độ tuổi
└── models/
    └── index.ts         # Tất cả TypeScript interfaces (Single Source of Truth)
```

### 2.3 Feature Layer (`src/app/features/`)

**Nguyên tắc**: Mỗi feature là một thư mục độc lập, lazy-loaded. Các feature không import lẫn nhau trực tiếp.

```
features/
├── auth/           { LoginComponent, RegisterComponent, ActiveComponent }
├── home/           { HomeComponent, SearchComponent, LeaderboardComponent }
├── comics/         { ComicListComponent, ComicDetailComponent, CreateEditComicComponent }
├── chapters/       { ChapterDetailComponent, ChapterListComponent, CreateEditChapterComponent }
├── deck/           { DeckListComponent, DeckDetailComponent, DeckFormComponent, CardFormComponent }
├── study/          { StudyComponent, ResultComponent }
├── gacha/          { GachaComponent }
├── premium/        { PremiumComponent, DiamondTopupComponent }
├── fighting-game/  { FightingGameComponent }
├── account/        { AccountComponent (shell), ProfileComponent, BookshelfComponent, ... }
└── admin/          { AdminComponent (shell), UserManagementComponent, ... }
```

---

## 3. Quản lý State (State Management)

Dự án sử dụng pattern **Service + BehaviorSubject** (không có NgRx/Akita).

### AuthService — `currentUser$`
```typescript
// Đọc user hiện tại
const user = this.auth.currentUser; // synchronous getter

// Lắng nghe thay đổi
this.auth.currentUser$.subscribe(user => { ... });

// Đăng nhập
this.auth.login(response); // lưu vào localStorage + emit

// Đăng xuất
this.auth.logout(); // xóa localStorage + emit null
```

### UserStateService — `userStats$`
```typescript
// Lắng nghe thống kê người dùng
this.userState.userStats$.subscribe(stats => {
  // stats.xp, stats.diamonds, stats.streakDays, stats.rank
});

// Cập nhật diamonds
this.userState.deductDiamonds(100);
this.userState.addDiamonds(50);
```

### ToastService
```typescript
this.toast.success('Lưu thành công!');
this.toast.error('Đã xảy ra lỗi');
this.toast.warning('Cảnh báo');
this.toast.info('Thông tin');
```

---

## 4. HTTP & API Pattern

### Sử dụng ApiBaseService
```typescript
// Inject API service cụ thể
private comicApi = inject(ComicApiService);

// GET với params
this.comicApi.getComics({ page: 0, size: 12, genre: 'Action' }).subscribe(...)

// POST với JSON body
this.comicApi.rateComic(comicId, { rating: 5 }).subscribe(...)

// POST multipart form
const fd = new FormData();
fd.append('title', title);
fd.append('coverImage', file);
this.comicApi.createComic(fd).subscribe(...)
```

### Response từ Spring Boot (Pagination)
```typescript
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;      // current page (0-indexed)
  size: number;
}
```

### AuthInterceptor — Xử lý tự động
- Attach `Authorization: Bearer <accessToken>` cho tất cả request
- Skip các endpoint public: `/auth/login`, `/auth/register`, `/active`
- Nếu response 401: tự động gọi `/auth/refresh` và retry request gốc
- Nếu refresh thất bại: logout và redirect về `/login`

---

## 5. Routing Strategy

- **Lazy Loading**: Mỗi component được load theo route, không load trước
- **withComponentInputBinding()**: Params từ URL được tự động bind vào `@Input()` của component
- **Guards**: 
  - `authGuard` — kiểm tra `AuthService.isAuthenticated()`
  - `adminGuard` — kiểm tra role `ADMIN` trong JWT claims

### Pattern route trong component:
```typescript
// Lấy :comicId từ route params
private route = inject(ActivatedRoute);

ngOnInit() {
  this.route.params.subscribe(params => {
    this.comicId = params['comicId'];
    this.loadComic();
  });
}
```

---

## 6. Design System

File chính: `src/styles.scss`

### CSS Custom Properties (Tokens)
```scss
:root {
  // Colors
  --primary-color: #ff3377;
  --primary-gradient: linear-gradient(135deg, #ff3377, #c026d3);
  --bg-main: #0e0f1a;
  --bg-card: #161926;
  --bg-card-hover: #1e2133;
  --border-color: rgba(255, 255, 255, 0.07);
  
  // Text
  --text-main: #e8eaf0;
  --text-muted: #8892a4;
  --text-dim: #5a6378;
  
  // Feedback
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  
  // Spacing
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 18px;
  --radius-full: 9999px;
}
```

### Utility Classes (sẵn dùng trong mọi component)
```html
<!-- Glass panel -->
<div class="glass-panel">...</div>

<!-- Badges -->
<span class="badge badge-primary">New</span>
<span class="badge badge-vip">VIP</span>
<span class="badge badge-genre">Action</span>

<!-- Buttons -->
<button class="btn-primary">Save</button>
<button class="btn-secondary">Cancel</button>
<button class="btn-icon"><i class="fa-solid fa-trash"></i></button>

<!-- Container layout -->
<div class="container">...</div>
```

---

## 7. Models & Interfaces

Tất cả types được định nghĩa tập trung tại `src/app/shared/models/index.ts`.

Xem [API_REFERENCE.md](./API_REFERENCE.md) để biết chi tiết từng model và endpoint tương ứng.
