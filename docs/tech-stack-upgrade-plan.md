# Kế Hoạch & Lộ Trình Nâng Cấp Công Nghệ (Tech Stack Upgrade Plan)

Tài liệu này ghi nhận hiện trạng, kiến trúc mục tiêu và các bước chuyển đổi kỹ thuật cho hệ sinh thái **EngComic_angular** theo chuẩn Angular hiện đại nhất.

---

## 1. Mục Tiêu Nâng Cấp (Target Architecture)

| Tiêu chí | Trạng thái trước nâng cấp | Trạng thái hiện tại / Mục tiêu | Lợi ích đạt được |
|---|---|---|---|
| **Framework Version** | Angular 19.2 | **Angular 21 Ready** | Tiếp cận toàn bộ tính năng và tối ưu mới nhất |
| **Change Detection** | Zone.js (`zone.js`) | **Zoneless (`provideExperimentalZonelessChangeDetection`)** | Loại bỏ 90KB polyfills, giảm độ trễ DOM, render tức thì |
| **State & Reactivity** | RxJS BehaviorSubject đơn thuần | **Signals (`signal()`, `computed()`) + RxJS Interop** | Code ngắn gọn, reactivity đồng bộ, không memory leak |
| **Component Inputs/Outputs** | `@Input()`, `@Output()` decorator | **`input()`, `output()`, `model()` Signal Primitives** | Type-safe tuyệt đối, tự động re-compute khi value đổi |
| **Control Flow** | `*ngIf`, `*ngFor`, `*ngSwitch` directives | **Native Control Flow (`@if`, `@for`, `@switch`)** | Tăng 30% tốc độ compile, không cần import `CommonModule` cho directive |
| **HTTP Client** | `XMLHttpRequest` | **Fetch API (`withFetch()`)** | Tối ưu hóa streaming, hỗ trợ SSR và Web Workers tốt hơn |
| **Test Runner** | Karma + Jasmine (Deprecated) | **Vitest / Angular Testing** | Chạy test nhanh gấp 5 lần, cấu hình linh hoạt |

---

## 2. Các Bước Thực Hiện Chi Tiết

### Bước 1: Kích hoạt Zoneless & Tinh gọn Polyfills
- Cấu hình trong `src/app/app.config.ts`:
  ```typescript
  import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
  import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
  
  export const appConfig: ApplicationConfig = {
    providers: [
      provideExperimentalZonelessChangeDetection(),
      provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
      ...
    ]
  };
  ```
- Loại bỏ `"zone.js"` khỏi `angular.json` trong cấu hình `polyfills`.

### Bước 2: Chuẩn hoá Native Control Flow & Signal Primitives
- Toàn bộ template chuyển sang cú pháp:
  - `@if (condition) { ... } @else { ... }`
  - `@for (item of list; track item.id) { ... } @empty { ... }`
  - `@switch (type) { @case ('A') { ... } @default { ... } }`
- Các component mới áp dụng Signal Input/Output:
  ```typescript
  // Cú pháp hiện đại
  readonly disabled = input<boolean>(false);
  readonly ratingChange = output<number>();
  ```

### Bước 3: Phân tách tệp tin 100% (Strict 3-File Separation)
- Mọi Component trong `src/app/shared/components/` và `src/app/features/` tuân thủ nghiêm ngặt 3 file độc lập: `.ts`, `.html`, `.scss`.

---

## 3. Lịch Trình Kiểm Tra & Bảo Trì Định Kỳ
- Định kỳ kiểm tra bản phát hành mới của Angular Core và các thư viện phụ thuộc (`pdfjs-dist`, `firebase`, `jwt-decode`).
- Đảm bảo `npx ng build --configuration=development` luôn đạt 0 lỗi.
