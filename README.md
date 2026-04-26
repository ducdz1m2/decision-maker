# Decision Maker - Hỗ trợ Ra Quyết Định

Ứng dụng hỗ trợ ra quyết định dựa trên thuật toán AHP (Analytic Hierarchy Process), giúp bạn phân tích và so sánh các lựa chọn một cách khoa học.

## Tính năng

### 🔐 Authentication
- **Đăng ký tài khoản**: Tạo tài khoản với username và password
- **Đăng nhập**: Đăng nhập với username/password
- **Đăng xuất**: Xóa session và logout

### 🎯 Tạo Quyết Định
- **Bước 1 - Chọn yếu tố**: Chọn từ 50 yếu tố có sẵn (tài chính, thời gian, stress, rủi ro, v.v.) với độ quan trọng 0-100%
- **Bước 2 - Nhập lựa chọn**: Thêm các lựa chọn cần so sánh (tối thiểu 2)
- **Bước 3 - So sánh yếu tố**: Sử dụng núm xoay (knob) để so sánh cặp yếu tố theo thang AHP (1-9)
- **Bước 4 - Xem kết quả**: Xem bảng xếp hạng các lựa chọn dựa trên thuật toán AHP

### 📊 Dashboard
- Xem danh sách các quyết định đã tạo
- Xem nhanh tiêu đề và ngày tạo
- Xóa quyết định
- Điều hướng đến trang chi tiết

### 📜 Lịch Sử
- Xem tất cả quyết định với phân trang
- Tìm kiếm theo tiêu đề, mô tả
- Chi tiết từng quyết định

### 📈 Chi Tiết Quyết Định
- Xem đầy đủ thông tin quyết định
- Các yếu tố đã chọn với độ quan trọng
- Kết quả phân tích với điểm số và xếp hạng
- Các lựa chọn đã nhập

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication (username/password) với localStorage
- **Algorithm**: AHP (Analytic Hierarchy Process)
- **Alerts**: SweetAlert2
- **Icons**: Emojis

## Cài đặt

1. Clone repository:
```bash
cd decision-maker
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env.local` và thêm các biến môi trường:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

4. Setup database:
- Chạy migration `supabase/migrations/001_initial_schema.sql` trong Supabase dashboard
- Chạy seed `supabase/migrations/002_seed_factors.sql` để thêm 50 yếu tố

5. Chạy development server:
```bash
npm run dev
```

6. Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Factors Table
```sql
CREATE TABLE factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Decisions Table
```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Decision Factors Table
```sql
CREATE TABLE decision_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  factor_id UUID NOT NULL REFERENCES factors(id),
  importance_weight DECIMAL(5,2) NOT NULL CHECK (importance_weight >= 0 AND importance_weight <= 100),
  UNIQUE(decision_id, factor_id)
);
```

### Decision Options Table
```sql
CREATE TABLE decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Option Scores Table
```sql
CREATE TABLE option_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES decision_options(id),
  factor_id UUID NOT NULL REFERENCES factors(id),
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0),
  UNIQUE(option_id, factor_id)
);
```

### Decision Results Table
```sql
CREATE TABLE decision_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id),
  option_id UUID NOT NULL REFERENCES decision_options(id),
  final_score DECIMAL(10,4) NOT NULL,
  rank INTEGER NOT NULL,
  UNIQUE(decision_id, option_id)
);
```

## Thuật toán AHP

Ứng dụng sử dụng thuật toán AHP (Analytic Hierarchy Process) để phân tích quyết định đa tiêu chí:

1. **Chọn yếu tố**: Người dùng chọn các yếu tố quan trọng và gán độ quan trọng (0-100%)
2. **So sánh cặp**: So sánh từng cặp yếu tố bằng núm xoay (thang 1-9)
3. **Tính ma trận**: Xây dựng ma trận so sánh từ các giá trị người dùng nhập
4. **Tính trọng số**: Tính vector trọng số riêng (eigenvector)
5. **Kiểm tra nhất quán**: Tính Consistency Ratio (CR) - nếu CR > 0.1, yêu cầu nhập lại
6. **Xếp hạng**: Tính điểm cuối cùng cho từng lựa chọn và xếp hạng

## Deploy

Ứng dụng có thể deploy lên [Vercel](https://vercel.com/).

## License

MIT
