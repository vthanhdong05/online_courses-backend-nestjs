# 🎓 Online Courses Platform Backend (NestJS + MongoDB)

> A production-grade, enterprise-ready RESTful API backend for an online learning platform. Features VIP Subscriptions, Automated Progress Tracking, Auto-Graded Assignments, and Course Reviews. Built with **NestJS**, **MongoDB (Mongoose ODM)**, and **TypeScript**.

---

## 🚀 Key Features

### 1. 🔐 Authentication & Access Control (Auth & RBAC)
- **Sign Up / Sign In**: Secure password hashing with `bcrypt`, issuing pairs of **JWT Access Tokens** and **Refresh Tokens**.
- **Role-Based Access Control (RBAC)**: 4 main roles (`student`, `instructor`, `staff`, `admin`).
- **Global Auth Guard**: All endpoints are protected by default. Public routes use `@Public()` custom decorator; role-restricted endpoints use `@Roles(...)`.

### 2. 📚 Category, Course & Lesson Management
- **Course CRUD**: Supports pricing, VIP inclusion flag (`includedInVip`), pagination, filtering, and search.
- **Publishing Rules**: A course can only be published (`status = 'published'`) if it contains at least 1 valid lesson (`LessonCoursePublishValidator`).
- **Lessons & Assignments**: Video lesson support, interactive Multiple Choice (MCQ) & Fill-in-the-blank assignments with **automatic grading**.
- **Soft Delete**: Built-in soft deletion and restoration for data safety across models.

### 3. 💳 Single Course Purchases & Orders
- **Order Creation**: Direct individual course checkout.
- **Automated Enrollment**: Upon successful order payment (`status = 'paid'`), the system automatically creates an `Enrollment` record with `accessType = 'purchased'`.

### 4. 👑 VIP Subscriptions & Computed Permissions
- **Subscription Plans**: Flexible tier management (1 month, 6 months, 1 year, etc.).
- **Computed Permission Check**: Avoids bulky materialized enrollment creation for VIP purchases. Access rights are evaluated dynamically in real time via `AccessService`:
  $$\text{CanAccess} = \text{IsEnrolledPurchased} \lor (\text{Course.includedInVip} \land \text{HasActiveVipSubscription})$$

### 5. 📈 Lesson Progress Tracking & Automated Course Completion
- **Progress Tracking**: Monitors video watching (`videoCompleted`) and assignment pass results (`assignmentPassed`).
- **Lesson Completion Rule**: A lesson marked `isCompleted = true` if video completed $\land$ (No assignment $\lor$ Assignment passed).
- **Course Progress Formula**:
  $$\text{CourseProgress \%} = \text{Math.round}\left(\frac{\text{CompletedLessons}}{\text{TotalLessons}} \times 100\right)$$
- **Automated Enrollment Completion**: When course progress reaches `100%`, `EnrollmentsService.markCourseCompleted` automatically updates `Enrollment.status = 'completed'` and sets `completedAt`.

### 6. ⭐ Course Reviews & Feedback System
- **Access-Restricted Reviews**: Reviews are strictly restricted to students who currently possess course access (`AccessService.canAccessCourse === true`).
- **Unique Review Constraint**: Compound unique index `{ studentId: 1, courseId: 1 }` guarantees 1 review per student per course (submitting again updates existing review).
- **Staff Replies**: Allows Admin, Staff, or Instructors to reply to student feedback (`replyComment`, `repliedBy`, `repliedAt`).
- **Aggregate Rating Summary**: Calculates `averageRating` (rounded to 1 decimal place) and `totalReviews` dynamically.

---

## 🎯 Architecture Highlights & Key Design Decisions

1. **Materialized vs. Computed Permissions Trade-off**:
   - Chosen **Computed Permissions** for VIP subscriptions to prevent data sync issues when courses are added/removed from VIP tiers or when subscriptions expire. Shifts heavy write syncs to lightweight read checks (Write Heavy $\to$ Read Light).
2. **Automated Progress & Enrollment Lifecycle**:
   - VIP students do not generate materialized enrollment records initially. However, upon reaching 100% completion, an enrollment record (`accessType = 'vip'`, `status = 'completed'`) is automatically created/updated to preserve their certificate and completion history permanently.
