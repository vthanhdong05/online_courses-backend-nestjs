# 🎓 Online Courses Platform Backend (NestJS + MongoDB)

> Hệ thống Backend RESTful API hoàn chỉnh cho nền tảng khóa học trực tuyến tích hợp Đăng ký gói VIP, Theo dõi tiến độ học tập tự động và Đánh giá/Phản hồi bài học. Được xây dựng trên nền tảng **NestJS**, **MongoDB (Mongoose)** và **TypeScript**.

---

## 🚀 Tính năng chính (Key Features)

### 1. 🔐 Xác thực & Phân quyền (Auth & RBAC)
- **Đăng ký / Đăng nhập**: Mã hóa mật khẩu với `bcrypt`, cấp cặp Token **Access Token (JWT)** & **Refresh Token**.
- **Phân quyền người dùng**: 4 vai trò chính (`student`, `instructor`, `staff`, `admin`).
- **Global Auth Guard**: Tự động bảo vệ tất cả endpoint, sử dụng Custom Decorator `@Public()` cho các API công khai và `@Roles(...)` cho phân quyền vai trò.

### 2. 📚 Quản lý Danh mục, Khóa học & Bài học (Courses & Lessons)
- **CRUD Khóa học**: Thuộc tính giá (`price`), cờ tham gia gói VIP (`includedInVip`), phân trang & tìm kiếm.
- **Quy tắc Xuất bản (Publishing Rules)**: Khóa học chỉ được chuyển trạng thái `published` khi có ít nhất 1 bài học hợp lệ (`LessonCoursePublishValidator`).
- **Quản lý Bài học & Bài tập**: Tích hợp video bài học, bài tập trắc nghiệm (MCQ) & điền từ (Fill Blank) với tính năng **chấm điểm tự động**.
- **Soft Delete**: Hỗ trợ xóa mềm và khôi phục dữ liệu an toàn.

### 3. 💳 Hệ thống Đơn hàng Mua lẻ (Single Course Orders)
- **Tạo đơn hàng**: Mua lẻ khóa học trực tiếp.
- **Tự động cấp quyền (Enrollment)**: Khi đơn hàng thanh toán thành công (`status = 'paid'`), hệ thống tự động tạo bản ghi `Enrollment` với `accessType = 'purchased'`.

### 4. 👑 Gói Đăng ký VIP (Subscriptions & Computed Permissions)
- **Quản lý Gói VIP (Subscription Plans)**: Tạo gói theo thời hạn (1 tháng, 6 tháng, 1 năm,...).
- **Computed Permission Check (Tính toán quyền động)**: Không tạo hàng loạt `Enrollment` khi mua VIP để tránh phình dữ liệu. Quyền xem được tính toán thời gian thực thông qua `AccessService`:
  $$\text{CanAccess} = \text{IsEnrolledPurchased} \lor (\text{Course.includedInVip} \land \text{HasActiveVipSubscription})$$

### 5. 📈 Theo dõi Tiến độ Học tập & Tự động Hoàn thành Khóa học (Lesson Progress)
- **Ghi nhận tiến độ**: Theo dõi trạng thái xem video (`videoCompleted`) và kết quả bài tập (`assignmentPassed`).
- **Quy tắc Bài học hoàn thành**: Bài học đạt `isCompleted = true` khi đã xem xong video $\land$ (Không có bài tập $\lor$ Đã pass bài tập).
- **Công thức Tiến độ**:
  $$\text{CourseProgress \%} = \text{Math.round}\left(\frac{\text{CompletedLessons}}{\text{TotalLessons}} \times 100\right)$$
- **Tự động chuyển trạng thái Enrollment**: Khi tiến độ đạt `100%`, hệ thống tự động cập nhật bản ghi `Enrollment.status = 'completed'` và ghi nhận `completedAt`.

### 6. ⭐ Đánh giá & Phản hồi (Reviews & Feedback)
- **Ràng buộc Quyền đánh giá**: Chỉ Học viên **đã sở hữu hoặc có VIP active** mới được viết/cập nhật đánh giá (`AccessService.canAccessCourse === true`).
- **Đánh giá duy nhất**: Compound unique index `{ studentId: 1, courseId: 1 }` đảm bảo mỗi học viên chỉ có 1 bài đánh giá per course (hỗ trợ cập nhật lại).
- **Phản hồi từ Staff**: Cho phép Admin/Staff/Instructor phản hồi bài đánh giá (`replyComment`, `repliedBy`, `repliedAt`).
- **Thống kê Điểm sao**: Tự động tổng hợp `averageRating` (làm tròn 1 chữ số thập phân) và `totalReviews`.

---

## 🎯 Điểm nhấn Kiến trúc (Architecture Highlights for Interview)

1. **Trade-off giữa Materialized Permission & Computed Permission**:
   - Chọn **Computed Permission** cho gói VIP để giải quyết bài toán đồng bộ dữ liệu khi danh sách VIP course thay đổi hoặc khi gói VIP hết hạn. Giảm thiểu chi phí ghi (Write Heavy -> Read Light).
2. **Thiết kế Vòng đời Enrollment & Tiến độ tự động**:
   - Học viên học qua VIP không tạo Enrollment ban đầu. Nhưng khi hoàn thành 100% khóa học, hệ thống tự động tạo/cập nhật bản ghi Enrollment (`accessType = 'vip'`, `status = 'completed'`) để bảo lưu chứng chỉ vĩnh viễn.
