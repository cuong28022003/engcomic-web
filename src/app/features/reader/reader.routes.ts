import { Routes } from '@angular/router';

export const READER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reader-dashboard/reader-dashboard.component').then(
        (m) => m.ReaderDashboardComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./create-test/create-test.component').then(
        (m) => m.CreateTestComponent
      ),
  },
  {
    path: 'mistakes',
    loadComponent: () =>
      import('./mistake-queue/mistake-queue.component').then(
        (m) => m.MistakeQueueComponent
      ),
  },
  {
    path: ':testId',
    loadComponent: () =>
      import('./reading-session/reading-session.component').then(
        (m) => m.ReadingSessionComponent
      ),
  },
  {
    path: ':testId/result',
    loadComponent: () =>
      import('./session-result/session-result.component').then(
        (m) => m.SessionResultComponent
      ),
  },
];