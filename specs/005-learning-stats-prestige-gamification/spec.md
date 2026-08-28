# Feature Specification: Hệ Thống Cấp Bậc Danh Vọng, Chuỗi Học Tập Thực Tế & Phần Thưởng Danh Dự

> **Perspective**: Business / Product Owner  
> **Purpose**: Answer the question **"WHAT & WHY"**

---

## 1. Overview & Objective
- **Feature ID**: `005`
- **Feature Name**: `Learning Stats, Dual-Progression & Activity-Based Streak System` (Hệ Thống Cấp Bậc Học Tập Độc Lập, Chuỗi Streak Dựa Trên Hoạt Động Học Thực Tế & Phần Thưởng Danh Dự)
- **Priority**: `P1 (Critical Core Feature)`
- **Objective**: 
  - Tách biệt hoàn toàn dữ liệu học thuật (`user_learning_stats` trên `EngComic_angular`) khỏi dữ liệu đọc truyện (`user_stats` trên `EngComic_frontend`).
  - **Loại bỏ hoàn toàn điểm danh thụ động (No Passive Check-in)**: Người dùng bắt buộc phải hoàn thành các hoạt động học tập thực tế (Luyện từ vựng 4-Level, Ôn tập SRS, Làm đề thi TOEIC, Ngữ pháp) để duy trì và thăng tiến chuỗi ngày Streak.
  - Xây dựng hệ sinh thái phần thưởng xoay quanh **Prestige & Social Flex (Danh hiệu, Khung Avatar, Huy hiệu, Tủ trưng bày hồ sơ, Đại sảnh danh vọng)** trong khi toàn bộ nội dung học tập và đọc truyện vẫn là **100% MIỄN PHÍ**.

---

## 2. Permissions & Preconditions
- **Target Audience**: Mọi học viên đăng nhập hệ thống (`USER`), Quản trị viên (`ADMIN`).
- **Preconditions**:
  - Người dùng đã đăng ký/đăng nhập tài khoản.
  - Hệ thống tự động khởi tạo bản ghi `user_learning_stats` độc lập ngay trong lần đầu truy cập hoặc thực hiện hoạt động học tập đầu tiên.

---

## 3. User Stories & Acceptance Criteria

### User Story 1: Tích Lũy Điểm XP & Thăng Hạng 7 Bậc Danh Vọng Học Thuật (Priority: P1)
> As a **Học Viên**, I want to **tích lũy XP từ các bài học thực tế để thăng hạng 7 Cấp Bậc Danh Vọng** so that I can **khẳng định năng lực tiếng Anh, mở khóa đặc quyền học tập và nhận Kim Cương danh dự**.

**Hệ Thống 7 Bậc Danh Vọng Học Thuật**:
- **Tier 1 - ĐỒNG (Bronze)**: 0 - 500 XP (Mở kho từ vựng).
- **Tier 2 - BẠC (Silver)**: 500 - 1,500 XP (+10% XP bài tập, mở Level 2 Ngữ cảnh).
- **Tier 3 - VÀNG (Gold)**: 1,500 - 3,500 XP (Mở Level 3 Tái hiện, Khung Avatar Vàng, +50 💎).
- **Tier 4 - BẠCH KIM (Platinum)**: 3,500 - 7,000 XP (Mở Level 4 Thực tế, Giảm 20% hồi Streak, +100 💎).
- **Tier 5 - KIM CƯƠNG (Diamond)**: 7,000 - 12,000 XP (Mở toàn bộ đề TOEIC VIP, +200 💎).
- **Tier 6 - BẬC THẦY (Master)**: 12,000 - 20,000 XP (Nhân đôi XP bài tập, Khung Avatar Thần Thoại, +400 💎).
- **Tier 7 - HUYỀN THOẠI (Legend)**: Từ 20,000 XP trở lên (Đại Sảnh Danh Vọng Vĩnh Viễn, +1,000 💎).

---

### User Story 2: Chuỗi Ngày Học Tập Dựa Trên Hoạt Động Thực Tế (Activity-Based Streak) (Priority: P1)
> As a **Học Viên**, I want to **hoàn thành ít nhất 1 bài luyện tập từ vựng, ngữ pháp hoặc đề thi TOEIC mỗi ngày để giữ ngọn lửa Streak bốc cháy** so that I can **rèn luyện tính kỷ luật học tập thật sự và nhận Kim Cương ở các mốc tuần (7, 14, 30 ngày)**.

**Quy Tắc Hoạt Động Học Tập Để Giữ Streak**:
- **Điều kiện duy trì ngày hôm nay**: Học viên phải hoàn thành ít nhất 1 phiên luyện tập từ vựng 4-Level, ôn tập thẻ SRS, hoặc làm bài kiểm tra TOEIC.
- **Học ngày kế tiếp (`lastStudyDate == today - 1 day`)**: `currentStreak = currentStreak + 1`, cập nhật `longestStreak = max(longestStreak, currentStreak)`.
- **Đã hoàn thành trong ngày (`lastStudyDate == today`)**: Giữ nguyên `currentStreak`, tích lũy thêm XP.
- **Bỏ lỡ hơn 1 ngày (`lastStudyDate < today - 1 day`)**: `currentStreak` reset về 1 khi hoàn thành hoạt động học tập mới.
- **Phần thưởng mốc tuần**: Mốc 7 ngày (+20 💎), mốc 14 ngày (+50 💎), mốc 30 ngày (+100 💎).

---

### User Story 3: Hệ Thống Danh Hiệu & Phần Thưởng Danh Dự (Social Flex & Titles) (Priority: P1)
> As a **Học Viên**, I want to **mở khóa Danh Hiệu (Titles), Khung Avatar lấp lánh (Avatar Frames) và ghim Huy Hiệu vào Tủ Trưng Bày Cá Nhân** so that I can **thể hiện đẳng cấp và thành tích xuất sắc của mình trên Bảng Xếp Hạng, Hồ Sơ và Khung Bình Luận**.

---

## 4. Business Invariants
- [x] **Rule 1**: **CẤM** tạo nút hoặc endpoint điểm danh khống/thụ động; Streak chỉ tăng khi có hoạt động học tập phát sinh.
- [x] **Rule 2**: Dữ liệu `user_learning_stats` hoàn toàn độc lập, không làm biến đổi collection `user_stats` của bên đọc truyện tranh Comic.
- [x] **Rule 3**: Mọi tính năng học tập và đọc truyện tranh đều là **100% Miễn Phí**; phần thưởng kim cương và danh hiệu phục vụ mục đích vinh danh, sưu tầm và làm đẹp hồ sơ (Vanity & Prestige).
