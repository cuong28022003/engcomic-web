# Hướng dẫn phát triển — EngComic Angular

## 1. Quy ước đặt tên (Naming Conventions)

### Files
| Loại | Pattern | Ví dụ |
|---|---|---|
| Component | `<name>.component.ts` | `comic-list.component.ts` |
| Service | `<name>.service.ts` | `comic-api.service.ts` |
| Guard | `<name>.guard.ts` | `auth.guard.ts` |
| Interceptor | `<name>.interceptor.ts` | `auth.interceptor.ts` |
| Model | `index.ts` (barrel) | `src/app/shared/models/index.ts` |
| Constants | `<name>.ts` | `route.ts`, `genres.ts` |

### Classes & Interfaces
```typescript
// Interfaces — PascalCase, không có tiền tố I
interface Comic { ... }
interface PageResponse<T> { ... }

// Components — PascalCase + suffix
class ComicListComponent { ... }

// Services — PascalCase + suffix
class ComicApiService { ... }
```

---

## 2. Cách tạo Component mới

### Tạo thủ công (recommended)
```bash
# Tạo file component trong feature tương ứng
# src/app/features/<feature>/<name>/<name>.component.ts
```

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-<name>',
  standalone: true,
  imports: [CommonModule],
  template: `<div>...</div>`,
  styles: [`...`]
})
export class MyNewComponent { }
```

### Đăng ký lazy route trong `app.routes.ts`
```typescript
{
  path: 'my-path',
  loadComponent: () =>
    import('./features/my-feature/my-new.component')
      .then(m => m.MyNewComponent),
},
```

---

## 3. Cách gọi API (Pattern chuẩn)

### Tạo API Service mới
```typescript
// src/app/core/services/my-resource-api.service.ts
import { Injectable, inject } from '@angular/core';
import { ApiBaseService } from './api-base.service';
import { Observable } from 'rxjs';
import { MyModel, PageResponse } from '@models/index';

@Injectable({ providedIn: 'root' })
export class MyResourceApiService extends ApiBaseService {
  private readonly BASE = '/my-resource';

  getAll(): Observable<MyModel[]> {
    return this.get<MyModel[]>(this.BASE);
  }

  getById(id: string): Observable<MyModel> {
    return this.get<MyModel>(`${this.BASE}/${id}`);
  }

  create(data: Partial<MyModel>): Observable<MyModel> {
    return this.post<MyModel>(this.BASE, data);
  }

