import { Routes } from '@angular/router';

export const VOCAB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/vocab-dashboard.component').then(
        (m) => m.VocabDashboardComponent
      ),
  },
  {
    path: 'word/:id',
    loadComponent: () =>
      import('./word-detail/word-detail.component').then(
        (m) => m.WordDetailComponent
      ),
  },
  {
    path: 'practice',
    loadComponent: () =>
      import('./practice/practice-session.component').then(
        (m) => m.PracticeSessionComponent
      ),
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./import/vocab-import.component').then(
        (m) => m.VocabImportComponent
      ),
  },
  {
    path: 'collector',
    loadComponent: () =>
      import('./collector/word-collector.component').then(
        (m) => m.WordCollectorComponent
      ),
  },
];
