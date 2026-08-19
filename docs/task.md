# Task: Migrate EngComic_frontend → Angular

## Phase 0 — Chuẩn bị
- `[x]` Khởi tạo Angular project `EngComic_angular` với `ng new`
- `[x]` Cấu hình paths alias trong `tsconfig.json`
- `[x]` Cài thêm dependencies (@angular/material@19, @angular/cdk@19, firebase, jwt-decode, uuid, @angular/animations)

## Phase 1 — Core Infrastructure
- `[x]` Project skeleton (standalone Angular 19 style)
- `[x]` Cấu hình `app.config.ts` với HttpClient + AuthInterceptor + Animations
- `[x]` Tạo `AuthInterceptor` (JWT auto-attach + token refresh)
- `[x]` Tạo `AuthGuard` + `AdminGuard` (thay PrivateRoute, kiểm tra role USER/ADMIN)
- `[x]` Tạo `AuthService` (JWT decode, login/logout/refresh, Firebase init)
- `[x]` Tạo `StorageService` (type-safe localStorage wrapper)
- `[x]` Tạo `environments/` (dev + prod)
- `[x]` Tạo SharedModule models TypeScript (Comic, Chapter, Deck, Card, User, GachaCharacter...)
- `[x]` Tạo route constants (`ROUTE`, `FULL_ROUTE`)
- `[x]` Scaffold tất cả 36 feature components (placeholder)
- `[x]` Build thành công ✅ + Dev server chạy ở http://localhost:4201

## Phase 2 — API Services Layer
- `[x]` `ApiBaseService` (base URL, typed get/post/put/delete/form helpers)
- `[x]` `AuthApiService` (đã tích hợp trong AuthService)
- `[x]` `ComicApiService`
- `[x]` `ChapterApiService`
- `[x]` `DeckApiService`
- `[x]` `CardApiService`
- `[x]` `UserApiService`
- `[x]` `GachaApiService`
- `[x]` `RankApiService`
- `[x]` `RatingApiService`
- `[x]` `SavedApiService`
- `[x]` `TopupApiService`
- `[x]` `ReportApiService`
- `[x]` `ReadingApiService`
- `[x]` `TranslatorApiService`
- `[x]` `CharacterApiService`
- `[x]` `CharacterUsageApiService`
- `[x]` `UserStatsApiService`
- `[x]` `AdminApiService` (comments + admin user/comic management)

## Phase 3 — State Management (Services)
- `[x]` `AuthService.currentUser$` (BehaviorSubject — login/logout/update)
- `[x]` `ToastService` (thay react-toastify + messageSlice)
- `[x]` `UserStateService` (thay userStats + reward + character + adultMode slices)
- `[ ]` Tích hợp Language/i18n service (nếu cần)

## Phase 4 — Feature Modules
- `[ ]` `HomeModule` (HomePage, Search, Leaderboard)
- `[ ]` `ComicsModule` (ComicList, ComicDetail, CreateAndEditComic)
- `[ ]` `ChaptersModule` (ChapterList, ChapterDetail, CreateOrEditChapter)
- `[ ]` `DeckModule` (Deck, DeckDetail, CreateDeck, Study, Result)
- `[ ]` `GachaModule` (Gacha, Collection)
- `[ ]` `AccountModule` (Profile, Bookshelf, ChangePassword, Rank, TopupHistory)
- `[ ]` `PremiumModule` (Premium, DiamondTopup)
- `[ ]` `FightingGameModule`
- `[ ]` `AdminModule` (User, Comic, Report, Rank, Topup Management)

## Phase 5 — Shared Components
- `[ ]` `HeaderComponent`
- `[ ]` `FooterComponent`
- `[ ]` `ComicCardComponent`
- `[ ]` `PaginationComponent`
- `[ ]` `LoadingComponent`
- `[ ]` `CommentComponent`
- `[ ]` `ConfirmDialogComponent`
- `[ ]` `GachaCardComponent`, `GachaPackComponent`
- `[ ]` `NoDataComponent`

## Phase 6 — Styling
- `[ ]` Global styles SCSS
- `[ ]` Angular Material theme
- `[ ]` Component-level SCSS migration

## Phase 7 — Third-party Libraries
- `[ ]` ngx-lottie (thay lottie-react)
- `[ ]` Snackbar (thay react-toastify)
- `[ ]` Swiper element
- `[ ]` GSAP (direct)
- `[ ]` CKEditor Angular
- `[ ]` canvas-confetti (vanilla)

## Phase 8 — Testing & Polish
- `[ ]` Unit tests setup
- `[ ]` Build production verify
- `[ ]` README update
