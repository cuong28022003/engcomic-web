# Technical Implementation Plan: Feature 005 - Learning Stats & Prestige Gamification

> **Perspective**: Tech Lead / Software Engineer  
> **Purpose**: Answer the question **"HOW"**

---

## 1. Architecture & Design Decisions

### 1.1. Clean Architecture Compliance (Backend)
- **Controller Layer**:
  - `LearningStatsController.java` (`@RequestMapping("/api/learning-stats")`): Validate `@CurrentUserId`, định tuyến HTTP. CẤM viết logic hay query DB.
- **Boundary Layer**:
  - `GetLearningStats.java`: Lấy thông tin thống kê học tập, Cấp bậc, Streak, Danh hiệu đã trang bị.
  - `RecordLearningActivity.java`: Ghi nhận hoạt động học (từ vựng, TOEIC, điểm danh), tính Streak, thăng hạng tự động, thưởng Kim Cương.
- **Interactor Layer**:
  - `GetLearningStatsInteractor.java`
  - `RecordLearningActivityInteractor.java`
- **Database Layer**:
  - Entity: `UserLearningStatsEntity.java` (`@Document(collection = "user_learning_stats")`).
  - Repository: `UserLearningStatsRepository.java`.

---

## 2. Frontend Architecture (`EngComic_angular`)

1. **`UserStatsApiService`**:
   - `BASE = '/learning-stats'`.
   - `getMyStats()`, `recordActivity()`, `checkIn()`, `equipItem()`.
2. **`StreakModalComponent` (`src/app/shared/components/streak-modal/`)**:
   - Hiển thị ngọn lửa Hero, lịch tuần 7 ngày, mốc phần thưởng chuỗi.
3. **`RankComponent` (`src/app/features/account/rank/`)**:
   - Tab 1: 7 Cấp Bậc Danh Vọng (Tier roadmap).
   - Tab 2: Nhiệm vụ & Thành Tích (nhận thưởng XP & Kim Cương).
   - Tab 3: Mùa giải & Danh hiệu độc quyền (Prestige Showcase).
4. **Header Profile Display**:
   - Hiển thị Danh hiệu (`equippedTitle`) và Khung Avatar (`equippedAvatarFrame`) cạnh Username.
