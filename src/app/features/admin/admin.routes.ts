import { Routes } from '@angular/router';
import { ROUTE } from '@shared/constants/route';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin.component').then((m) => m.AdminComponent),
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
      {
        path: 'users',
        data: { route: ROUTE.ADMIN_USERS, title: 'Quản Lý Thành Viên' },
        loadComponent: () =>
          import('./user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'reports',
        data: { route: ROUTE.ADMIN_REPORTS, title: 'Báo Cáo Vi Phạm' },
        loadComponent: () =>
          import('./report-management/report-management.component').then(
            (m) => m.ReportManagementComponent
          ),
      },
      {
        path: 'ranks',
        data: { route: ROUTE.ADMIN_RANKS, title: 'Quản Lý Cấp Bậc' },
        loadComponent: () =>
          import('./rank-management/rank-management.component').then(
            (m) => m.RankManagementComponent
          ),
      },
      {
        path: 'topups',
        data: { route: ROUTE.ADMIN_TOPUPS, title: 'Quản Lý Giao Dịch' },
        loadComponent: () =>
          import('./topup-management/topup-management.component').then(
            (m) => m.TopupManagementComponent
          ),
      },
    ],
  },
];
