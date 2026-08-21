# Feature Specification: TOEIC Reader — PDF Viewer & Answer Sheet

> **Perspective**: Frontend Product Owner & UI/UX  
> **Purpose**: Answer the question **"WHAT & WHY"** (UI / UX / Client Requirements)
> **Version**: v3 — PDF pre-parsed by AI; JSON import with AI Parse Prompt helper

---

## 1. Overview & Objective

- **Feature ID**: 003
- **Feature Name**: TOEIC Reader — PDF Viewer & Answer Sheet
- **Priority**: P1
- **Route**: `/reader`
- **Objective**: Môi trường làm bài TOEIC tối giản và đáng tin cậy — PDF chỉ đóng vai trò hiển thị thuần túy (như Edge/Chrome PDF viewer), toàn bộ câu hỏi và đáp án đến từ JSON tự chuẩn bị. Người dùng cuộn đọc PDF bên trái, chọn đáp án bên phải, nộp bài, hệ thống chấm điểm và gom lỗi sai vào Mistake Queue để phân tích sau với AI.

> **Điều đã loại bỏ so với v1**:
> - ❌ Auto-parse PDF thành câu hỏi real-time (không cần, không đáng tin)
> - ❌ Text layer extraction từ PDF
> - ❌ Selection Popup tra từ từ PDF content (bỏ khỏi scope này)
> - ❌ Passage/Question_text lưu trong DB
>
> **Thay đổi so với v2**:
> - ✅ PDF được parse sẵn bởi AI (ChatGPT/Claude) trước khi import — không parse real-time
> - ✅ Thêm nút **"Copy AI Parse Prompt"** để hướng dẫn user nhờ AI đọc PDF → trả về JSON đúng format

---

## 2. Permissions & Preconditions

- **Target Audience**: `USER` (người dùng đã đăng nhập)
- **Guards**: `authGuard`
- **Preconditions**: Người dùng có JWT token hợp lệ lưu trong localStorage.

---

## 3. Luồng Hoàn Chỉnh (Top-to-Bottom)

```
[1] READER DASHBOARD (/reader)
    → Danh sách bài đã tạo (test sessions)
    → Nút "Tạo bài mới" → Wizard tạo test
        ↓
[2] TẠO TEST — WIZARD 3 BƯỚC
    Bước 1: Nhập tên đề + Upload PDF (để hiển thị trong split view)
    Bước 2: Copy AI Parse Prompt → Dán vào ChatGPT cùng với đề thi
             → AI trả về JSON đáp án đúng format
    Bước 3: Paste JSON từ AI → Preview → Lưu (answer_keys)
        ↓
[3] LÀM BÀI — SPLIT VIEW (/reader/:testId)
    ┌─────────────────────┬──────────────────┐
    │  📄 PDF Viewer        │  ⏱ Đếm ngược     │
    │  (cuộn, zoom)          │  ──────────────  │
    │                       │  Câu 101 (Part 5)│
    │                       │  ○A ○B ●C ○D    │
    │                       │  Câu 102         │
    │                       │  ●A ○B ○C ○D    │
    │                       │  [Flag ⚑]        │
    │                       │  ─────────────   │
    │                       │  ▓▓▓░░ 45/100    │
    │                       │  [Nộp bài]        │
    └─────────────────────┴──────────────────┘
    → Đáp án auto-save realtime khi chọn
        ↓
[4] NỘP BÀI → Chấm điểm
    → Đúng: highlight xanh
    → Sai: highlight đỏ + đáp án đúng hiện ra
    → Câu sai → TỰ ĐỘNG push vào Mistake Queue
        ↓
[5] KẾT QUẢ SESSION (/reader/:testId/result)
    → Score card, breakdown theo Part, thời gian
    → Danh sách câu sai
        ↓
[6] MISTAKE QUEUE (/reader/mistakes)
    → Xem lỗi tích lũy
    → Tạo AI Prompt batch → Copy → ChatGPT
    → Paste giải thích → Lưu → "Đã hiểu"
```

---

## 4. UI Screens Overview

### Screen A: Reader Dashboard (`/reader`)
- **Stats Bar**: Tổng bài, Hoàn thành, Điểm trung bình %, Lỗi pending (badge).
- **Test Cards Grid**: Mỗi card — tên đề, ngày làm, Part, điểm lần trước, trạng thái.
- **Nút "Tạo bài mới"**: Mở Wizard tạo test.
- **FAB "Mistake Queue"**: Badge đếm lỗi pending.

### Screen B: Create Test Wizard (`/reader/new`)

Wizard 3 bước — stepper indicator hiển thị tiến độ ở đầu trang.

---

