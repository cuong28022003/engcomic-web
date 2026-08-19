# Chuyển EngComic_frontend từ React sang Angular (theo mô hình web-client)

## Tóm tắt & Bối cảnh

**EngComic_frontend** hiện tại là một ứng dụng React (v17) với Redux Toolkit, React Router v6, Axios, Firebase, SCSS, và ~24 trang/view. Backend là Spring Boot (`EngComic_backend`). Mục tiêu là chuyển sang Angular (v21+) theo cấu trúc module-based của **web-client** (Angular 21, Angular Material, RxJS, NgRx/Service-based state).

---

## Nên chuyển không? — Phân tích lợi/hại

### ✅ Lý do NÊN chuyển
| Yếu tố | Giải thích |
|--------|-----------|
| **Chuẩn hóa tech stack** | Nếu team đã biết Angular (từ web-client), việc dùng chung 1 framework giúp tái sử dụng pattern, components, CI/CD |
| **TypeScript nghiêm ngặt** | React hiện tại dùng `.js` thuần (không có `.ts`), dễ sinh bug ngầm; Angular bắt buộc TypeScript |
| **Dependency Injection & Services** | Angular có DI built-in, phù hợp với backend Spring Boot (cũng dùng DI) |
| **Lazy loading chuẩn** | web-client đã có pattern lazy load module sẵn, dễ copy sang |
| **HTTP Interceptor** | Angular Interceptor thay thế tốt cho Axios interceptor hiện tại |
| **Long-term maintainability** | Angular có opinionated structure rõ ràng, phù hợp dự án lớn lâu dài |

### ⚠️ Rủi ro & Chi phí
| Yếu tố | Mức độ |
|--------|--------|
| **Khối lượng công việc** | Lớn: ~24 views + ~30 components + 21 API files cần rewrite hoàn toàn |
| **Learning curve** | Nếu không quen Angular, thời gian làm quen Decorator, Module, RxJS |
| **Không có code sharing trực tiếp** | JSX/JS → TypeScript/HTML template, không thể copy-paste |
| **Thư viện thay thế** | Một số lib React-specific (lottie-react, react-toastify, canvas-confetti) cần tìm bản Angular tương đương |
| **Redux → NgRx/Services** | Phải viết lại toàn bộ state management |

> [!IMPORTANT]
> **Quyết định**: Nên chuyển nếu đây là dự án dài hạn và team đã có kinh nghiệm Angular từ web-client. Nếu deadline gấp hoặc đang trong sprint feature, hãy hoàn thiện React trước rồi migrate sau.

---

## Khảo sát hiện trạng

### EngComic_frontend (React)
- **Framework**: React 17, react-scripts 5
- **State**: Redux Toolkit + redux-persist (5 slices: language, message, modal + thêm)
- **Routing**: React Router v6 (~24 routes, có Private Route cho roles USER/ADMIN)
- **API Layer**: 21 file API (Axios-based: comicApi, chapterApi, authApi, deckApi, v.v.)
- **Styling**: SCSS + Tailwind CSS v4
- **Auth**: Firebase Auth + JWT
- **Misc**: GSAP animations, lottie-react, canvas-confetti, CKEditor, html2canvas, swiper

### web-client (Angular 21) — Mẫu tham chiếu
- **Structure**: `core/` (interceptors, services, guards) + `modules/` (lazy-loaded) + `shared/` (components, pipes, directives, models)
- **API**: Auto-generated OpenAPI client (`gateway-api/`)
- **Auth**: Azure MSAL + Firebase
- **i18n**: `@ngx-translate/core`
- **UI**: Angular Material 21 + Bootstrap 5
- **State**: Service-based (BehaviorSubject/RxJS), không dùng NgRx

---

## Proposed Changes (Kế hoạch thực hiện)

### Phase 0 — Chuẩn bị (1–2 ngày)

#### [NEW] `EngComic_frontend_angular/` (thư mục mới song song)
- Khởi tạo dự án Angular 21 mới với `ng new`
- Không xóa React project cũ, giữ nguyên để tham chiếu

---

### Phase 1 — Skeleton & Core Infrastructure (3–5 ngày)

#### [NEW] `angular.json`, `tsconfig.json`, `package.json`
- Cấu hình Angular project tương tự web-client
- Cài dependencies: `@angular/material`, `@ngx-translate`, `firebase`, `rxjs`, `jwt-decode`, `uuid`, `swiper`

