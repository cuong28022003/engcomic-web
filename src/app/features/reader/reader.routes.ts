import { Routes } from '@angular/router';
import { ROUTE } from '@shared/constants/route';

export const READER_ROUTES: Routes = [
  {
    path: '',
    data: { route: ROUTE.READER, title: 'Danh Sách Đề Thi TOEIC' },
    loadComponent: () =>
      import('./reader-dashboard/reader-dashboard.component').then(
        (m) => m.ReaderDashboardComponent
      ),
  },
  {
    path: 'new',
    data: { route: `${ROUTE.READER}/new`, title: 'Tạo Đề Thi Mới' },
    loadComponent: () =>
      import('./create-test/create-test.component').then(
        (m) => m.CreateTestComponent
      ),
  },
  {
    path: 'mistakes',
    data: { route: `${ROUTE.READER}/mistakes`, title: 'Hàng Đợi Lỗi Sai' },
    loadComponent: () =>
      import('./mistake-queue/mistake-queue.component').then(
        (m) => m.MistakeQueueComponent
      ),
  },
  {
    path: ':testId',
    data: { route: `${ROUTE.READER}/session`, title: 'Phòng Thi TOEIC' },
    loadComponent: () =>
      import('./reading-session/reading-session.component').then(
        (m) => m.ReadingSessionComponent
      ),
  },
  {
    path: ':testId/result',
    data: { route: `${ROUTE.READER}/result`, title: 'Kết Quả Bài Thi' },
    loadComponent: () =>
      import('./session-result/session-result.component').then(
        (m) => m.SessionResultComponent
      ),
  },
  {
    path: ':testId/attempts/:attemptId/review',
    data: { route: `${ROUTE.READER}/review`, title: 'Xem Lại Bài Làm' },
    loadComponent: () =>
      import('./attempt-review/attempt-review.component').then(
        (m) => m.AttemptReviewComponent
      ),
  },
];