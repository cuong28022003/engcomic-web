# UI Style Guide — EngComic Angular (Angular 21 Ready)

> Hướng dẫn thiết kế UI & Design System chuẩn mực cho AI assistant và lập trình viên khi xây dựng/chỉnh sửa component.
> Mọi component phải tuân thủ **Dark Mode Glassmorphism** làm ngôn ngữ thiết kế xuyên suốt.

---

## 🎨 1. Design Language & Triết Lý

**Phong cách:** Dark Glassmorphism + Vibrant Accent + Micro-animations

- **Nền tối sâu** (`#0d0f17`) kết hợp card kính mờ (`backdrop-filter: blur(14px-16px)`)
- **Accent chủ đạo** màu hồng đỏ `#ff3377` (CTA, highlight, glow) và tím Indigo `#6366f1` (Kỹ năng, Ngữ pháp, Học thuật)
- **Typography** `Plus Jakarta Sans` cho UI chính và `JetBrains Mono` / `Fira Code` cho code, công thức, phonetic transcriptions
- **Animation** mượt mà (`transition: 0.15s – 0.3s cubic-bezier(0.16, 1, 0.3, 1)`)
- **Tuyệt đối không dùng màu phẳng (Flat White/Black)** — mọi nền dùng gradient hoặc rgba với alpha

---

## 🎨 2. Color Tokens (CSS Custom Properties)

