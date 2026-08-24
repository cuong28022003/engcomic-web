# EngComic Angular Master Guide & Hub (Angular 21 Ready)

Tài liệu này là trung tâm điều hướng và đặc tả quy chuẩn phát triển cho toàn bộ ứng dụng `EngComic_angular`.

---

## 🧭 Mục Lục Tài Liệu Đặc Tả Kỹ Thuật:
- 🏛️ **[Quy Chuẩn Kiến Trúc Web-Client & Blueprint Refactor](./docs/WEB_CLIENT_RULES_AND_REFACTORING_BLUEPRINT.md)**: Phân tích sâu toàn bộ rules từ dự án `web-client`, kiến trúc phân tầng chuẩn Enterprise, hệ thống shared components, directives, error handling, và lộ trình refactor.
- 🎯 **[Đặc Tả Kỹ Thuật Feature 003 (TOEIC Exam Workspace & AI Review)](./specs/003-toeic-reader/spec.md)**: Đặc tả chi tiết phòng thi PDF split-screen, quản lý attempt history, mistake queue, prompt trích xuất và import giải thích AI.
- 🚀 **[Kế Hoạch & Lộ Trình Nâng Cấp Công Nghệ (Zoneless & Signals)](./docs/tech-stack-upgrade-plan.md)**: Chi tiết kiến trúc Zoneless, Signal primitives, native control flow và tối ưu bundle.
- 🎨 **[Quy Chuẩn UI / Design System (Glassmorphism)](./UI_STYLE_GUIDE.md)**: Hệ thống màu sắc HSL, CSS variables (`var(--bg-card)`, `var(--primary-gradient)`), hiệu ứng đổ bóng, typography, button states, modal & animations.
- 🏗️ **[Kiến Trúc Ứng Dụng & Cấu Trúc Thư Mục](./docs/ARCHITECTURE.md)**: Phân tầng `core`, `shared`, `features`, luồng dữ liệu một chiều và quản trị trạng thái (Signals/RxJS).
- 🔌 **[Hợp Đồng API & Backend Contract](./docs/BACKEND_CONTRACT.md)**: Định dạng DTOs, Authentication JWT token, các mã phản hồi chuẩn, RESTful guidelines.
- 📖 **[Danh Mục Endpoint & API Reference](./docs/API_REFERENCE.md)**: Danh sách đầy đủ các REST API theo từng phân hệ.
- 🛠️ **[Quy Trình Phát Triển & Kiểm Thử](./docs/DEVELOPMENT_GUIDE.md)**: Hướng dẫn khởi chạy, quy chuẩn Git, kiểm thử và build production.

---

## 📌 Quy Chuẩn Phát Triển Chi Tiết (Web-Client & Angular 21 Enterprise Standard)

### 1. Cấu Trúc File Component (BẮT BUỘC SỐ 1)
- **MỌI Component** (ở `src/app/shared/components/` và `src/app/features/`) **BẮT BUỘC** phải tách thành 3 tệp riêng biệt trong cùng thư mục component:
  - `[name].component.ts`: Chỉ chứa Component Decorator (`templateUrl`, `styleUrls`), Class logic, Signal Inputs/Outputs, Injections, Lifecycle hooks.
  - `[name].component.html`: Chứa toàn bộ cấu trúc HTML và Native Control Flow (`@if`, `@for`, `@switch`).
  - `[name].component.scss`: Chứa toàn bộ scoped CSS/SCSS.
- **TUYỆT ĐỐI KHÔNG** dùng inline `template: \`...\`` hoặc `styles: [\`...\`]`.

### 2. Kiến Trúc Smart-Dumb Phân Tầng Feature
- Trong mỗi feature (`src/app/features/*`), phân định rõ:
  - `pages/`: Smart Containers (quản lý trạng thái, routing, gọi API qua Service).
  - `components/`: Presentational / Dumb components (chỉ nhận `input()`, phát `output()`).
  - `services/` & `models/` & `const/`: Facade logic, interfaces, hằng số dùng riêng cho feature.

### 3. Thư Viện Shared Components & Quy Tắc Ưu Tiên Tái Sử Dụng (BẮT BUỘC)
- Khi phát triển bất kỳ tính năng nào (`src/app/features/*`), AI **BẮT BUỘC** phải ưu tiên tái sử dụng các component dùng chung từ `@shared/components`:
  - `<app-loading>`: Trạng thái đang tải dữ liệu (hỗ trợ inline và fullscreen overlay).
  - `<app-error-state>`: Báo lỗi tải dữ liệu/API kèm nút Thử lại.
  - `<app-empty-state>`: Trạng thái danh sách rỗng kèm icon & action.
  - `<app-status-badge>`: Badge trạng thái (VIP, Admin, Rarity, Level, Status).
  - `<app-modal>`: Khung Modal Popup tùy biến chuẩn Dark Glassmorphism.
  - `<app-form-input>`: Ô nhập liệu form kèm icon & error message.
  - `<app-file-uploader>`: Khung kéo thả tải PDF đề thi, ảnh truyện.
  - `<app-progress-stepper>`: Thanh hiển thị tiến trình các bước.
  - `<app-paginator>`, `<app-search-box>`, `<app-star-rating>`, `<app-comic-card>`.
- **TUYỆT ĐỐI CẤM** viết lại mã HTML/CSS spinner, error box, empty state hoặc modal tùy tiện inline.

### 4. Thông Báo & Tương Tác Chuẩn (Zero Browser Alerts)
- Tuyệt đối **CẤM** sử dụng `alert()`, `confirm()`, `prompt()` của trình duyệt.
- Luôn sử dụng `ToastService` (`success()`, `error()`, `warning()`, `info()`) cho thông báo toast.
- Luôn sử dụng `<app-modal>` hoặc `ConfirmDialogComponent` cho các popup xác nhận hành động nguy hiểm.

### 5. Standalone, Path Aliases & TypeScript Nghiêm Ngặt
- 100% components là standalone (`standalone: true`).
- 100% không dùng `any`, bắt buộc khai báo interface/DTO rõ ràng.
- Sử dụng đúng các path alias đã định nghĩa trong `tsconfig.json`:
  - `@shared/*` -> `src/app/shared/*`
  - `@core/*` -> `src/app/core/*`
  - `@features/*` -> `src/app/features/*`
  - `@models/*` -> `src/app/shared/models/*`
  - `@env/*` -> `src/environments/*`

### 6. Zoneless Reactivity & State Management
- Ứng dụng hoạt động theo kiến trúc **Zoneless** (`provideExperimentalZonelessChangeDetection`).
- Sử dụng Angular **Signals** (`signal()`, `computed()`, `input()`, `output()`, `model()`) kết hợp RxJS Interop (`toSignal()`, `toObservable()`).
- Luôn giải phóng tài nguyên Observable trong `ngOnDestroy()` hoặc dùng `takeUntilDestroyed()`.

### 7. Native Control Flow
- 100% template sử dụng cú pháp điều khiển luồng hiện đại:
  - `@if (condition) { ... } @else { ... }`
  - `@for (item of list; track item.id) { ... } @empty { ... }`
  - `@switch (expression) { @case ('value') { ... } @default { ... } }`

### 8. Quy Trình Kiểm Tra & Biên Dịch
- Sau khi hoàn thành tạo mới hoặc chỉnh sửa code, luôn chạy xác thực biên dịch:
  ```bash
  npx ng build --configuration=development
  ```
- Đảm bảo **0 lỗi TypeScript (TS) và 0 lỗi Angular Compiler (NG)** trước khi kết thúc task.