3. **Resolving Module Circular Dependencies**:
   - Handled circular dependency chains between `LessonsModule`, `CoursesModule`, `LessonProgressModule`, and `AccessModule` using NestJS `forwardRef()` and `@Inject(forwardRef(...))`.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Framework** | NestJS (TypeScript) |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Passport.js, JWT (Access & Refresh Tokens), Bcrypt |
| **Validation** | class-validator, class-transformer |
| **API Documentation** | Swagger UI (`@nestjs/swagger`) |
| **Testing** | Jest, `@nestjs/testing` |
| **Code Formatting** | ESLint, Prettier |

---

## 📁 Directory Structure

```text
src/
├── apps/
│   ├── access/               # Dynamic course access computation service
│   ├── auth/                 # JWT Authentication, Refresh Tokens, Guards, Decorators
│   ├── categories/           # Course category management
│   ├── courses/              # Course CRUD & publishing validation rules
│   ├── enrollments/          # Course ownership & completion state management
│   ├── instructors/          # Instructor profile management
│   ├── lesson-progress/      # Video tracking, assignment progress & completion %
│   ├── lessons/              # Lesson management & automated assignment grading
│   ├── orders/               # Single course purchases & order workflows
│   ├── reviews/              # Student reviews, aggregate ratings & staff replies
│   ├── subscription-plans/   # VIP tier plan configuration
│   ├── subscriptions/        # Active VIP subscription tracking
│   ├── user-category-roles/  # Category-level RBAC role assignment
│   └── users/                # User management, pagination, import/export
├── common/
│   ├── catch-everything/     # Global exception filter for unified error responses
│   ├── database/             # Mongoose plugins (Soft Delete, Auto Populate)
│   ├── guards/               # Category Access Guard, Roles Guard
│   ├── interceptors/         # Format Response Interceptor, Logging Interceptor
│   ├── logger/               # Custom Logger Service
│   └── pipes/                # Parse ObjectId Pipe
├── app.module.ts             # Application Root Module
└── main.ts                   # Application Entrypoint & Bootstrap
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: `>= 18.x`
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration (`.env`)
Create a `.env` file in the project root:
```env
PORT=9999
MONGO_URI=mongodb://localhost:27017/nestjs-online-courses
JWT_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Running the Application
```bash
# Development Mode (Watch Mode)
npm run start:dev

# Production Build & Launch
npm run build
npm run start:prod
```

Once started:
- **REST API Base URL**: `http://localhost:9999/api`
- **Swagger Documentation**: `http://localhost:9999/api-docs`

---

## 🧪 Testing & Code Quality

```bash
# Run Unit Test Suites (13 Test Suites / 64 Tests)
npm test

# Linter Check & Auto Fix
npm run lint

# Production Build Check
npm run build
```

---

## 📖 Core API Endpoints Reference

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | Register a new user account | Public |
| `POST` | `/api/auth/sign-in` | Authenticate & obtain Token Pair | Public |
| `GET` | `/api/courses` | List published courses (Paginated, Search) | Public |
| `POST` | `/api/courses` | Create a new course | Admin / Instructor |
| `POST` | `/api/courses/:id/lessons` | Add a lesson to a course | Admin / Instructor |
| `POST` | `/api/courses/:id/lessons/:lessonId/assignment/submit` | Submit assignment & receive instant score | Student |
| `POST` | `/api/orders` | Purchase an individual course | Student |
| `GET` | `/api/subscription-plans` | List available VIP subscription plans | Public |
| `GET` | `/api/access/check/:courseId` | Verify real-time course access permission | Logged-in User |
| `POST` | `/api/courses/:id/lessons/:lessonId/progress/video` | Mark lesson video as completed | Student |
| `GET` | `/api/courses/:id/progress` | Get course progress summary (%) | Student |
| `POST` | `/api/courses/:id/reviews` | Write or update course review | Student (With Access) |
| `PATCH` | `/api/courses/:id/reviews/:reviewId/reply` | Reply to student review | Admin / Staff / Instructor |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