Tất cả đã được định nghĩa sẵn trong `:root` của [`src/styles.scss`](file:///d:/Others/my-projects/EngComic_angular/src/styles.scss):

```scss
/* === 1. Màu chủ đạo & Gradient === */
--primary-color: #ff3377;         /* Accent chính — hồng đỏ */
--primary-hover: #e02466;
--primary-gradient: linear-gradient(135deg, #ff3377 0%, #ff6584 100%);

--secondary-color: #6366f1;       /* Indigo — Ngữ pháp, Skill, Phụ trợ */
--secondary-hover: #4f46e5;
--secondary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

--accent-color: #ffb800;          /* Gold — VIP, Trophy, Rank */
--accent-gradient: linear-gradient(135deg, #ffb800 0%, #ff7700 100%);

--success-color: #10b981;         /* Emerald — Nộp bài, Success, Completed */
--success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);

--danger-color: #ef4444;          /* Red — Xóa, Lỗi, Bẫy đề thi */
--danger-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);

--warning-color: #f59e0b;         /* Amber — Cảnh báo, Streak, Mẹo thi */
--warning-gradient: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

/* === 2. Cấp độ Kính (Glassmorphism Levels) === */
--bg-main: #0d0f17;                   /* Nền toàn trang */
--bg-card: #161926;                   /* Card thông thường */
--bg-card-hover: #1e2235;             /* Card hover */
--bg-glass: rgba(22, 25, 38, 0.75);   /* Kính tiêu chuẩn */
--bg-glass-subtle: rgba(255, 255, 255, 0.03); /* Kính nền mờ nhẹ */
--bg-glass-card: rgba(18, 22, 36, 0.7);       /* Kính thẻ nội dung */
--bg-glass-active: rgba(99, 102, 241, 0.15);  /* Kính khi active/selected */
--bg-glass-modal: rgba(15, 18, 28, 0.95);     /* Kính modal */
--bg-overlay: rgba(10, 12, 18, 0.85);         /* Backdrop che mờ */

/* === 3. Viền & Highlight === */
--border-color: rgba(255, 255, 255, 0.08);    /* Viền mặc định tinh tế */
--border-subtle: rgba(255, 255, 255, 0.04);   /* Viền mờ ngăn cách */
--border-highlight: rgba(255, 255, 255, 0.16);/* Viền hover sáng */
--border-glow: rgba(255, 51, 119, 0.35);      /* Viền glow hồng */
--border-glow-secondary: rgba(99, 102, 241, 0.4); /* Viền glow indigo */

/* === 4. Chữ & Typography === */
--text-main: #f8fafc;             /* Chữ trắng chính */
--text-muted: #94a3b8;            /* Chữ phụ/mô tả */
--text-dim: #64748b;              /* Chữ nhạt/placeholder */

--font-main: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-pixel: 'Press Start 2P', monospace;

/* === 5. Bo góc (Border Radius) === */
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-xl: 28px;
--radius-full: 9999px;            /* Dạng con nhộng (Pill) */

/* === 6. Đổ bóng & Phát sáng (Shadows & Glows) === */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-card: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
--shadow-glow-primary: 0 0 25px rgba(255, 51, 119, 0.3);
--shadow-glow-secondary: 0 0 25px rgba(99, 102, 241, 0.3);
--shadow-glow-success: 0 0 20px rgba(16, 185, 129, 0.25);
--shadow-glow-gold: 0 0 25px rgba(255, 184, 0, 0.3);

/* === 7. Layer Z-Index === */
--z-dropdown: 100;
--z-sticky: 500;
--z-header: 1000;
--z-modal: 1100;
--z-toast: 1200;
--z-tooltip: 1300;
```

---

## 🧩 3. Global Utility Classes (Dùng Ngay Không Viết Lại SCSS)

### 🔹 3.1. Hệ Thống Buttons
```html
<!-- Nút CTA chính (Gradient Hồng) -->
<button class="btn-primary"><i class="fa-solid fa-plus"></i> Tạo Mới</button>

<!-- Nút Success (Gradient Xanh Ngọc - Bắt đầu học, Nộp bài) -->
<button class="btn-success"><i class="fa-solid fa-play"></i> Bắt Đầu Học</button>

<!-- Nút Secondary (Card Dark Outline) -->
<button class="btn-secondary">Hủy Bỏ</button>

<!-- Nút Danger (Gradient Đỏ - Xóa, Reset) -->
<button class="btn-danger"><i class="fa-solid fa-trash"></i> Xóa Dữ Liệu</button>

<!-- Nút Outline Variants (Viền màu, nền trong suốt) -->
<button class="btn-outline-primary">Xem Chi Tiết</button>
<button class="btn-outline-secondary">Lọc Nâng Cao</button>
<button class="btn-outline-danger">Xóa Khỏi Bộ Từ</button>

<!-- Nút Ghost & Nút Icon tròn -->
<button class="btn-ghost"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
<button class="btn-icon"><i class="fa-solid fa-volume-high"></i></button>
```

### 🔹 3.2. Hệ Thống Badges
```html
<span class="badge badge-primary"><i class="fa-solid fa-fire"></i> Hot</span>
<span class="badge badge-vip"><i class="fa-solid fa-crown"></i> VIP</span>
<span class="badge badge-genre">Ngữ Pháp</span>
<span class="badge badge-success"><i class="fa-solid fa-check"></i> Đã Thuộc</span>
<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Đang Học</span>
<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Cần Ôn</span>
```

### 🔹 3.3. Text Gradient & Typography
```html
<!-- Tiêu đề màu gradient -->
<h1 class="text-gradient-primary">EngComic Studio</h1>
<h2 class="text-gradient-secondary">Chủ Điểm Ngữ Pháp</h2>
<span class="text-gradient-gold">Rank VIP Kim Cương</span>

<!-- Cắt ngắn chữ với dấu ba chấm (...) -->
<p class="truncate">Dòng chữ rất dài sẽ tự cắt...</p>
<p class="line-clamp-2">Cắt tối đa 2 dòng...</p>
<p class="line-clamp-3">Cắt tối đa 3 dòng...</p>
```

### 🔹 3.4. Code & Monospace Utilities
```html
<!-- Code pill nhỏ gọn -->
<span class="code-badge">S + have/has + V3/ed</span>

<!-- Code block terminal full-width -->
<pre class="code-block"><code>I have lived in Hanoi since 2020.</code></pre>
```

### 🔹 3.5. Skeleton Loading Placeholder
```html
<!-- Ô chữ nhật placeholder sóng sáng -->
<div class="skeleton-box" style="width: 180px; height: 24px;"></div>

<!-- Avatar / Icon placeholder tròn -->
<div class="skeleton-circle" style="width: 48px; height: 48px;"></div>
```

---

## 🏛️ 4. Kho Component Dùng Chung (`@shared/components`)

Khi xây dựng giao diện mới, **BẮT BUỘC** tra cứu và tái sử dụng các component sau từ `@shared/components`:

| Component Selector | Mục Đích Sử Dụng | File Nguồn |
|---|---|---|
| `<app-modal>` | Hộp thoại popup kính tối (`size="sm\|md\|lg\|xl\|full"`) | `modal/modal.component.ts` |
| `<app-confirm-dialog>` | Xác nhận thao tác nguy hiểm (Xóa, Hủy, Đăng xuất) | `confirm-dialog/confirm-dialog.component.ts` |
| `<app-loading>` | Spinner / Hiệu ứng tải dữ liệu toàn trang hoặc theo khối | `loading/loading.component.ts` |
| `<app-empty-state>` | Hiển thị khi danh sách rỗng (kèm icon, mô tả & nút CTA) | `empty-state/empty-state.component.ts` |
| `<app-error-state>` | Báo lỗi API / Mất mạng (kèm nút Thử lại) | `error-state/error-state.component.ts` |
| `<app-data-filter-bar>` | Thanh công cụ tìm kiếm, bộ lọc danh mục, chế độ Grid/List và nút Chọn tất cả | `data-filter-bar/data-filter-bar.component.ts` |
| `<app-bulk-actions-bar>` | Thanh thao tác hàng loạt nổi dưới màn hình khi có item được chọn | `bulk-actions-bar/bulk-actions-bar.component.ts` |
| `<app-vocab-card>` | Thẻ từ vựng Flashcard (chế độ Grid/List, phát âm, trạng thái) | `vocab-card/vocab-card.component.ts` |
| `<app-comic-card>` | Thẻ truyện tranh (Bìa, cấp độ, lượt đọc, rating) | `comic-card/comic-card.component.ts` |
| `<app-ai-import-workspace>` | Workspace chung 2 bước để Import dữ liệu bằng Prompt AI & JSON | `ai-import-workspace/ai-import-workspace.component.ts` |
| `<app-form-input>` | Ô nhập liệu Form (kèm icon, trạng thái validate, clear button) | `form-input/form-input.component.ts` |
| `<app-form-select>` | Dropdown lựa chọn giao diện kính tối | `form-select/form-select.component.ts` |
| `<app-file-uploader>` | Kéo thả upload tệp (Ảnh bìa, PDF, Audio, Excel/JSON) | `file-uploader/file-uploader.component.ts` |
| `<app-paginator>` | Phân trang chuyển trang (Trang trước, Trang sau, Số trang) | `paginator/paginator.component.ts` |
| `<app-selection-checkbox>` | Checkbox chọn lựa vuông bo góc phát sáng đồng bộ | `selection-checkbox/selection-checkbox.component.ts` |
| `<app-progress-stepper>` | Thanh tiến trình các bước (Step 1, Step 2, Step 3) | `progress-stepper/progress-stepper.component.ts` |
| `<app-toast-container>` | Khay thông báo Toast Notification góc màn hình | `toast-container/toast-container.component.ts` |

---

## 🚫 5. Nguyên Tắc Bất Di Bất Dịch (Strict Rules)

| ❌ CẤM TUYỆT ĐỐI | ✅ BẮT BUỘC THỰC HIỆN |
|---|---|
| Viết inline template hoặc inline styles trong file `.ts` | Luôn tách thành 3 tệp độc lập (`.ts`, `.html`, `.scss`) |
| Dùng `alert()`, `confirm()`, `prompt()` của trình duyệt | Dùng `ToastService` hoặc `<app-confirm-dialog>` |
| Dùng màu phẳng trắng `background: white` | Dùng kính tối `var(--bg-glass)` hoặc `var(--bg-card)` |
| Tự viết lại Spinner / Loading CSS ad-hoc | Tái sử dụng `<app-loading>` từ `@shared/components` |
| Tự viết lại Empty / Error Block ad-hoc | Tái sử dụng `<app-empty-state>` và `<app-error-state>` |
| Dùng `any` trong TypeScript | Định nghĩa interface / type rõ ràng 100% |
| Dùng `*ngIf`, `*ngFor` kiểu cũ | Dùng Native Control Flow `@if`, `@for (track)`, `@switch` |
