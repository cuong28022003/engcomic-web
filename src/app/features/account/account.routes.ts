import { Routes } from '@angular/router';
import { ROUTE } from '@shared/constants/route';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./account.component').then((m) => m.AccountComponent),
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'profile',
        data: { route: ROUTE.PROFILE, title: 'Hồ Sơ Cá Nhân' },
        loadComponent: () =>
          import('./profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'change-password',
        data: { route: ROUTE.CHANGE_PASSWORD, title: 'Đổi Mật Khẩu' },
        loadComponent: () =>
          import('./change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent
          ),
      },
      {
        path: 'rank',
        data: { route: ROUTE.RANK, title: 'Cấp Bậc & Thành Tích' },
        loadComponent: () =>
          import('./rank/rank.component').then((m) => m.RankComponent),
      },
      {
        path: 'showcase',
        data: { route: 'SHOWCASE', title: 'Tủ Đồ & Danh Hiệu' },
        loadComponent: () =>
          import('./showcase/showcase.component').then((m) => m.ShowcaseComponent),
      },
      {
        path: 'topup-history',
        data: { route: ROUTE.TOPUP_HISTORY, title: 'Lịch Sử Hoạt Động' },
        loadComponent: () =>
          import('./topup-history/topup-history.component').then(
            (m) => m.TopupHistoryComponent
          ),
      },
    ],
  },
];
