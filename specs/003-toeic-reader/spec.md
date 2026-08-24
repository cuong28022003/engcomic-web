# Feature Specification: TOEIC Reader — PDF Viewer & Exam Workspace (v4)

> **Perspective**: Frontend Product Owner & UI/UX  
> **Purpose**: Answer the question **"WHAT & WHY"** (UI / UX / Client Requirements)  
> **Version**: v4 — Full Split-Screen PDF, Session Attempts, AI Non-blocking Review & Mistake Queue Integration

---

## 1. Overview & Objective

- **Feature ID**: 003
- **Feature Name**: TOEIC Reader — PDF Viewer & Exam Workspace
- **Priority**: P1
- **Route**: `/reader`
- **Objective**: Môi trường làm bài thi TOEIC Reading chuyên nghiệp (PDF chia đôi màn hình), chấm điểm tự động chuẩn ETS, lưu lịch sử làm bài theo session, không gian xem lại bài làm song song với đề thi PDF, trích xuất System Prompt cho AI và import JSON giải thích trực tiếp vào từng câu hỏi.

---

## 2. Permissions & Preconditions

- **Target Audience**: `USER` (người dùng đã đăng nhập)
- **Guards**: `authGuard`
- **Preconditions**: Người dùng có JWT token hợp lệ lưu trong `localStorage`.

---

## 3. Luồng Hoàn Chỉnh (Top-to-Bottom)

```
[1] READER DASHBOARD (/reader)
    → Danh sách đề thi & thẻ trạng thái (Chưa làm / Đã làm / Số lượt thi)
    → Modal xem lịch sử các lần thi theo từng session (Attempt History Modal)
    → Nút "Tạo đề mới" → Wizard tạo đề thi
        ↓
[2] TẠO ĐỀ THI (/reader/new)
    → Bước 1: Nhập tên đề + Upload file PDF
    → Bước 2: Copy AI Prompt hoặc Upload / Paste JSON Answer Key
    → Bước 3: Lưu thành công → Tự động chuyển hướng về /reader kèm Toast thông báo
        ↓
[3] LÀM BÀI — SPLIT VIEW (/reader/:testId)
    ┌──────────────────────────────────┬─────────────────────────────────┐
    │  📄 PDF Viewer (Bên trái)        │  ⏱ Bộ đếm Pacing (Bên phải)   │
    │  - Cuộn trang, zoom, nhảy trang │  - Đếm ngược theo Part         │
    │  - Tải stream từ backend         │  - Phiếu tô đáp án Matrix       │
    │                                  │  - Đánh cờ câu hỏi (Flag ⚑)     │
    │                                  │  - Tiến độ câu đã làm          │
    │                                  │  - [Nộp bài]                    │
    └──────────────────────────────────┴─────────────────────────────────┘
        ↓
[4] NỘP BÀI THI
    → Modal xác nhận (Confirm Dialog) hiển thị số câu đã làm / bỏ trống
    → Loading Indicator toàn màn hình khi đang chấm điểm (chống spam click)
    → Chấm điểm tự động: Raw Score, Scaled Score (/495), % chính xác từng Part
    → Tự động đẩy câu sai + câu đánh cờ vào Mistake Queue
        ↓
[5] KẾT QUẢ BÀI THI (/reader/:testId/result)
    → Score Card tổng thể, phân tích tốc độ & độ chính xác theo Part 5, 6, 7
    → Nút "Xem lại bài thi" & "Hàng đợi lỗi sai"
        ↓
[6] XEM LẠI BÀI THI — SPLIT REVIEW (/reader/:testId/attempts/:attemptId/review)
    ┌──────────────────────────────────┬─────────────────────────────────┐
    │  💡 Chi Tiết Bài Làm (Bên trái)  │  📄 Đề Thi PDF (Bên phải)       │
    │  - Matrix câu hỏi phân biệt màu: │  - Giữ đề bên phải để so sánh   │
    │    🟢 Xanh lá: Đúng              │    văn bản dài Part 7 & ảnh     │
    │    🔴 Đỏ cam: Sai                │                                 │
    │    🟡 Vàng: Đánh cờ              │                                 │
    │  - So sánh Your Answer vs Key    │                                 │
    │  - Lời giải AI chi tiết          │                                 │
    │  - [Quay lại danh sách đề thi]   │                                 │
    └──────────────────────────────────┴─────────────────────────────────┘
        ↓
[7] HÀNG ĐỢI LỖI SAI — MISTAKE QUEUE (/reader/mistakes)
    → Danh sách các câu làm sai đang chờ ôn tập (`size=1000`, `questionNumber ASC`)
    → Trích xuất System Prompt tối ưu cho ChatGPT/Claude
    → Import JSON lời giải AI kèm Loading & Toast notification
    → Đồng bộ lời giải ngược vào attempt tương ứng mà không tạo bản ghi trùng lặp
```

---

## 4. Đặc Tả Chi Tiết Các Màn Hình UI

