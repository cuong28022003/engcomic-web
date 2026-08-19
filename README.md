# EngComic Angular

> **Frontend Angular cho nền tảng học tiếng Anh qua truyện tranh EngComic.**
> Được chuyển đổi từ React 17 sang Angular 19 với kiến trúc Standalone Component hiện đại.

---

## 📖 Giới thiệu

EngComic là nền tảng học tiếng Anh thông qua truyện tranh, kết hợp các tính năng:
- 📚 **Đọc truyện tranh tiếng Anh** với từ điển tra ngay trong khi đọc
- 🃏 **Flashcard SRS (Spaced Repetition System)** học từ vựng ngữ cảnh
- 🎴 **Gacha** triệu hồi tướng và bộ sưu tập nhân vật
- ⚔️ **Minigame đấu trường** dựa trên từ vựng đã học
- 🏆 **Bảng xếp hạng học giả** & hệ thống cấp bậc
- 💎 **VIP Premium** & nạp kim cương

---

## 🛠️ Tech Stack

| Layer | Công nghệ |
|---|---|
| **Framework** | Angular 19 (Standalone Components) |
| **UI Library** | Angular Material 19 + SCSS |
| **HTTP Client** | Angular HttpClient + Interceptors |
| **State Management** | RxJS BehaviorSubject Services |
| **Routing** | Angular Router (Lazy Loading) |
| **Auth** | JWT + Firebase Storage |
| **Backend** | Spring Boot 3 (`http://localhost:8080/api`) |

---

## 📁 Cấu trúc thư mục

```
EngComic_angular/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services, interceptors, guards
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts    # authGuard + adminGuard
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts  # JWT auto-attach + refresh
│   │   │   └── services/
│   │   │       ├── auth.service.ts       # Login/logout/JWT decode
│   │   │       ├── storage.service.ts    # localStorage type-safe wrapper
│   │   │       ├── toast.service.ts      # Global toast notifications
│   │   │       ├── user-state.service.ts # XP/Diamonds/Streak reactive state
│   │   │       ├── api-base.service.ts   # Base HTTP helpers
│   │   │       └── *-api.service.ts      # 18 typed API services
│   │   │
│   │   ├── shared/                  # Reusable components + models + constants
│   │   │   ├── components/
│   │   │   │   ├── header/          # Sticky navbar
│   │   │   │   ├── footer/          # Site footer
│   │   │   │   ├── comic-card/      # Comic thumbnail card
│   │   │   │   └── toast-container/ # Floating toast UI
│   │   │   ├── constants/
│   │   │   │   ├── route.ts         # ROUTE + FULL_ROUTE path constants
│   │   │   │   └── genres.ts        # ComicGenres + AgeRatings arrays
│   │   │   └── models/
│   │   │       └── index.ts         # All TypeScript interfaces
│   │   │
│   │   ├── features/                # Lazy-loaded page components
│   │   │   ├── auth/                # Login, Register, Active
│   │   │   ├── home/                # Home, Search, Leaderboard
│   │   │   ├── comics/              # ComicList, ComicDetail, CreateEdit
│   │   │   ├── chapters/            # ChapterDetail (reader), CreateEdit
│   │   │   ├── deck/                # DeckList, DeckDetail, DeckForm, CardForm
│   │   │   ├── study/               # StudyComponent (SRS), ResultComponent
│   │   │   ├── gacha/               # GachaComponent
│   │   │   ├── premium/             # PremiumComponent, DiamondTopup
│   │   │   ├── fighting-game/       # FightingGameComponent (RPG minigame)
│   │   │   ├── account/             # AccountComponent + tabs (Profile, Bookshelf, ...)
│   │   │   ├── admin/               # AdminComponent + tabs (Users, Comics, ...)
│   │   │   └── not-found/           # 404 page
│   │   │
│   │   ├── app.routes.ts            # Centralized routing với lazy loading
│   │   ├── app.config.ts            # providers (HttpClient, Interceptors, Router, Animations)
│   │   └── app.component.ts         # Shell: Header + Router Outlet + Footer + Toast
│   │
│   ├── environments/
│   │   ├── environment.ts           # Dev: apiUrl = http://localhost:8080/api
│   │   └── environment.prod.ts      # Prod config
│   │
│   ├── styles.scss                  # Global dark-mode design system + CSS tokens
│   └── index.html                   # Google Fonts (Plus Jakarta Sans, Press Start 2P), FA6, Material Icons CDN
│
├── ARCHITECTURE.md
├── API_REFERENCE.md
├── DEVELOPMENT_GUIDE.md
└── README.md
```

---

## 🚀 Khởi động nhanh

### Yêu cầu
- Node.js >= 18
- Angular CLI >= 19 (`npm i -g @angular/cli`)
- Backend `EngComic_backend` chạy ở port 8080

### Cài đặt

```bash
cd EngComic_angular
npm install
```

### Chạy dev server

```bash
ng serve --port 4201
# Truy cập http://localhost:4201
```

### Build production

```bash
ng build --configuration=production
```

---

## 🔑 Tài khoản mặc định (dev)

| Vai trò | Email | Password |
|---|---|---|
| Admin | admin@engcomic.com | admin123 |
| User | user@engcomic.com | user123 |

---

## 🗺️ Routing Overview

| Route | Component | Guard |
|---|---|---|
| `/` | HomeComponent | — |
| `/search` | SearchComponent | — |
| `/leaderboard` | LeaderboardComponent | — |
| `/login` | LoginComponent | — |
| `/register` | RegisterComponent | — |
| `/comics` | ComicListComponent | — |
| `/comics/:id` | ComicDetailComponent | — |
| `/comics/:id/chapters/:cid` | ChapterDetailComponent | — |
| `/comics/create` | CreateEditComicComponent | authGuard |
| `/user/:userId/*` | AccountComponent + tabs | authGuard |
| `/deck` | DeckListComponent | authGuard |
| `/study/:deckId` | StudyComponent | authGuard |
| `/gacha` | GachaComponent | authGuard |
| `/premium` | PremiumComponent | authGuard |
| `/diamond-topup` | DiamondTopupComponent | authGuard |
| `/game` | FightingGameComponent | authGuard |
| `/admin/*` | AdminComponent + tabs | adminGuard |

---

## 📌 Dự án liên quan

- **[EngComic_backend](../EngComic_backend)** — Spring Boot 3 REST API
- **[EngComic_frontend](../EngComic_frontend)** — React 17 (phiên bản cũ, deprecated)