#### [NEW] `src/app/app.module.ts`
- Import: BrowserModule, BrowserAnimationsModule, HttpClientModule, RouterModule, TranslateModule
- Providers: Firebase config, HTTP interceptors

#### [NEW] `src/app/core/`
- `core.module.ts` + `core-routing.module.ts`
- `interceptors/auth.interceptor.ts` — thay thế Axios interceptor (tự động gắn JWT token, refresh token)
- `guards/auth.guard.ts` — thay thế PrivateRoute (kiểm tra role USER/ADMIN)
- `services/auth.service.ts` — Firebase Auth + JWT, thay thế authApi.js + redux auth slice
- `services/storage.service.ts` — LocalStorage/SessionStorage wrapper

#### [NEW] `src/app/shared/`
- `models/` — Interface TypeScript cho Comic, Chapter, Deck, Card, User, v.v. (mapping từ backend DTOs)
- `pipes/` — SafeHtml, truncate, v.v.
- `components/` — Loading spinner, NoData, Pagination, ConfirmDialog (dùng Angular Material Dialog)
- `const/route.ts` — Định nghĩa tất cả route constants (thay routeLink trong AppRoutes.js)
- `shared.module.ts` — Export tất cả shared components/pipes

---

### Phase 2 — API Services Layer (2–3 ngày)

#### [NEW] `src/app/services/` (hoặc dùng cấu trúc gateway-api như web-client)
Tạo Angular Services thay thế 21 file API Axios hiện tại:

| React (Axios) | Angular (HttpClient Service) |
|---|---|
| `apiMain.js` | `api-base.service.ts` (base URL, error handling) |
| `authApi.js` | `auth-api.service.ts` |
| `comicApi.js` | `comic-api.service.ts` |
| `chapterApi.js` | `chapter-api.service.ts` |
| `deckApi.js` | `deck-api.service.ts` |
| `cardApi.js` | `card-api.service.ts` |
| `userApi.js` | `user-api.service.ts` |
| `gachaApi.js` | `gacha-api.service.ts` |
| `rankApi.js` | `rank-api.service.ts` |
| `ratingApi.js` | `rating-api.service.ts` |
| `savedApi.js` | `saved-api.service.ts` |
| `topupApi.js` | `topup-api.service.ts` |
| `reportApi.js` | `report-api.service.ts` |
| `readingApi.js` | `reading-api.service.ts` |
| `translatorApi.js` | `translator-api.service.ts` |
| `characterApi.js` | `character-api.service.ts` |
| `userStatsApi.js` | `user-stats-api.service.ts` |

Tất cả return `Observable<T>` thay vì `Promise`.

---

### Phase 3 — State Management (2 ngày)

Redux Toolkit → Angular Services với RxJS BehaviorSubject (theo pattern của web-client):

| Redux Slice | Angular Service |
|---|---|
| `languageSlice` | `LanguageService` (BehaviorSubject + TranslateService) |
| `messageSlice` | `ToastService` / `SnackbarService` (Angular Material Snackbar) |
| `modalSlice` | `ModalService` (Angular Material Dialog) |
| `userSlice` (auth state) | `AuthService.currentUser$` (BehaviorSubject) |

---

### Phase 4 — Lazy-loaded Feature Modules (7–10 ngày)

Tổ chức theo cấu trúc module của web-client:

```
src/app/modules/
  ├── comics/           # ComicList, ComicDetail, CreateAndEditComic
  ├── chapters/         # ChapterList, ChapterDetail, CreateOrEditChapter
  ├── reading/          # Reading experience
  ├── deck/             # Deck, DeckDetail, CreateDeck, Study, Result
  ├── gacha/            # Gacha, Collection
  ├── account/          # Profile, Bookshelf, ChangePassword, Rank, TopupHistory
  ├── home/             # HomePage, Search, Leaderboard
  ├── premium/          # Premium, DiamondTopup
  ├── fighting-game/    # FightingGame
  └── admin/            # UserManagement, ComicManagement, ReportManagement, RankManagement, TopupManagement
```

Mỗi module có cấu trúc:
```
comics/
  ├── comics.module.ts
  ├── comics-routing.module.ts
  ├── components/
  └── services/
```

---

### Phase 5 — Shared Components Migration (3–4 ngày)

