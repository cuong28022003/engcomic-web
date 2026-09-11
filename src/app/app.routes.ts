import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { ROUTE } from './shared/constants/route';

export const routes: Routes = [
  // 1. Public Routes
  {
    path: ROUTE.HOME,
    data: { route: ROUTE.HOME, title: 'Trang Chủ - EngComic' },
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: ROUTE.SEARCH,
    data: { route: ROUTE.SEARCH, title: 'Tìm Kiếm' },
    loadComponent: () =>
      import('./features/home/search/search.component').then(
        (m) => m.SearchComponent
      ),
  },
  {
    path: 'comics',
    redirectTo: ROUTE.SEARCH,
    pathMatch: 'full',
  },
  {
    path: 'comics/:comicId',
    redirectTo: ROUTE.SEARCH,
  },
  {
    path: ROUTE.LEADERBOARD,
    data: { route: ROUTE.LEADERBOARD, title: 'Bảng Xếp Hạng' },
    loadComponent: () =>
      import('./features/home/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent
      ),
  },
  {
    path: ROUTE.LOGIN,
    data: { route: ROUTE.LOGIN, title: 'Đăng Nhập' },
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: ROUTE.REGISTER,
    data: { route: ROUTE.REGISTER, title: 'Đăng Ký' },
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: `${ROUTE.ACTIVE}/:token`,
    data: { route: ROUTE.ACTIVE, title: 'Kích Hoạt Tài Khoản' },
    loadComponent: () =>
      import('./features/auth/active/active.component').then(
        (m) => m.ActiveComponent
      ),
  },

  // 2. Protected Features (User Authenticated)
  {
    path: ROUTE.MAIN,
    canActivate: [authGuard],
    children: [
      // TOEIC Reader Module
      {
        path: ROUTE.READER,
        data: { route: ROUTE.READER },
        loadChildren: () =>
          import('./features/reader/reader.routes').then((m) => m.READER_ROUTES),
      },

      // Vocab Vault Module
      {
        path: ROUTE.VOCAB,
        data: { route: ROUTE.VOCAB },
        loadChildren: () =>
          import('./features/vocab/vocab.routes').then((m) => m.VOCAB_ROUTES),
      },

      // Grammar Vault Module
      {
        path: ROUTE.GRAMMAR,
        data: { route: ROUTE.GRAMMAR, title: 'Thư Viện Ngữ Pháp TOEIC' },
        loadComponent: () =>
          import('./features/grammar/grammar-dashboard/grammar-dashboard.component').then(
            (m) => m.GrammarDashboardComponent
          ),
      },

      // Flashcards Deck Module
      {
        path: ROUTE.DECK,
        data: { route: ROUTE.DECK },
        loadChildren: () =>
          import('./features/deck/deck.routes').then((m) => m.DECK_ROUTES),
      },
      {
        path: `${ROUTE.STUDY}/:deckId`,
        data: { route: ROUTE.STUDY, title: 'Ôn Tập Flashcards' },
        loadComponent: () =>
          import('./features/study/study.component').then(
            (m) => m.StudyComponent
          ),
      },
      {
        path: `${ROUTE.RESULT}/:deckId`,
        data: { route: ROUTE.RESULT, title: 'Kết Quả Ôn Tập' },
        loadComponent: () =>
          import('./features/study/result/result.component').then(
            (m) => m.ResultComponent
          ),
      },

      // User Account Module
      {
        path: `${ROUTE.USER}/:userId`,
        data: { route: ROUTE.USER },
        loadChildren: () =>
          import('./features/account/account.routes').then(
            (m) => m.ACCOUNT_ROUTES
          ),
      },
    ],
  },

  // 3. Admin Module
  {
    path: ROUTE.ADMIN,
    canActivate: [adminGuard],
    data: { route: ROUTE.ADMIN },
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },

  // 4. Fallback 404 Wildcard
  {
    path: ROUTE.ANY,
    data: { route: ROUTE.ANY, title: 'Không Tìm Thấy Trang' },
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
