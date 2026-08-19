# UI Style Guide — EngComic Angular

> Hướng dẫn thiết kế UI cho AI assistant khi tạo hoặc chỉnh sửa component.
> Mọi component phải tuân thủ **Dark Mode Glassmorphism** làm ngôn ngữ thiết kế xuyên suốt.

---

## 🎨 1. Design Language

**Phong cách:** Dark Glassmorphism + Vibrant Accent + Micro-animations

- **Nền tối** (`#0d0f17`) với các card có kính mờ (`backdrop-filter: blur`)
- **Accent chủ đạo** màu hồng đỏ `#ff3377` — dùng cho CTA, highlight, glow effects
- **Typography** Plus Jakarta Sans — hiện đại, dễ đọc
- **Animation** mượt mà (`transition: 0.2–0.3s ease`) — hover float, scale, glow
- **Không dùng màu phẳng** — mọi màu nền dùng gradient hoặc rgba với alpha

---

## 🎨 2. Color Tokens (CSS Variables)

```scss
/* === Màu chủ đạo === */
--primary-color: #ff3377;         /* Accent chính — hồng đỏ */
--primary-hover: #e02466;
--primary-gradient: linear-gradient(135deg, #ff3377 0%, #ff6584 100%);

--secondary-color: #6366f1;       /* Indigo — cho skill, tag phụ */
--secondary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);

--accent-color: #ffb800;          /* Gold — cho VIP, trophy, rank */
--success-color: #10b981;         /* Green — HP bar, success state */
--danger-color: #ef4444;          /* Red — enemy HP bar, error, delete */
--warning-color: #f59e0b;         /* Amber — warning, streak */

/* === Nền === */
--bg-main: #0d0f17;               /* Nền toàn trang */
--bg-card: #161926;               /* Card thông thường */
--bg-card-hover: #1e2235;         /* Card hover state */
--bg-glass: rgba(22, 25, 38, 0.75); /* Glassmorphism panel */
--bg-overlay: rgba(10, 12, 18, 0.85); /* Modal overlay */

/* === Viền === */
--border-color: rgba(255, 255, 255, 0.08);  /* Viền mặc định tinh tế */
--border-glow: rgba(255, 51, 119, 0.35);    /* Viền highlight/hover */

/* === Chữ === */
--text-main: #f8fafc;             /* Chữ trắng chính */
--text-muted: #94a3b8;            /* Chữ phụ/mô tả */
--text-dim: #64748b;              /* Chữ nhạt/placeholder */

/* === Khoảng cạnh (Border Radius) === */
--radius-sm: 8px;
--radius-md: 14px;
--radius-lg: 20px;
--radius-full: 9999px;            /* Pill shape */

/* === Shadow === */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-glow: 0 0 25px rgba(255, 51, 119, 0.25);  /* Glow hiệu ứng */
--shadow-card: 0 10px 30px -5px rgba(0, 0, 0, 0.4);
```

---

## 🔠 3. Typography

```scss
--font-main: 'Plus Jakarta Sans', system-ui, sans-serif;  /* Font chính */
--font-pixel: 'Press Start 2P', monospace;                 /* Pixel font cho game UI */
```

| Cấp | Font size | Font weight | Dùng cho |
|---|---|---|---|
| Page title h1 | 2–2.4rem | 800 | Tiêu đề trang lớn |
| Section title h2 | 1.5–1.8rem | 700-800 | Tiêu đề section |
| Card title h3 | 0.95–1.15rem | 700 | Tiêu đề card |
| Body | 0.9–0.95rem | 400-500 | Nội dung thông thường |
| Caption/label | 0.78–0.85rem | 500-600 | Label, meta info |
| Tiny | 0.72–0.75rem | 400-600 | Tag, badge text |

---

## 🧩 4. Utility Classes — Dùng luôn, không viết CSS thừa

### Layout
```html
<!-- Page wrapper — max-width, padding auto -->
<div class="container">

<!-- Dark glassmorphism panel -->
<div class="glass-panel">

<!-- Comic card grid responsive -->
<div class="comic-grid">
```

### Buttons
```html
<!-- CTA chính — gradient hồng, pill shape -->
<button class="btn-primary">
  <i class="fa-solid fa-check"></i> Lưu thay đổi
</button>

<!-- Nút phụ — dark outline -->
<button class="btn-secondary">Hủy bỏ</button>

<!-- Nút icon tròn -->
<button class="btn-icon">
  <i class="fa-solid fa-trash"></i>
</button>
```

### Badges
```html
<!-- Hồng — "New", "Hot", feature labels -->
<span class="badge badge-primary"><i class="fa-solid fa-fire"></i> Hot</span>

<!-- Gold — VIP, Premium, Trophy -->
<span class="badge badge-vip"><i class="fa-solid fa-crown"></i> VIP</span>

<!-- Indigo — Thể loại, Tag, Tech label -->
<span class="badge badge-genre">Hành động</span>
```

---

## 🃏 5. Component Patterns

### Panel / Section
```html
<div class="section-panel glass-panel">
  <div class="panel-header">
    <h2><i class="fa-solid fa-icon highlight"></i> Tiêu đề Section</h2>
    <p class="subtitle">Mô tả ngắn gọn</p>
  </div>
  <!-- content -->
</div>
```

```scss
.panel-header h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.highlight { color: var(--primary-color); }
.subtitle { color: var(--text-muted); font-size: 0.9rem; }
```

### Form Input
```scss
input, select, textarea {
  padding: 12px 16px;
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-main);
  outline: none;
  font-size: 0.92rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(255, 51, 119, 0.15);
  }
}
```