**Bước 1 — Thông tin đề thi & Upload PDF:**
- Input: Tên đề thi (bắt buộc, ví dụ: "ETS 2024 Test 5").
- Dropzone upload file PDF — preview tên file + size.
- PDF này sẽ được hiển thị trong split view khi làm bài.
- Nút "Tiếp theo".

---

**Bước 2 — Lấy JSON từ AI (hướng dẫn):**

Đây là bước hướng dẫn thuần túy — không có form input. Giao diện hiển thị:

```
┌──────────────────────────────────────────────────────────┐
│  📋 Bước 2: Nhờ AI đọc đề và trả về JSON đáp án          │
│                                                          │
│  1. Mở ChatGPT hoặc Claude                               │
│  2. Upload file PDF đề thi vào cuộc trò chuyện            │
│  3. Copy prompt bên dưới và gửi cho AI:                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [AI Parse Prompt — readonly textarea]               │  │
│  │  Đây là đề thi TOEIC. Hãy đọc phần Answer Key      │  │
│  │  (đáp án) và trả về JSON theo đúng format...        │  │
│  └────────────────────────────────────────────────────┘  │
│                            [📋 Copy Prompt]               │
│                                                          │
│  4. Sau khi AI trả về JSON, copy và dán vào bước 3       │
│                                                          │
│            [← Quay lại]         [Tiếp theo →]            │
└──────────────────────────────────────────────────────────┘
```

**AI Parse Prompt (template cố định, copy vào clipboard):**
```
Đây là đề thi TOEIC. Hãy đọc phần Answer Key (bảng đáp án) trong file
và trả về JSON theo đúng format dưới đây. Chỉ trả về JSON thuần túy,
không kèm giải thích hay markdown.

Format yêu cầu:
{
  "test_name": "[Tên đề thi]",
  "questions": [
    { "number": 101, "part": 5, "correct_answer": "C" },
    { "number": 102, "part": 5, "correct_answer": "A" },
    ...
  ]
}

Lưu ý:
- number: số câu từ 101 đến 200 (TOEIC Reading)
- part: 5, 6, hoặc 7 (dựa theo cấu trúc đề)
- correct_answer: chỉ là 1 ký tự "A", "B", "C", hoặc "D"
- Trả về tất cả 100 câu (101-200)
```

---

**Bước 3 — Paste & Import JSON:**
- Textarea lớn: "Dán JSON từ AI vào đây".
- Nút **"Parse & Preview"**:
  - Bảng preview: STT, Số câu, Part, Đáp án đúng.
  - Validation: cảnh báo thiếu trường, số câu ngoài range 101-200, đáp án không phải A/B/C/D.
  - Hiển thị: "Đã parse được X câu, Y câu lỗi".
- Nút **"Xem mẫu JSON"** → modal hiện JSON mẫu để đối chiếu.
- Nút **"Lưu & Bắt đầu làm bài"** — chỉ enable khi parse thành công không có lỗi.

**JSON Schema chuẩn (dùng cho preview + validation):**
```json
{
  "test_name": "ETS 2024 Test 5 - Reading",
  "questions": [
    { "number": 101, "part": 5, "correct_answer": "C" },
    { "number": 102, "part": 5, "correct_answer": "A" },
    { "number": 147, "part": 7, "correct_answer": "D" }
  ]
}
```

### Screen C: Reading Session (`/reader/:testId`)

#### C1. PDF Viewer Panel (trái / trên mobile)
- Hiển thị PDF bằng `<iframe>` hoặc PDF.js (xem section 5).
- Controls: Zoom in/out, trang hiện tại / tổng trang.
- Chiều cao = 100vh, cuộn độc lập với panel phải.

#### C2. Answer Sheet Panel (phải / dưới mobile)
- **Header**: Timer đếm ngược (nếu có set thời gian), progress bar "X/Y câu đã trả lời".
- **Câu hỏi**: Chỉ hiển thị **số câu + Part** (101-200) — KHÔNG hiển thị nội dung câu (vì nội dung đang đọc trên PDF).
- **Lựa chọn**: 4 radio button A/B/C/D mỗi câu.
- **Flag button ⚑**: Đánh dấu câu muốn xem lại (highlight vàng nhạt).
- **States**:
  - `unanswered` — neutral
  - `answered` — lựa chọn highlight nhẹ
  - `flagged` — viền vàng
  - `correct` (sau nộp) — nền xanh
  - `wrong` (sau nộp) — nền đỏ + hiện đáp án đúng
- **Jump to question**: Mini-grid số câu ở trên cùng để nhảy nhanh.
- **Nút "Nộp Bài"**: Confirm dialog → nộp.

