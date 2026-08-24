# Task Checklist: Word Journey Practice Frontend (v3)

> **Feature ID**: 002  
> **Trạng thái**: Hoàn thành & Đã kiểm thử

---

- [x] **Task 1: Models & API Client Service**
  - [x] Thêm các interfaces `CardExercisePackage`, `PracticeQueueItem`, `PracticePromptResponse`, `SubmitLevelAnswerRequest`, `SubmitLevelAnswerResponse` vào `src/app/shared/models/index.ts`.
  - [x] Thêm các methods `getPracticePrompt`, `importPracticeJson`, `getPracticeQueue`, `submitLevelAnswer`, `getLeechCards`, `clearLeechStatus` vào `CardApiService`.

- [x] **Task 2: Hệ Thống Dumb Components Bài Tập 4 Level**
  - [x] Xây dựng `LevelIndicatorComponent` với 4 nốt tròn và hiệu ứng Pulse Ring.
  - [x] Xây dựng `Level1RecognitionExerciseComponent` (Trắc nghiệm 4 đáp án & âm thanh).
  - [x] Xây dựng `Level2ContextExerciseComponent` (Điền từ vào câu & gợi ý Collocation).
  - [x] Xây dựng `Level3ProductionExerciseComponent` (Mảnh từ ghép câu hội thoại).
  - [x] Xây dựng `Level4RealworldExerciseComponent` (Xử lý tình huống & đánh giá tự tin 1-5 sao).

- [x] **Task 3: Hai Modal AI Bridge**
  - [x] Xây dựng `PracticePromptModalComponent` (1-Click Copy System Prompt).
  - [x] Xây dựng `PracticeImportModalComponent` (Dán JSON, Loading & Toast).

- [x] **Task 4: Phòng Luyện Tập Word Journey (Smart Container)**
  - [x] Tái cấu trúc `PracticeSessionComponent` kết nối `getPracticeQueue` và `submitLevelAnswer`.
  - [x] Điều phối chuyển đổi bài tập mượt mà theo `masteryLevel` (1 ➔ 4).
  - [x] Màn hình tổng kết phiên luyện tập (Summary Stats).

- [x] **Task 5: Trung Tâm Cứu Hộ Leech Center & Routing**
  - [x] Xây dựng `LeechCenterComponent` (`/vocab/leech`).
  - [x] Đăng ký route trong `vocab.routes.ts` và `route.ts`.
  - [x] Gắn liên kết nhanh từ `VocabDashboardComponent`.

- [x] **Task 6: Kiểm Tra Biên Dịch & Chuẩn Hóa**
  - [x] Chạy `npx ng build --configuration=development` ➔ **0 errors**.