### Table (Admin / Data list)
```scss
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding: 12px 16px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  border-bottom: 1px solid var(--border-color);
}

.data-table td {
  padding: 14px 16px;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
```

### Loading State
```html
<div class="loading-state">
  <i class="fa-solid fa-circle-notch fa-spin spinner"></i>
  <p>Đang tải...</p>
</div>
```
```scss
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: var(--text-muted);
  gap: 12px;
}
.spinner { font-size: 1.8rem; color: var(--primary-color); }
```

### Empty State
```html
<div class="empty-state">
  <i class="fa-regular fa-folder-open empty-icon"></i>
  <h3>Chưa có dữ liệu</h3>
  <p>Mô tả hướng dẫn người dùng làm gì tiếp theo.</p>
  <a routerLink="/..." class="btn-primary">Thực hiện action</a>
</div>
```
```scss
.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-icon { font-size: 3rem; color: var(--text-dim); }
.empty-state h3 { font-size: 1.2rem; color: #fff; }
.empty-state p { color: var(--text-muted); max-width: 400px; font-size: 0.9rem; }
```

---

## ✨ 6. Animation & Hover Rules

### Hover card float
```scss
.card:hover {
  transform: translateY(-4px);
  border-color: var(--border-glow);
  box-shadow: 0 12px 30px rgba(255, 51, 119, 0.2);
}
```

### Hover glow button
```scss
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 51, 119, 0.45);
  filter: brightness(1.08);
}
```

### Transition standard
```scss
transition: all 0.2s ease;       /* Interaction thông thường */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);  /* Card, modal */
```

### Shake animation (hit effect, error)
```scss
@keyframes shake {
  10%, 90% { transform: translate3d(-2px, 0, 0); }
  20%, 80% { transform: translate3d(4px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
  40%, 60% { transform: translate3d(6px, 0, 0); }
}
```

### Fade in up
```scss
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-in-up { animation: fadeInUp 0.4s ease both; }
```

---

## 📱 7. Responsive Breakpoints

| Breakpoint | Ngưỡng | Ghi chú |
|---|---|---|
| Mobile | `max-width: 480px` | 1 cột, padding nhỏ |
| Tablet | `max-width: 768px` | 2 cột, rút gọn header |
| Small desktop | `max-width: 1024px` | Layout điều chỉnh |
| Full desktop | `min-width: 1024px` | Layout đầy đủ |

```scss
// Responsive grid chuẩn
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

// Sidebar → full width trên mobile
@media (max-width: 900px) {
  .layout-with-sidebar {
    grid-template-columns: 1fr;  /* Đổi sidebar thành toàn màn hình */
  }
}
```

---

## 🚫 8. Những thứ KHÔNG làm

| ❌ Không làm | ✅ Thay bằng |
|---|---|
| Dùng màu trắng `background: white` | `background: var(--bg-card)` |
| Hardcode màu `color: #ff0000` | `color: var(--danger-color)` |
| `border-radius: 4px` cho card | `border-radius: var(--radius-md)` |
| Font mặc định browser | `font-family: var(--font-main)` |
| `box-shadow: none` trên card | Luôn có shadow nhẹ `var(--shadow-card)` |
| Thiếu hover effect trên element tương tác | Thêm `transition` + `transform: translateY` |
| Bảng/danh sách không có `border-bottom` giữa rows | Thêm `border-bottom: 1px solid var(--border-color)` |
| Loading state trắng trơn | Dùng spinner icon FA + text |
| Empty state trống không | Icon lớn + tiêu đề + mô tả + CTA button |
| `alert()` / `confirm()` của browser | Dùng `ToastService` hoặc modal riêng |

---

## 🧱 9. Cấu trúc component SCSS chuẩn

```scss
// Mỗi component styles nên theo thứ tự:
// 1. Host element / container
// 2. Header / Title section
// 3. Main content areas
// 4. Cards / List items
// 5. Form elements
// 6. Buttons / Actions
// 7. States: loading, empty, error
// 8. Responsive overrides @media

.my-component-container {
  // Container chính
}

.panel-header {
  // Tiêu đề section
}

.content-area {
  // Vùng nội dung chính
}

// Responsive luôn ở cuối file
@media (max-width: 768px) { ... }
```

---

## 🔣 10. Icon — FontAwesome 6

CDN đã được load trong `index.html`. Dùng trực tiếp trong template:

```html
<!-- Solid icons (đậm) -->
<i class="fa-solid fa-house"></i>        <!-- Home -->
<i class="fa-solid fa-book-open"></i>    <!-- Reading -->
<i class="fa-solid fa-layer-group"></i>  <!-- Decks -->
<i class="fa-solid fa-wand-magic-sparkles"></i> <!-- Gacha/Magic -->
<i class="fa-solid fa-trophy"></i>       <!-- Leaderboard -->
<i class="fa-solid fa-crown"></i>        <!-- VIP -->
<i class="fa-solid fa-gem"></i>          <!-- Diamonds -->
<i class="fa-solid fa-fire"></i>         <!-- Streak -->
<i class="fa-solid fa-bolt"></i>         <!-- XP / Energy -->
<i class="fa-solid fa-circle-notch fa-spin"></i>  <!-- Loading spinner -->
<i class="fa-solid fa-check"></i>        <!-- Success -->
<i class="fa-solid fa-xmark"></i>        <!-- Close / Error -->
<i class="fa-solid fa-trash"></i>        <!-- Delete -->
<i class="fa-solid fa-pen-to-square"></i> <!-- Edit -->

<!-- Regular icons (nhẹ hơn) -->
<i class="fa-regular fa-heart"></i>
<i class="fa-regular fa-bookmark"></i>
<i class="fa-regular fa-eye"></i>
```