### 4.1 Screen A: Reader Dashboard (`/reader`)
- **Header & Stats Overview**: Thống kê số đề thi đã luyện, điểm cao nhất, điểm trung bình.
- **Grid Danh Sách Đề Thi**:
  - Đối với đề chưa từng làm: Hiển thị nút "Bắt đầu làm bài".
  - Đối với đề đã từng làm: Hiển thị "Làm lại" và nút "Xem lịch sử làm bài".
- **Attempt History Modal**:
  - Xem danh sách các lần thi (`Lần 1`, `Lần 2`, `Lần 3`...) kèm điểm số, thời gian làm và ngày nộp.
  - Chọn một session để chuyển thẳng sang màn hình Xem lại (`/reader/:testId/attempts/:attemptId/review`).

### 4.2 Screen B: Tạo Đề Thi Mới (`/reader/new`)
- Input tên đề thi + Dropzone tải tệp PDF đề thi.
- Parser đáp án đúng: Hỗ trợ copy Prompt cho AI trích xuất đáp án từ PDF hoặc dán JSON có sẵn.
- Sau khi tạo đề thành công: Hiển thị Toast thông báo thành công và chuyển hướng về `/reader` để chọn làm bài.

### 4.3 Screen C: Phòng Thi Chia Đôi Màn Hình (`/reader/:testId`)
- **Khung PDF (Bên trái)**: Render PDF qua `<iframe>` stream nội bộ từ backend chống CORS và bảo mật.
- **Khung Đáp Án (Bên phải)**:
  - Phiếu tô trắc nghiệm (Bubble Sheet A/B/C/D) cho Part 5, 6, 7.
  - Bộ đếm thời gian Pacing theo từng Part.
  - Nút đánh cờ câu hỏi nghi vấn (`flagged`).
- **Nộp bài**:
  - Bấm nộp bài ➔ Mở Modal xác nhận.
  - Khi người dùng xác nhận ➔ Bật loading indicator toàn màn hình và gọi API nộp bài.

### 4.4 Screen D: Báo Cáo Kết Quả (`/reader/:testId/result`)
- Hiển thị điểm Raw Score và Scaled Score (thang 5-495 điểm Reading TOEIC).
- Phân tích chi tiết: % chính xác theo từng Part (5, 6, 7), thời gian trung bình từng câu.
- Danh sách câu hỏi kèm trạng thái đúng/sai.

### 4.5 Screen E: Không Gian Xem Lại Bài Thi (`/reader/:testId/attempts/:attemptId/review`)
- **Giữ đề thi PDF bên phải**: Để người học đọc lại toàn bộ bài đọc hiểu Part 7 và hình ảnh Part 6 mà không bị khuất.
- **Phân biệt màu sắc trực quan**:
  - 🟢 **Xanh lá**: Trả lời đúng (`isCorrect === true`).
  - 🔴 **Đỏ cam**: Trả lời sai (`isCorrect === false`).
  - 🟡 **Vàng**: Câu đánh cờ (`flagged === true`).
- **So sánh đáp án**: Hiển thị rõ ràng đáp án của người dùng và đáp án đúng.
- **Lời giải AI**: Hiển thị bản dịch, điểm ngữ pháp và từ vựng trọng tâm.
- Nút "Quay lại danh sách đề thi" điều hướng về `/reader`.

### 4.6 Screen F: Hàng Đợi Lỗi Sai (`/reader/mistakes`)
- Tập hợp toàn bộ các câu hỏi làm sai từ tất cả các lần thi.
- Nút **"Tạo Prompt Cho AI"**: Tự động sinh System Prompt có cấu trúc JSON cho ChatGPT/Claude.
- Modal **"Import Lời Giải AI"**: Cho phép dán hoặc tải tệp JSON phân tích từ AI lên.
  - Có Loading indicator khi đang import và Toast thông báo khi hoàn thành.
  - Cập nhật trạng thái câu hỏi thành `explained` và đồng bộ vào session làm bài cũ.

---

## 5. Danh Mục Models & Interfaces (Frontend)

```typescript
export interface ToeicTest {
  id: string;
  title: string;
  pdfUrl: string;
  totalQuestions: number;
  totalParts: number[];
  attemptCount?: number;
  lastAttemptScore?: number;
  createdAt: string;
}

export interface GradedQuestion {
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  flagged?: boolean;
  timeSpentSeconds?: number;
  aiExplanation?: string;
}

export interface ToeicAttempt {
  id: string;
  testId: string;
  testTitle?: string;
  pdfUrl?: string;
  rawScore: number;
  scaledScore: number;
  totalQuestions: number;
  durationSeconds: number;
  completedAt: string;
  answers: GradedQuestion[];
}

export interface MistakeQueueItem {
  id: string;
  testId: string;
  attemptId: string;
  questionNumber: number;
  part: number;
  userAnswer?: string;
  correctAnswer: string;
  status: 'pending' | 'reviewed' | 'explained';
  aiExplanation?: string;
  flagged?: boolean;
}
```
