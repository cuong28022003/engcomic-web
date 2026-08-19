import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { ROUTE } from './shared/constants/route';

export const routes: Routes = [
  // Public
  {
    path: ROUTE.HOME,
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: ROUTE.SEARCH,
    loadComponent: () =>
      import('./features/home/search/search.component').then(
        (m) => m.SearchComponent
      ),
  },
  {
    path: ROUTE.LEADERBOARD,
    loadComponent: () =>
      import('./features/home/leaderboard/leaderboard.component').then(
        (m) => m.LeaderboardComponent
      ),
  },
  {
    path: ROUTE.LOGIN,
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: ROUTE.REGISTER,
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'active/:token',
    loadComponent: () =>
      import('./features/auth/active/active.component').then(
        (m) => m.ActiveComponent
      ),
  },

  // Comics (public + auth)
  {
    path: ROUTE.COMICS,
    loadComponent: () =>
      import('./features/comics/comic-list/comic-list.component').then(
        (m) => m.ComicListComponent
      ),
  },
  {
    path: 'comics/:comicId',
    loadComponent: () =>
      import('./features/comics/comic-detail/comic-detail.component').then(
        (m) => m.ComicDetailComponent
      ),
  },
  {
    path: 'comics/:comicId/chapters/:chapterId',
    loadComponent: () =>
      import('./features/chapters/chapter-detail/chapter-detail.component').then(
        (m) => m.ChapterDetailComponent
      ),
  },

  // Auth-protected routes
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Comics CRUD
      {
        path: 'comics/create',
        loadComponent: () =>
          import(
            './features/comics/create-edit-comic/create-edit-comic.component'
          ).then((m) => m.CreateEditComicComponent),
      },
      {
        path: 'comics/:comicId/edit',
        loadComponent: () =>
          import(
            './features/comics/create-edit-comic/create-edit-comic.component'
          ).then((m) => m.CreateEditComicComponent),
      },

      // Chapters CRUD
      {
        path: 'comics/:comicId/chapters',
        loadComponent: () =>
          import('./features/chapters/chapter-list/chapter-list.component').then(
            (m) => m.ChapterListComponent
          ),
      },
      {
        path: 'comics/:comicId/chapters/create',
        loadComponent: () =>
          import(
            './features/chapters/create-edit-chapter/create-edit-chapter.component'
          ).then((m) => m.CreateEditChapterComponent),
      },
      {
        path: 'comics/:comicId/chapters/:chapterId/edit',
        loadComponent: () =>
          import(
            './features/chapters/create-edit-chapter/create-edit-chapter.component'
          ).then((m) => m.CreateEditChapterComponent),
      },

      // Account
      {
        path: 'user/:userId',
        loadComponent: () =>
          import('./features/account/account.component').then(
            (m) => m.AccountComponent
          ),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./features/account/profile/profile.component').then(
                (m) => m.ProfileComponent
              ),
          },
          {
            path: 'change-password',
            loadComponent: () =>
              import(
                './features/account/change-password/change-password.component'
              ).then((m) => m.ChangePasswordComponent),
          },
          {
            path: 'bookshelf',
            loadComponent: () =>
              import('./features/account/bookshelf/bookshelf.component').then(
                (m) => m.BookshelfComponent
              ),
          },
          {
            path: 'rank',
            loadComponent: () =>
              import('./features/account/rank/rank.component').then(
                (m) => m.RankComponent
              ),
          },
          {
            path: 'collection',
            loadComponent: () =>
              import('./features/account/collection/collection.component').then(
                (m) => m.CollectionComponent
              ),
          },
          {
            path: 'topup-history',
            loadComponent: () =>
              import(
                './features/account/topup-history/topup-history.component'
              ).then((m) => m.TopupHistoryComponent),
          },
        ],
      },

      // Deck
      {
        path: ROUTE.DECK,
        loadComponent: () =>
          import('./features/deck/deck-list/deck-list.component').then(
            (m) => m.DeckListComponent
          ),
      },
      {
        path: 'deck/create',
        loadComponent: () =>
          import('./features/deck/deck-form/deck-form.component').then(
            (m) => m.DeckFormComponent
          ),
      },
      {
        path: 'deck/:deckId',
        loadComponent: () =>
          import('./features/deck/deck-detail/deck-detail.component').then(
            (m) => m.DeckDetailComponent
          ),
      },
      {
        path: 'deck/:deckId/edit',
        loadComponent: () =>
          import('./features/deck/deck-form/deck-form.component').then(
            (m) => m.DeckFormComponent
          ),
      },
      {
        path: 'deck/:deckId/create-card',
        loadComponent: () =>
          import('./features/deck/card-form/card-form.component').then(
            (m) => m.CardFormComponent
          ),
      },
      {
        path: 'deck/:deckId/edit-card/:cardId',
        loadComponent: () =>
          import('./features/deck/card-form/card-form.component').then(
            (m) => m.CardFormComponent
          ),
      },
      {
        path: 'study/:deckId',
        loadComponent: () =>
          import('./features/study/study.component').then(
            (m) => m.StudyComponent
          ),
      },
      {
        path: 'result/:deckId',
        loadComponent: () =>
          import('./features/study/result/result.component').then(
            (m) => m.ResultComponent
          ),
      },

      // Gacha & Premium
      {
        path: ROUTE.GACHA,
        loadComponent: () =>
          import('./features/gacha/gacha.component').then(
            (m) => m.GachaComponent
          ),
      },
      {
        path: ROUTE.PREMIUM,
        loadComponent: () =>
          import('./features/premium/premium.component').then(
            (m) => m.PremiumComponent
          ),
      },
      {
        path: ROUTE.DIAMOND_TOPUP,
        loadComponent: () =>
          import('./features/premium/diamond-topup/diamond-topup.component').then(
            (m) => m.DiamondTopupComponent
          ),
      },

      // Fighting Game
      {
        path: ROUTE.FIGHTING_GAME,
        loadComponent: () =>
          import('./features/fighting-game/fighting-game.component').then(
            (m) => m.FightingGameComponent
          ),
      },

      // Vocab Vault
      {
        path: 'vocab',
        loadChildren: () =>
          import('./features/vocab/vocab.routes').then((m) => m.VOCAB_ROUTES),
      },
    ],
  },

  // Admin routes
  {
    path: ROUTE.ADMIN,
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/admin.component').then((m) => m.AdminComponent),
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'comics',
        loadComponent: () =>
          import('./features/admin/comic-management/comic-management.component').then(
            (m) => m.ComicManagementComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/report-management/report-management.component').then(
            (m) => m.ReportManagementComponent
          ),
      },
      {
        path: 'ranks',
        loadComponent: () =>
          import('./features/admin/rank-management/rank-management.component').then(
            (m) => m.RankManagementComponent
          ),
      },
      {
        path: 'topups',
        loadComponent: () =>
          import('./features/admin/topup-management/topup-management.component').then(
            (m) => m.TopupManagementComponent
          ),
      },
    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];

