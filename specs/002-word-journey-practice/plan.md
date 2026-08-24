# Implementation Plan: Word Journey Practice Frontend (v3)

> **Feature ID**: 002  
> **Target**: `EngComic_angular` (Angular 21 + Signals + Zoneless + Dark Glassmorphism)

---

## 1. Kiến Trúc Phân Tầng

```
src/app/features/vocab/
├── dashboard/                         # Quản lý kho từ, stats pill, điều hướng
├── practice/
│   ├── practice-session.component.ts/.html/.scss   # [SMART] Workspace điều phối queue, progress, modals
│   └── components/                                # [DUMB] Reusable components
│       ├── level-indicator/                       # 4-dot Stepper with pulse ring
│       ├── level1-recognition-exercise/           # Level 1: MCQ with audio & colored feedback
│       ├── level2-context-exercise/               # Level 2: Fill-in with collocation hint
│       ├── level3-production-exercise/            # Level 3: Word ordering tiles
│       ├── level4-realworld-exercise/             # Level 4: Situational challenge & 1-5 star rating
│       ├── practice-prompt-modal/                 # 1-Click Copy AI Prompt
│       └── practice-import-modal/                 # JSON Input, validate, loading & toast
└── leech-center/                                  # Trung tâm cứu hộ từ vựng khó nhớ
    └── leech-center.component.ts/.html/.scss
```

---

## 2. Các Mốc Triển Khai (Milestones)

1. **Milestone 1: Models & API Client**:
   - Khai báo các interfaces trong `@models/index.ts`.
   - Bổ sung các methods trong `CardApiService`.
2. **Milestone 2: Dumb Exercise Components (4 Levels)**:
   - Xây dựng 4 components chuyên biệt cho từng Level bài tập với hiệu ứng tương tác cao.
   - Xây dựng thanh `LevelIndicator` với vòng tròn phát sáng.
3. **Milestone 3: AI Bridge Modals**:
   - `PracticePromptModal`: 1-Click Copy System Prompt cho ChatGPT/Claude.
   - `PracticeImportModal`: Dán JSON, gọi API import kèm loading & toast.
4. **Milestone 4: Smart Practice Workspace**:
   - Kết nối hàng đợi `getPracticeQueue()`.
   - Chuyển đổi linh hoạt giữa 4 dạng bài tập theo `masteryLevel`.
   - Nộp câu trả lời, hiển thị toast thăng cấp Level.
5. **Milestone 5: Leech Center (`/vocab/leech`)**:
   - Quản lý từ vựng bị kẹt.
   - Hộp thoại nhập mẹo ghi nhớ để giải cứu từ vựng.