| React Component | Angular Component |
|---|---|
| `Header/` | `HeaderComponent` trong `core/components/` |
| `Footer/` | `FooterComponent` trong `shared/components/` |
| `ComicCard/` | `ComicCardComponent` trong `shared/components/` |
| `Pagination/` | `PaginationComponent` (hoặc dùng Angular Material Paginator) |
| `Loading/`, `LoadingSpinner/` | `LoadingComponent` + `LoadingService` |
| `Modal/` | Angular Material `MatDialog` |
| `Comment.js` | `CommentComponent` |
| `Auth/` | `LoginComponent` trong `core/components/` |
| `ConfirmDialog/` | `ConfirmDialogComponent` với MatDialog |
| `GachaCard/`, `GachaPack/` | Trong `gacha/components/` |

---

### Phase 6 — Styling Migration (2–3 ngày)

- Giữ lại SCSS files, chuyển đổi global styles sang `styles.scss` của Angular
- Import Bootstrap 5 (như web-client) thay cho Tailwind CSS
- Hoặc giữ Tailwind nếu team quen hơn (cần cấu hình `angular.json`)
- Angular Material theming: tạo custom theme trong `shared/theme/`

> [!NOTE]
> Nếu dùng Angular Material Dialog/Snackbar/Table, có thể bỏ nhiều custom components. Cân nhắc dùng Material tối đa để giảm công việc.

---

### Phase 7 — Animation & Third-party Libraries (2 ngày)

| React Library | Angular Equivalent |
|---|---|
| `lottie-react` | `ngx-lottie` |
| `react-toastify` | Angular Material Snackbar hoặc `ngx-toastr` |
| `canvas-confetti` | Dùng trực tiếp (vanilla JS) trong component |
| `swiper` | `swiper/angular` hoặc `swiper/element` (Web Component) |
| `gsap` | Dùng trực tiếp (framework-agnostic) |
| `@ckeditor/ckeditor5-react` | `@ckeditor/ckeditor5-angular` |
| `html2canvas` | Dùng trực tiếp |
| `react-icons` | Font Awesome hoặc Angular Material Icons |

---

### Phase 8 — Testing & CI/CD (2 ngày)

- Unit test với Karma/Jasmine (như web-client)
- Update CI/CD scripts nếu có
- Cập nhật README

---

## Verification Plan

### Automated Tests
```bash
ng test --code-coverage
ng build --configuration=production
```

### Manual Verification
Kiểm tra từng flow chính:
1. Đăng ký / Đăng nhập / Active account
2. Duyệt comic list, xem comic detail
3. Đọc chapter (ChapterDetail)
4. Tạo/sửa comic, tạo/sửa chapter
5. Deck & Study flow
6. Gacha
7. Admin panel (tất cả tab)
8. Payment flow (DiamondTopup, Premium)
9. Profile, Bookshelf, Rank, Collection

---

## Ước tính thời gian tổng

| Phase | Thời gian |
|-------|-----------|
| Phase 0 — Chuẩn bị | 1–2 ngày |
| Phase 1 — Core Infrastructure | 3–5 ngày |
| Phase 2 — API Services | 2–3 ngày |
| Phase 3 — State Management | 2 ngày |
| Phase 4 — Feature Modules (24 views) | 7–10 ngày |
| Phase 5 — Shared Components | 3–4 ngày |
| Phase 6 — Styling | 2–3 ngày |
| Phase 7 — Third-party Libs | 2 ngày |
| Phase 8 — Testing & Polish | 2 ngày |
| **Tổng** | **~24–33 ngày làm việc** |

> [!WARNING]
> Đây là ước tính cho **1 developer** có kinh nghiệm Angular. Nếu mới học Angular, nhân 1.5–2x. Nếu có 2 người làm song song, có thể rút xuống 15–20 ngày.

---

## Open Questions

> [!IMPORTANT]
> Cần xác nhận trước khi bắt đầu:

1. **Dự án mới hay rename?** Tạo repo mới `EngComic_angular` hay làm thẳng vào `EngComic_frontend` (thay toàn bộ nội dung)?
2. **Angular version**: Dùng Angular 21 như web-client, hay Angular 19/20 LTS?
3. **Styling**: Giữ SCSS + Tailwind như hiện tại hay chuyển sang Angular Material + Bootstrap như web-client?
4. **State management**: Service + BehaviorSubject (như web-client, đơn giản hơn) hay dùng NgRx (giống Redux hơn nhưng phức tạp hơn)?
5. **Phạm vi**: Migration toàn bộ một lúc hay làm từng module, giữ React deploy trong khi Angular đang phát triển?
