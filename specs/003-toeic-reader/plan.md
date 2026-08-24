# Implementation Plan: TOEIC Reader Frontend (v4)

> **Feature ID**: 003  
> **Target**: `EngComic_angular` (Angular 21 + Signals + Zoneless + Dark Glassmorphism)

---

## 1. Kiến Trúc Phân Tầng

```
src/app/features/reader/
├── pages/
│   ├── reader-dashboard/              # Smart Container: Danh sách đề, trigger modal lịch sử
│   ├── create-test/                   # Smart Container: Upload PDF, parse answer key, redirect /reader
│   ├── reading-session/               # Smart Container: Phòng thi PDF split-screen, timer, confirm submit
│   ├── session-result/                # Smart Container: Score summary & breakdown
│   ├── attempt-review/                # Smart Container: Split review với PDF bên phải, green/red status
│   └── mistake-queue/                 # Smart Container: List mistakes, generate prompt, import AI JSON
├── components/
│   ├── pdf-viewer/                    # Dumb Component: iFrame wrapper & page jump
│   ├── bubble-sheet/                  # Dumb Component: Matrix chọn đáp án A/B/C/D
│   ├── pacing-timer/                  # Dumb Component: Hiển thị đếm ngược theo Part
│   ├── attempt-history-modal/         # Modal Component: Xem & chọn session thi trước
│   └── ai-review-import-modal/        # Modal Component: Import JSON kèm loading & toast
├── services/
│   ├── reader-api.service.ts          # API Client giao tiếp backend
│   └── mistake-queue.service.ts       # State & API cho Mistake Queue
└── reader.routes.ts                   # Modular route definition theo chuẩn web-client
```

---

## 2. Các Mốc Triển Khai (Milestones)

1. **Milestone 1: Quản lý Đề thi & File Streaming**:
   - Tải tệp PDF và stream qua `/api/toeic/tests/file/**`.
   - Tạo đề thi thành công ➔ Toast và chuyển về `/reader`.
2. **Milestone 2: Phòng thi Split-Screen & Nộp bài an toàn**:
   - Split-screen PDF + Bubble Sheet.
   - Pacing Timer + Flag câu hỏi.
   - Modal xác nhận nộp bài + Loading toàn màn hình khi đang chấm điểm.
3. **Milestone 3: Lịch sử Bài thi (Attempt History Modal)**:
   - Lưu trữ bài thi theo từng session (`attemptId`).
   - Modal xem danh sách các lần thi và điều hướng xem lại.
4. **Milestone 4: Không gian Xem Lại (Split Review UI)**:
   - Giữ PDF bên phải để đối chiếu đề gốc.
   - Phân biệt màu sắc trực quan: 🟢 Xanh lá (Đúng), 🔴 Đỏ cam (Sai), 🟡 Vàng (Cờ).
   - Nút "Quay lại danh sách đề thi".
5. **Milestone 5: Hàng Đợi Lỗi Sai & Tích Hợp AI**:
   - Tự động gom câu sai/cờ vào Mistake Queue.
   - Trích xuất System Prompt cho ChatGPT/Claude.
   - Import JSON giải thích có Loading indicator & Toast thông báo, đồng bộ vào session thi.