3. **Giải quyết Phụ thuộc Vòng (Circular Dependency)**:
   - Áp dụng triệt để `forwardRef()` và `@Inject(forwardRef(...))` giữa các module `LessonsModule`, `CoursesModule`, `LessonProgressModule` và `AccessModule`.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
|---|---|
| **Framework** | NestJS (TypeScript) |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Passport.js, JWT (Access & Refresh Tokens), Bcrypt |
| **Validation** | class-validator, class-transformer |
| **API Documentation** | Swagger UI (`@nestjs/swagger`) |
| **Testing** | Jest, `@nestjs/testing` |
| **Code Quality** | ESLint, Prettier |

---

## 📁 Cấu trúc Thư mục (Project Structure)

```text
src/
├── apps/
│   ├── access/               # Quản lý tính toán quyền truy cập khóa học động
│   ├── auth/                 # Xác thực JWT, Refresh Token, Guards, Decorators
│   ├── categories/           # Quản lý danh mục khóa học
│   ├── courses/              # Quản lý khóa học, quy tắc publish
│   ├── enrollments/          # Quản lý sở hữu khóa học & trạng thái hoàn thành
│   ├── instructors/          # Quản lý thông tin giảng viên
│   ├── lesson-progress/      # Theo dõi tiến độ xem video, làm bài tập & % hoàn thành
│   ├── lessons/              # Bài học, bài tập trắc nghiệm & tự động chấm điểm
│   ├── orders/               # Đơn hàng mua lẻ khóa học
│   ├── reviews/              # Đánh giá, số sao trung bình & phản hồi từ Staff
│   ├── subscription-plans/   # Quản lý gói VIP Subscription
│   ├── subscriptions/        # Đăng ký gói VIP & lịch sử gia hạn
│   ├── user-category-roles/  # Phân quyền vai trò theo danh mục
│   └── users/                # Quản lý người dùng, phân trang, export/import
├── common/
│   ├── catch-everything/     # Global Exception Filter chuẩn hóa lỗi
│   ├── database/             # Plugins Mongoose (Soft Delete, Auto Populate)
│   ├── guards/               # Category Access Guard, Roles Guard
│   ├── interceptors/         # Format Response Interceptor, Logging Interceptor
│   ├── logger/               # Custom Logger Service
│   └── pipes/                # Parse ObjectId Pipe
├── app.module.ts             # Module gốc hệ thống
└── main.ts                   # Entrypoint Bootstrap NestJS App
```

---

## ⚙️ Hướng dẫn Cài đặt & Khởi chạy (Installation & Setup)

### 1. Yêu cầu hệ thống
- **Node.js**: `>= 18.x`
- **MongoDB**: Standalone / Replica Set local hoặc MongoDB Atlas

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu hình Biến môi trường (`.env`)
Tạo file `.env` tại thư mục gốc với các thông số:
```env
PORT=9999
MONGO_URI=mongodb://localhost:27017/nestjs-online-courses
JWT_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Khởi chạy Ứng dụng
```bash
# Chế độ Development (Watch mode)
npm run start:dev

# Chế độ Production Build
npm run build
npm run start:prod
```

Sau khi khởi chạy thành công:
- **REST API Endpoint**: `http://localhost:9999/api`
- **Swagger API Documentation**: `http://localhost:9999/api-docs`

---

## 🧪 Kiểm thử (Testing & Quality)

```bash
# Chạy toàn bộ Unit Tests (13 Test Suites / 64 Tests)
npm test

# Linter Check & Auto Fix
npm run lint

# Production Build Check
npm run build
```

---

## 📖 Bảng tra cứu API chính (Core API Endpoints Reference)

| Phương thức | Đường dẫn API | Mô tả | Vai trò |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | Đăng ký tài khoản | Public |
| `POST` | `/api/auth/sign-in` | Đăng nhập & Lấy cặp Token | Public |
| `GET` | `/api/courses` | Lấy danh sách khóa học (Phân trang, lọc) | Public |
| `POST` | `/api/courses` | Tạo khóa học mới | Admin / Instructor |
| `POST` | `/api/courses/:id/lessons` | Tạo bài học mới | Admin / Instructor |
| `POST` | `/api/courses/:id/lessons/:lessonId/assignment/submit` | Nộp bài tập & chấm điểm tự động | Student |
| `POST` | `/api/orders` | Mua lẻ khóa học | Student |
| `GET` | `/api/subscription-plans` | Lấy danh sách gói VIP | Public |
| `GET` | `/api/access/check/:courseId` | Kiểm tra quyền truy cập khóa học | Logged-in User |
| `POST` | `/api/courses/:id/lessons/:lessonId/progress/video` | Đánh dấu xem xong video bài học | Student |
| `GET` | `/api/courses/:id/progress` | Xem tổng quan % tiến độ học | Student |
| `POST` | `/api/courses/:id/reviews` | Viết / cập nhật đánh giá khóa học | Student (Have Access) |
| `PATCH` | `/api/courses/:id/reviews/:reviewId/reply` | Phản hồi bài đánh giá | Admin / Staff / Instructor |

---

## 📄 License
Project này được phát triển dưới giấy phép [MIT](LICENSE).