  update(id: string, data: Partial<MyModel>): Observable<MyModel> {
    return this.put<MyModel>(`${this.BASE}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.delete<void>(`${this.BASE}/${id}`);
  }
}
```

### Sử dụng trong Component
```typescript
@Component({ ... })
export class MyComponent implements OnInit {
  private myApi = inject(MyResourceApiService);
  private toast = inject(ToastService);

  items: MyModel[] = [];
  loading = false;

  ngOnInit(): void {
    this.loading = true;
    this.myApi.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Không tải được dữ liệu');
        this.loading = false;
      }
    });
  }
}
```

---

## 4. Cách thêm Model mới

Tất cả interfaces nằm trong `src/app/shared/models/index.ts`:

```typescript
// Thêm vào cuối file
export interface MyNewModel {
  id: string;
  name: string;
  createdAt?: string;
}
```

Import trong bất kỳ file nào:
```typescript
import { MyNewModel } from '@models/index';
```

---

## 5. Cách dùng Toast

```typescript
private toast = inject(ToastService);

// Các loại toast
this.toast.success('Lưu thành công!');
this.toast.error('Đã xảy ra lỗi');
this.toast.warning('Cảnh báo người dùng');
this.toast.info('Thông báo thông tin');
```

---

## 6. Cách dùng AuthService

```typescript
private auth = inject(AuthService);

// Kiểm tra đang đăng nhập
if (this.auth.isAuthenticated()) { ... }

// Lấy user hiện tại (synchronous)
const user = this.auth.currentUser;

// Subscribe thay đổi user
this.auth.currentUser$.subscribe(user => {
  this.currentUser = user;
});

// Đăng xuất
this.auth.logout();
```

---

## 7. Cách dùng UserStateService

```typescript
private userState = inject(UserStateService);

// Subscribe stats
this.userState.userStats$.subscribe(stats => {
  this.xp = stats?.xp;
  this.diamonds = stats?.diamonds;
});

// Thay đổi diamonds
this.userState.deductDiamonds(100); // trừ
this.userState.addDiamonds(50);     // cộng
```

---

## 8. Path Aliases (Import shortcuts)

Được cấu hình trong `tsconfig.json`:

```typescript
import { ... } from '@core/services/auth.service';
import { ... } from '@shared/components/comic-card/comic-card.component';
import { ... } from '@features/home/home.component';
import { Comic } from '@models/index';
import { ROUTE } from '@shared/constants/route';
import { environment } from '@env/environment';
```

---

## 9. Styling trong Component

### Dùng global CSS tokens
```scss
// Trong style của component
.my-element {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
```

### Các class utility có sẵn toàn cục
```html
<!-- Layout -->
<div class="container">         <!-- max-width + padding -->
<div class="glass-panel">       <!-- glassmorphism card -->
<div class="page-header">       <!-- page title area -->

<!-- Badges -->
<span class="badge badge-primary">
<span class="badge badge-vip">
<span class="badge badge-genre">

<!-- Buttons -->
<button class="btn-primary">
<button class="btn-secondary">
<button class="btn-icon">
```

---

## 10. Angular Signals & Defer (Angular 17+)

### @if / @for / @switch (thay *ngIf, *ngFor)
```html
<!-- Đúng cách mới (Angular 17+) -->
@if (loading) {
  <div class="spinner"></div>
} @else {
  <div>{{ data }}</div>
}

@for (item of items; track item.id) {
  <app-comic-card [comic]="item" />
}
```

---

## 11. Hướng dẫn sử dụng Shared Suite (`@shared`)

### 11.1 Reusable Components
```typescript
import {
  PaginatorComponent,
  SearchBoxComponent,
  EmptyStateComponent,
  StarRatingComponent,
  ConfirmDialogService
} from '@shared';

// 1. Phân trang
<app-paginator [currentPage]="page" [totalPages]="total" (pageChange)="onPageChange($event)" />

// 2. Tìm kiếm tự động (debounce 300ms)
<app-search-box placeholder="Tìm kiếm..." (searchChange)="onLiveSearch($event)" />

// 3. Khung trống (Empty State)
<app-empty-state icon="fa-regular fa-folder-open" title="Chưa có dữ liệu" (actionClick)="onAdd()" />

// 4. Đánh giá sao (1-5 sao)
<app-star-rating [rating]="score" (ratingChange)="onRate($event)" />

// 5. Popup xác nhận toàn cục (Confirm Dialog)
const dialog = inject(ConfirmDialogService);
dialog.confirm({
  title: 'Xóa từ vựng',
  message: 'Bạn có chắc chắn muốn xóa từ này?',
  type: 'danger',
  confirmText: 'Xóa ngay'
}).subscribe(confirmed => {
  if (confirmed) this.deleteItem();
});
```

### 11.2 Pipes & Directives
```html
<!-- Safe HTML -->
<div [innerHTML]="htmlContent | safeHtml"></div>

<!-- Time Ago -->
<span>{{ createdAt | timeAgo }}</span>

<!-- Truncate -->
<p>{{ longText | truncate:60 }}</p>

<!-- Stage Label -->
<span class="badge">{{ stage | stageLabel }}</span>

<!-- Directives -->
<div (appClickOutside)="closeDropdown()">...</div>
<button [appTooltip]="'Nhấn để xem chi tiết'" tooltipPosition="top">...</button>
<div (appSwipe)="onSwipeLeft()">...</div>
```

---

## 12. Environment Config

```typescript
// src/environments/environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  firebaseConfig: { ... }
};
```

```typescript
// Sử dụng trong service
import { environment } from '@env/environment';
const BASE_URL = environment.apiUrl;
```

---

## 13. Checklist trước khi commit

- [ ] `ng build --configuration=development` không có lỗi
- [ ] Không để `console.log()` thừa trong production code
- [ ] Tất cả subscriptions đều có `error` handler
- [ ] Không hard-code URL API (dùng `environment.apiUrl`)
- [ ] Không hard-code route paths (dùng `ROUTE.*` constants)
- [ ] Loading state được hiển thị khi đang fetch data
- [ ] Toast thông báo phù hợp cho success và error
