import { Routes } from '@angular/router';
import { ROUTE } from '@shared/constants/route';

export const DECK_ROUTES: Routes = [
  {
    path: '',
    data: { route: ROUTE.DECK, title: 'Quản lý Bộ Thẻ Từ Vựng' },
    loadComponent: () =>
      import('./deck-list/deck-list.component').then(
        (m) => m.DeckListComponent
      ),
  },
  {
    path: 'create',
    data: { route: `${ROUTE.DECK}/create`, title: 'Tạo Bộ Thẻ Mới' },
    loadComponent: () =>
      import('./deck-form/deck-form.component').then(
        (m) => m.DeckFormComponent
      ),
  },
  {
    path: ':deckId',
    data: { route: `${ROUTE.DECK}/detail`, title: 'Chi Tiết Bộ Thẻ' },
    loadComponent: () =>
      import('./deck-detail/deck-detail.component').then(
        (m) => m.DeckDetailComponent
      ),
  },
  {
    path: ':deckId/edit',
    data: { route: `${ROUTE.DECK}/edit`, title: 'Chỉnh Sửa Bộ Thẻ' },
    loadComponent: () =>
      import('./deck-form/deck-form.component').then(
        (m) => m.DeckFormComponent
      ),
  },
  {
    path: ':deckId/create-card',
    data: { route: `${ROUTE.DECK}/create-card`, title: 'Thêm Thẻ Mới' },
    loadComponent: () =>
      import('./card-form/card-form.component').then(
        (m) => m.CardFormComponent
      ),
  },
  {
    path: ':deckId/edit-card/:cardId',
    data: { route: `${ROUTE.DECK}/edit-card`, title: 'Chỉnh Sửa Thẻ' },
    loadComponent: () =>
      import('./card-form/card-form.component').then(
        (m) => m.CardFormComponent
      ),
  },
];