#### C3. Grading Overlay (sau nộp)
- Answer Sheet lock (không thể thay đổi).
- Mỗi câu sai hiện `✗ Bạn chọn: A  ✓ Đáp án: C`.
- Câu sai auto-push vào Mistake Queue (silent, không cần user click).

### Screen D: Session Result (`/reader/:testId/result`)
- **Score Card**: Raw score (X/100), Scaled score (nếu có bảng quy đổi), thời gian.
- **Part Breakdown**: Bảng % đúng theo Part 5/6/7.
- **Câu sai**: Danh sách số câu sai (Part X, Câu Y — chọn A, đúng C).
- **Actions**: "Xem lại bài" (quay về split view, readonly) / "Về Dashboard" / "Phân tích lỗi".

### Screen E: Mistake Queue (`/reader/mistakes`)
- **Filter tabs**: Pending / Explained / Resolved / All.
- **Danh sách lỗi** (nhóm theo ngày):
  - Câu số, Part, Tên đề, Ngày làm.
  - Chọn ✗ vs Đúng ✓.
  - Status badge.
- **"Tạo AI Prompt"**: Gom tất cả `pending` → sinh prompt → copy clipboard.
- **Textarea nhập giải thích**: Paste từ ChatGPT → Save → `explained`.
- **"Đã hiểu"**: `→ resolved`.

---

## 5. PDF Viewer — Implementation Choice

### Option A: `<iframe>` (Recommended cho MVP)
```html
<iframe [src]="pdfUrl | safe" width="100%" height="100%"
        style="border: none;"></iframe>
```
- **Ưu điểm**: Zero implementation, dùng browser native PDF viewer.
- **Nhược điểm**: Không kiểm soát được style/zoom riêng.
- **Dùng khi**: MVP, không cần custom UI.

### Option B: PDF.js (Recommended cho production)
```typescript
async loadPdf(fileUrl: string) {
  const pdf = await pdfjsLib.getDocument(fileUrl).promise;
  this.totalPages = pdf.numPages;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: this.zoomLevel });
    const canvas = this.createCanvasForPage(i, viewport);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  }
}
```
- **Ưu điểm**: Full control style, zoom custom, dark mode overlay.
- **Nhược điểm**: Cần setup worker + bundle size lớn hơn.

> **Quyết định**: Bắt đầu với `<iframe>` (MVP), migrate sang PDF.js sau nếu cần custom UI.

---

## 6. Component Architecture

```
src/app/features/reader/
├── reader.module.ts + reader-routing.module.ts
│
├── reader-dashboard/
│   └── reader-dashboard.component.ts/.html/.scss
│
├── create-test/                          [Wizard 2 bước]
│   ├── create-test.component.ts/.html/.scss
│   ├── pdf-upload-step/
│   │   └── pdf-upload-step.component.ts/.html/.scss
│   └── answer-key-step/
│       └── answer-key-step.component.ts/.html/.scss
│
├── reading-session/
│   ├── reading-session.component.ts/.html/.scss    [orchestrator]
│   ├── pdf-viewer/
│   │   └── pdf-viewer.component.ts/.html/.scss     [dumb — nhận pdfUrl]
│   └── answer-sheet/
│       ├── answer-sheet.component.ts/.html/.scss    [smart — owns answer state]
│       └── question-row/
│           └── question-row.component.ts/.html/.scss  [dumb]
│
├── session-result/
│   └── session-result.component.ts/.html/.scss
│
└── mistake-queue/
    ├── mistake-queue.component.ts/.html/.scss
    ├── mistake-item/
    │   └── mistake-item.component.ts/.html/.scss
    └── ai-prompt-builder/
        └── ai-prompt-builder.component.ts/.html/.scss
```

**Services:**
```
reader/services/
├── reader-api.service.ts       # HTTP calls
├── mistake-queue.service.ts    # BehaviorSubject<Mistake[]> + localStorage
├── answer-key.service.ts       # Parse + validate JSON import
└── grading.service.ts          # Pure: compare user_answers vs answer_keys
```

---

## 7. State Management

| State | Nơi lưu | Lifecycle |
|:---|:---|:---|
| Đáp án đang chọn | `AnswerSheet` component + `localStorage` (auto-save) | Session |
| Flagged questions | `AnswerSheet` component | Session |
| Timer | `ReadingSession` component | Session |
| Kết quả sau chấm | `ReadingSession` component | Session |
| Mistake Queue | `MistakeQueueService` (BehaviorSubject + localStorage) | App-wide |

---

## 8. Reuse từ Shared Module

