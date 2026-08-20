# EngComic Angular Master Guide & Hub (Angular 21 Ready)

Tài liệu này là trung tâm điều hướng và đặc tả quy chuẩn phát triển cho toàn bộ ứng dụng `EngComic_angular`.

---

## 🧭 Mục Lục Tài Liệu Đặc Tả Kỹ Thuật:
- 🚀 **[Kế Hoạch & Lộ Trình Nâng Cấp Công Nghệ (Zoneless & Signals)](./docs/tech-stack-upgrade-plan.md)**: Chi tiết kiến trúc Zoneless, Signal primitives, native control flow và tối ưu bundle.
- 🎨 **[Quy Chuẩn UI / Design System (Glassmorphism)](./UI_STYLE_GUIDE.md)**: Hệ thống màu sắc HSL, CSS variables (`var(--bg-card)`, `var(--primary-gradient)`), hiệu ứng đổ bóng, typography, button states, modal & animations.
- 🏗️ **[Kiến Trúc Ứng Dụng & Cấu Trúc Thư Mục](./docs/ARCHITECTURE.md)**: Phân tầng `core`, `shared`, `features`, luồng dữ liệu một chiều và quản trị trạng thái (Signals/RxJS).
- 🔌 **[Hợp Đồng API & Backend Contract](./docs/BACKEND_CONTRACT.md)**: Định dạng DTOs, Authentication JWT token, các mã phản hồi chuẩn, RESTful guidelines.
- 📖 **[Danh Mục Endpoint & API Reference](./docs/API_REFERENCE.md)**: Danh sách đầy đủ các REST API theo từng phân hệ.
- 🛠️ **[Quy Trình Phát Triển & Kiểm Thử](./docs/DEVELOPMENT_GUIDE.md)**: Hướng dẫn khởi chạy, quy chuẩn Git, kiểm thử và build production.

---

## 📌 Quy Chuẩn Phát Triển Chi Tiết

### 1. Cấu Trúc File Component (BẮT BUỘC SỐ 1)
- **MỌI Component** (ở `src/app/shared/components/` và `src/app/features/`) **BẮT BUỘC** phải tách thành 3 tệp riêng biệt trong cùng thư mục component:
  - `[name].component.ts`: Chỉ chứa Component Decorator (`templateUrl`, `styleUrls`), Class logic, Signal Inputs/Outputs, Injections, Lifecycle hooks.
  - `[name].component.html`: Chứa toàn bộ cấu trúc HTML và Native Control Flow (`@if`, `@for`, `@switch`).
  - `[name].component.scss`: Chứa toàn bộ scoped CSS/SCSS.
- **TUYỆT ĐỐI KHÔNG** dùng inline `template: \`...\`` hoặc `styles: [\`...\`]`.

### 2. Standalone & Path Aliases
- 100% components là standalone (`standalone: true`). Import đầy đủ các modules/pipes mà component sử dụng.
- Sử dụng đúng các path alias đã định nghĩa trong `tsconfig.json`:
  - `@shared/*` -> `src/app/shared/*`
  - `@core/*` -> `src/app/core/*`
  - `@features/*` -> `src/app/features/*`
  - `@models/*` -> `src/app/shared/models/*` (hoặc `@models/index`)
  - `@env/*` -> `src/environments/*`

### 3. Zoneless Reactivity & State Management
- Ứng dụng hoạt động theo kiến trúc **Zoneless** (không phụ thuộc `zone.js`).
- Sử dụng Angular **Signals** (`signal()`, `computed()`, `input()`, `output()`, `model()`) kết hợp RxJS Interop (`toSignal()`, `toObservable()`).
- Luôn giải phóng tài nguyên Observable trong `ngOnDestroy()` hoặc dùng `takeUntilDestroyed()`.

### 4. Native Control Flow
- 100% template sử dụng cú pháp điều khiển luồng hiện đại:
  - `@if (condition) { ... } @else { ... }`
  - `@for (item of list; track item.id) { ... } @empty { ... }`
  - `@switch (expression) { @case ('value') { ... } @default { ... } }`

### 5. Quy Trình Kiểm Tra & Biên Dịch
- Sau khi hoàn thành tạo mới hoặc chỉnh sửa code, luôn chạy xác thực biên dịch:
  ```bash
  npx ng build --configuration=development
  ```
- Đảm bảo **0 lỗi TypeScript (TS) và 0 lỗi Angular Compiler (NG)** trước khi kết thúc task.
