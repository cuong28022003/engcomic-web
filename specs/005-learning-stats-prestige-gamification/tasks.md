# Task Breakdown: Feature 005 - Learning Stats & Prestige Gamification

> **Perspective**: Developer / QA  
> **Purpose**: Detailed step-by-step checklist of tasks to implement & verify.

---

## 📋 Task List

### Phase 1: Backend Architecture & Isolated Data Collection (`EngComic_backend`)
- [x] **Task 1.1**: Tạo Entity độc lập `UserLearningStatsEntity.java` trong collection `user_learning_stats`.
- [x] **Task 1.2**: Tạo Repository `UserLearningStatsRepository.java`.
- [x] **Task 1.3**: Tạo Boundary & Interactor `GetLearningStats` và `GetLearningStatsInteractor`.
- [x] **Task 1.4**: Tạo Boundary & Interactor `RecordLearningActivity` và `RecordLearningActivityInteractor` (xử lý logic Streak, tự động thăng hạng Rank theo XP, thưởng Kim Cương).
- [x] **Task 1.5**: Tạo `LearningStatsController.java` (`/api/learning-stats/**`) với `@PreAuthorize(AppAuthorities.IS_AUTHENTICATED)`.
- [x] **Task 1.6**: Tích hợp tự động gọi `RecordLearningActivity` trong `SubmitLevelAnswerInteractor.java` khi người dùng nộp câu trả lời bài tập 4-Level.
- [x] **Task 1.7**: Kiểm tra biên dịch backend: `mvn compile -DskipTests` đạt **BUILD SUCCESS (0 errors)**.

---

### Phase 2: Frontend Services & Streak System (`EngComic_angular`)
- [x] **Task 2.1**: Cập nhật `UserStats` model với đầy đủ các trường `currentStreak`, `longestStreak`, `lastStudyDate`, `studiedToday`, `rank`, `equippedTitle`.
- [x] **Task 2.2**: Cập nhật `UserStatsApiService.ts` hỗ trợ gọi các API `/learning-stats/me`, `/learning-stats/record-activity`, `/learning-stats/check-in`.
- [x] **Task 2.3**: Xây dựng `StreakModalComponent` (3 tệp `.ts`, `.html`, `.scss`) với giao diện Glassmorphism, hiển thị ngọn lửa Hero, lịch tuần 7 ngày, mốc phần thưởng chuỗi.
- [x] **Task 2.4**: Tinh chỉnh `HeaderComponent` (loại bỏ thanh search, làm nút ngọn lửa Streak tương tác click mở modal).

---

### Phase 3: Màn Hình Cấp Bậc & Thành Tích Danh Dự (`RankComponent`)
- [x] **Task 3.1**: Xây dựng `RankComponent` tách chuẩn 3 tệp độc lập (`rank.component.ts`, `rank.component.html`, `rank.component.scss`).
- [x] **Task 3.2**: Thiết kế Hero Tier Card với huy hiệu 3D phát sáng, thông tin XP, Kim Cương, Streak và thanh tiến trình thăng hạng.
- [x] **Task 3.3**: Thiết kế Tab 1 (7 Cấp Bậc Danh Vọng từ Đồng ➔ Huyền Thoại kèm đặc quyền và thưởng Kim Cương).
- [x] **Task 3.4**: Thiết kế Tab 2 (Nhiệm vụ & Kho Thành tích động, nút nhận quà hiệu ứng phát sáng `pulseClaim`).
- [x] **Task 3.5**: Thiết kế Tab 3 (Đặc quyền Mùa giải, phần thưởng Top server & đường dẫn Bảng xếp hạng).
- [x] **Task 3.6**: Bổ sung liên kết "Cấp bậc & Thành tích" vào menu Sidebar của `AccountComponent`.
- [x] **Task 3.7**: Kiểm tra biên dịch frontend: `npx ng build --configuration=development` đạt **BUILD SUCCESS (0 errors)**.

---

### Phase 4: Verification & Prestige Enhancements
- [x] **Task 4.1**: Xác minh tính tách biệt dữ liệu: Hoạt động học tập bên Angular không làm ảnh hưởng đến collection `user_stats` của bên đọc truyện tranh React.
- [x] **Task 4.2**: Xác minh toàn bộ hệ thống hoạt động 100% Miễn Phí với trọng tâm là Danh Hiệu, Khung Avatar, và Vinh danh Bảng Xếp Hạng.
