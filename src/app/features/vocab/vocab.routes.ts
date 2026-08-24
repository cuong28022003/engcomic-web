import { Routes } from '@angular/router';
import { ROUTE } from '@shared/constants/route';

export const VOCAB_ROUTES: Routes = [
  {
    path: '',
    data: { route: ROUTE.VOCAB, title: 'Kho Từ Vựng Vocab Vault' },
    loadComponent: () =>
      import('./dashboard/vocab-dashboard.component').then(
        (m) => m.VocabDashboardComponent
      ),
  },
  {
    path: 'word/:id',
    data: { route: `${ROUTE.VOCAB}/word`, title: 'Chi Tiết Từ Vựng' },
    loadComponent: () =>
      import('./word-detail/word-detail.component').then(
        (m) => m.WordDetailComponent
      ),
  },
  {
    path: 'practice',
    data: { route: `${ROUTE.VOCAB}/practice`, title: 'Luyện Tập Từ Vựng' },
    loadComponent: () =>
      import('./practice/practice-session.component').then(
        (m) => m.PracticeSessionComponent
      ),
  },
  {
    path: 'import',
    data: { route: `${ROUTE.VOCAB}/import`, title: 'Import Từ Vựng' },
    loadComponent: () =>
      import('./import/vocab-import.component').then(
        (m) => m.VocabImportComponent
      ),
  },
  {
    path: 'collector',
    data: { route: `${ROUTE.VOCAB}/collector`, title: 'Hộp Thư Từ Vựng Thu Thập' },
    loadComponent: () =>
      import('./collector/word-collector.component').then(
        (m) => m.WordCollectorComponent
      ),
  },
  {
    path: 'leech',
    data: { route: `${ROUTE.VOCAB}/leech`, title: 'Trung Tâm Cứu Hộ Từ Vựng Leech' },
    loadComponent: () =>
      import('./leech-center/leech-center.component').then(
        (m) => m.LeechCenterComponent
      ),
  },
];