| Shared | Dùng ở đâu |
|:---|:---|
| `app-confirm-dialog` | Confirm nộp bài |
| `app-empty-state` | Dashboard khi chưa có test |
| `SafeHtmlPipe` / `SafePipe` | `[src]="pdfUrl \| safe"` cho iframe |
| `ClickOutsideDirective` | Dropdown/Popup trong answer sheet |
| `TimeAgoPipe` | Ngày làm bài trên mistake queue |

---

## 9. Business & UI Invariants

- [ ] **Rule 1**: PDF chỉ là display — KHÔNG cần xử lý content, KHÔNG cần text layer.
- [ ] **Rule 2**: `correct_answer` KHÔNG được hiển thị trước khi nộp bài.
- [ ] **Rule 3**: Đáp án auto-save vào localStorage mỗi khi user chọn (tránh mất khi F5).
- [ ] **Rule 4**: Nút "Nộp Bài" disabled nếu còn câu chưa trả lời (hoặc có confirm "Bạn còn X câu chưa trả lời").
- [ ] **Rule 5**: Sau nộp bài — Answer Sheet LOCK, không cho thay đổi.
- [ ] **Rule 6**: Câu sai AUTO push vào Mistake Queue — không cần user click.
- [ ] **Rule 7**: Mistake Queue badge cập nhật real-time trên nav.
- [ ] **Rule 8**: PDF panel và Answer panel cuộn **độc lập nhau**.
- [ ] **Rule 9**: Responsive — mobile collapse 2 panel thành tabs (PDF tab / Câu hỏi tab).

---

## 10. Chế Độ Luyện Tập Theo Part & Tính Giờ Mục Tiêu (v4 Extension)

### 10.1 Màn hình Thiết lập Mục tiêu (`PreTestConfigModalComponent`)
Hiển thị modal trước khi bắt đầu làm bài:
1. **Phần chọn phạm vi luyện tập (Part Scope)**:
   - Các preset nút bấm: *Toàn bộ đề (100 câu)*, *Chỉ Part 5 (30 câu)*, *Chỉ Part 6 (16 câu)*, *Chỉ Part 7 (54 câu)*.
   - Checkbox độc lập cho từng Part (Part 5: 101-130, Part 6: 131-146, Part 7: 147-200).
   - Tự động đếm tổng số câu hỏi được chọn.
2. **Chế độ tính giờ**:
   - `full_test`: Chuẩn TOEIC theo các Part đã chọn (Part 5: 20p, Part 6: 10p, Part 7: 45p).
   - `per_part`: Tự do chỉnh số phút cho từng Part.
   - `untimed`: Không giới hạn thời gian (chỉ đo thời gian làm bài thực tế).
3. **Ghi nhớ cấu hình mặc định**: Lưu vào `localStorage` (`toeic_user_time_settings`).

### 10.2 Thanh Trạng Thái Nhịp Độ (`PacingStatusBarComponent`)
- Tích hợp trực tiếp trên đỉnh Bảng đáp án (`AnswerSheetComponent`).
- Đồng hồ Part hiện tại & Tổng thời gian đếm ngược (hoặc đếm xuôi nếu untimed).
- 2 thanh Progress bar so sánh trực tiếp:
  - Thanh 1: `% Thời gian đã dùng của Part`.
  - Thanh 2: `% Số câu đã làm của Part`.
- Pacing Badge hiển thị trạng thái nhịp độ:
  - 🟢 **Nhanh hơn dự kiến (`ahead`)**
  - 🔵 **Đúng nhịp độ (`on_track`)**
  - 🔴 **Cần tăng tốc (`behind`)**

### 10.3 Bảng Đáp Án Tinh Gọn Cho Từng Part
- Khi người dùng chỉ chọn luyện một số Part (ví dụ Part 5), Answer Sheet và Quick Jump Grid chỉ render 30 câu hỏi (101 - 130).
- Chấm điểm và phân tích kết quả tính toán chính xác trên số câu đã chọn (ví dụ: 27/30 câu đúng ➔ 90%).

---

## 11. Tái Sử Dụng Thư Viện Shared Component Chuẩn
- `<app-modal>`: Khung cửa sổ modal cho cấu hình mục tiêu.
- `<app-loading>` & `<app-error-state>`: Trạng thái tải và báo lỗi kết nối.
- `<app-paginator>`: Bộ phân trang chuẩn Angular Signals (chọn số lượng trang, nhảy trang, cửa sổ trượt trang) dùng trong Mistake Queue (`/reader/mistakes`).
- Feature-scoped `WordLookupPopupComponent`: Popup tra từ điển nhanh tức thì khi bôi đen chữ trong PDF viewer, tích hợp Google Translate backend và Web Speech API.
