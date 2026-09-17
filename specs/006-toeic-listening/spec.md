# Feature Specification: TOEIC Listening — Auto-Transcribe Audio Workspace (v1)

> **Perspective**: Frontend Product Owner & UI/UX  
> **Purpose**: Answer the question **"WHAT & WHY"** (UI / UX / Client Requirements)  
> **Version**: v1 — Full-audio test, Whisper auto-transcribe, reuse of Reading workspace

---

## 1. Overview & Objective

- **Feature ID**: 006
- **Feature Name**: TOEIC Listening — Auto-Transcribe Audio Workspace
- **Priority**: P1
- **Route**: reuse `/reader` (`/reader/new`, `/reader/:testId`, `/reader/:testId/result`, `/reader/:testId/attempts/:attemptId/review`)
- **Objective**: Mở rộng TOEIC Reader để hỗ trợ **bài thi Listening** (Câu 1–100, Part 1–4). Người dùng tạo đề bằng cách upload **PDF đề + 1 file audio full bài**; backend tự động `Whisper` transcribe để sinh mốc thời gian `audioStartMs` + `transcript` cho từng câu (không cần nhập tay). UX làm bài tái sử dụng tối đa workspace Reading nhưng thay vùng tài liệu = **PDF + Audio Player**.

**Cấu trúc đề Listening chuẩn (Q1–100)**:
| Part | Nội dung | Số câu | Khoảng câu |
|---|---|---|---|
| 1 | Photographs (nghe 4 câu mô tả, chọn A–D) | 6 | Q1–6 |
| 2 | Question-Response (chọn A–C, **chỉ 3 đáp án**) | 25 | Q7–31 |
| 3 | Conversations (13 hội thoại × 3 câu, 1 track/set) | 39 | Q32–70 |
| 4 | Talks (10 bài nói × 3 câu, 1 track/set) | 30 | Q71–100 |

---

## 2. Permissions & Preconditions

- **Target Audience**: `USER` (đã đăng nhập)
- **Guards**: `authGuard`
- **Preconditions**: JWT hợp lệ trong `localStorage`.

---

## 3. Quyết Định Thiết Kế (đã chốt với PO)

1. **Không dùng `imageUrl`** — ảnh Part 1 xem trực tiếp trong PDF đề.
2. **Audio là 1 file full cả đề** — test có `audioUrl`, kèm bản đồ `audioStartMs` cấp câu để biết đoạn nào thuộc part/câu nào.
3. **Part 2 hiển thị ngay luôn 3 ô A/B/C** (không ẩn).
4. **Transcript** chỉ hiển thị ở **màn review** (không toggle trong phòng thi).
5. **Auto-transcribe + alignment tự động** bằng Python/Whisper service — **không** dùng bước prompt/import transcript hay đánh dấu timestamp thủ công.
6. **Scaled score 5–495** theo section (Listening & Reading) dùng bảng chuẩn chung làm hằng số backend.

---

## 4. Luồng Hoàn Chỉnh (Top-to-Bottom)

```
[1] READER DASHBOARD (/reader)
    → Card đề thi hiện badge section 🔊 Nghe / 📖 Đọc + tab lọc (Tất cả / Nghe / Đọc)
    → Trạng thái xử lý audio trên card: ⏳ Đang transcribe / ✅ Sẵn sàng / ❌ Lỗi + nút thử lại
        ↓
[2] TẠO ĐỀ (/reader/new) — wizard 3 bước (mở rộng 3 bước Reading hiện có)
    Bước 1: Tên đề + Section (Nghe/Đọc) + Upload PDF
            → Nếu Section = Nghe: thêm Dropzone "File audio (MP3/M4A, toàn bộ bài thi)"
    Bước 2: Answer key — Prompt AI (map theo section)
    Bước 3: Answer key — Import JSON + preview → Lưu
    → Sau lưu: backend chạy Whisper async (không chặn), trạng thái hiện trên dashboard
        ↓
[3] LÀM BÀI — LISTENING SPLIT VIEW (/reader/:testId)
    ┌──────────────────────────────────────┬───────────────────────────────┐
    │  🔊 Audio Bar (gắn trên cùng pane)  │  📝 Answer Sheet (bên phải)    │
    │   - Play/Pause, Replay set, Slider   │   - Matrix câu + jump grid     │
    │   - Tốc độ 0.75/1/1.25               │   - Filter tab động theo part  │
    │   - Nhãn set: "P3 · Hội thoại 1 ·    │   - Part 2 = 3 ô A/B/C         │
    │     Q32–34" · highlight câu đang phát│   - Flag, pacing countdown     │
    │  📄 PDF Viewer (bên dưới Audio Bar)  │   - [Nộp bài]                  │
    │   - Ảnh Part 1, câu hỏi in P3/4      │                               │
    └──────────────────────────────────────┴───────────────────────────────┘
    → Click câu ở matrix/pane câu hỏi ➜ Audio Bar seek thẳng tới mốc câu đó
    → Audio tự chạy; answer sheet highlight "câu đang phát" theo audioStartMs
        ↓
[4] KẾT QUẢ (/reader/:testId/result)
    → Raw score, Scaled score (5–495 theo section), breakdown Part 1–4
        ↓
[5] XEM LẠI — SPLIT REVIEW (/reader/:testId/attempts/:attemptId/review)
    → Như Reading + hai bổ sung Listening:
      • Nút Replay audio (seek đúng segment câu đang xem)
      • Panel "Transcript" (text đã được Whisper sinh, chia theo câu/set)
```

---

## 5. Đặc Tả Chi Tiết Các Màn Hình

### 5.1 Screen A: Dashboard (`/reader`)
- **Tab lọc**: `Tất cả | Nghe | Đọc` (dựa trên `section` của test).
- **Badge section** trên mỗi card: 🔊 Nghe (chạm tím/indigo) / 📖 Đọc (chạm xanh).
- **Trạng thái audio** trên card Listening:
  - `processing` → chip ⏳ "Đang xử lý âm thanh..." (+ shimmer nhẹ)
  - `done` → chip ✅ "Audio sẵn sàng"
  - `failed` → chip ❌ "Lỗi xử lý âm thanh" + nút "Thử lại" (kê `POST /toeic/tests/{id}/transcribe`)
- Nút mở xử lý các test Listening chưa xong: không khóa nhưng vẫn mở được session (chế độ degrade: phát cả track, không sáng "câu đang phát").

### 5.2 Screen B: Tạo Đề Mới (`/reader/new`)
- **Bước 1**: thêm bộ chọn **Section** (Nghe/Đọc, mặc định Đọc). Chọn Nghe → mở Dropzone "File audio (toàn bộ)": MP3/M4A/WAV tối đa 200MB (đồng bộ max-file-size backend). Bắt buộc có audio khi section=Nghe.
- **Bước 2–3**: y hệt Reading hiện tại nhưng **prompt + mapping part theo section** (Listening: 1→Q1–6, 2→Q7–31, 3→Q32–70, 4→Q71–100).
- **Sau lưu (Nghe)**: toast "Đề đã tạo. Đang tự động trích xuất transcript & đánh dấu câu hỏi..." → về dashboard, card hiện `processing`.

### 5.3 Screen C: Phòng Thi Listening (`/reader/:testId`)
- **Audio Bar** (mới, `app-listening-audio-bar`):
  - Play/Pause, nút Replay (phát lại set hiện tại), slider seek hỗ trợ Range (206), thời gian `hh:mm:ss / hh:mm:ss`.
  - Tốc độ phát 0.75 / 1 / 1.25.
  - Nhãn set động: Part 1/2 → "P{n} · Câu Q{q}"; Part 3/4 → "P{n} · {Hội thoại|Bài nói} {k} · Q{start}–{end}".
  - **Highlight câu đang phát**: theo dõi `elapsed >= audioStartMs[question]` → answer sheet đánh dấu + tự cuộn row đang phát (optional, tắt nếu user chưa vào trạng thái "auto-jump").
  - Nếu chưa có audioStartMs (chưa xử lý xong) → disable seek từng câu, phát toàn track.
- **Answer Sheet**: reuse trọn vẹn; thêm `optionCount=3` cho Q thuộc Part 2. Filter tab sinh động từ `part` trong câu hỏi (không hardcode p5/p6/p7).
- **Pacing**: như Reading nhưng bảng part của Listening (mặc định 5/8/16/16 phút; `full_test` = 45').

### 5.4 Screen D: Kết Quả (`/reader/:testId/result`)
- Hiển thị Raw + **Scaled (5–495)** theo section (backend đã tính, field `scaledScore` có sẵn trong `SubmitSessionResponse`).
- Breakdown Part 1–4 theo accuracy/time.

### 5.5 Screen E: Xem Lại (`/review`)
- Toàn bộ như Reading +:
  - **Transcript panel**: hiện text của câu/set (`transcript`), tự cuộn theo câu đang chọn.
  - **Nút replay**: seek audio tới `audioStartMs` câu đang xem.

---

## 6. Models & Contracts (Frontend — bổ sung vào `reader/models/`)

```typescript
export type ToeicSection = 'reading' | 'listening';
export type AudioJobStatus = 'none' | 'processing' | 'done' | 'failed';

export interface TestQuestion {
  number: number;
  part: number;
  correctAnswer?: string;
  audioStartMs?: number;      // mốc bắt đầu trong audio full (ms)
  transcript?: string;        // text từ Whisper, khớp câu (P3/4: chung set)
}

// TestSummary / TestDetail thêm:
//   section: ToeicSection
//   audioUrl?: string
//   audioStatus?: AudioJobStatus

export interface CreateTestPayload {
  testName: string;
  section?: ToeicSection;
  pdfUrl?: string;
  audioUrl?: string;                       // sau khi upload audio
  questions: Array<{ number; part; correctAnswer; audioStartMs?; transcript? }>;
}

// TimeTargetConfig thêm (chỉ dùng cho listening):
//   part1_minutes?, part2_minutes?, part3_minutes?, part4_minutes?
```

---

## 7. UI/Design Invariants
- Theo `UI_STYLE_GUIDE.md` (Dark Glassmorphism), màu accent Listening = indigo `#6366f1` để phân biệt Reading.
- Loading/Error/Empty state luôn dùng `@shared`: `app-loading`, `app-error-state`, `app-empty-state`.
- `npx ng build --configuration=development` = 0 errors khi hoàn thành.