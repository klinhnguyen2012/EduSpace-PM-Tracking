# Kết nối Supabase lần đầu

> Hướng dẫn này dùng Supabase Cloud và email/mật khẩu. Bạn chưa cần Supabase CLI hay SQL trong Phase 1.

## 1. Tạo project Supabase

1. Mở [Supabase Dashboard](https://supabase.com/dashboard) và đăng nhập hoặc tạo tài khoản Supabase.
2. Chọn **New project**. Nếu được hỏi tổ chức, chọn organization của bạn hoặc tạo organization mới.
3. Đặt tên, ví dụ `eduspace-pm-dashboard`.
4. Tạo database password và lưu ở password manager. Mật khẩu này không đưa vào app và không gửi cho mình.
5. Chọn region gần nhóm của bạn nhất trong danh sách rồi bấm tạo project. Chờ trạng thái project sẵn sàng.

> Supabase CLI và extension VS Code không bắt buộc để đăng nhập app trong phase này. Extension có thể hỗ trợ thao tác với project sau này, nhưng app kết nối bằng thông tin project ở Dashboard.

## 2. Lấy hai giá trị để app kết nối

1. Mở project vừa tạo.
2. Chọn **Connect** để xem thông tin kết nối, hoặc vào **Project Settings → API Keys** trong Supabase Dashboard.
3. Sao chép **Project URL**.
4. Trong mục **Publishable and secret API keys**, sao chép **Publishable key** (bắt đầu bằng `sb_publishable_`). Với project cũ chỉ có khóa `anon`, có thể dùng `anon` thay thế.

Các giá trị này là cấu hình client. **Không dùng `service_role` hoặc secret key trong frontend, không dán chúng vào chat, và không commit file `.env.local`.**

## 3. Thêm cấu hình vào máy của bạn

1. Mở thư mục dự án `eduspace` trong VS Code.
2. Ở thư mục gốc, tạo file mới tên `.env.local` (cùng cấp với `package.json`). Dấu chấm ở đầu tên là cần thiết.
3. Dán nội dung sau và thay phần bên phải bằng giá trị lấy ở bước trước:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Nếu project chỉ cung cấp khóa `anon`, dùng hai dòng này thay cho dòng key ở trên:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Không thêm dấu nháy quanh giá trị. File `.env.local` đã được loại khỏi Git.

## 4. Tạo tài khoản đăng nhập thử

1. Trong Supabase Dashboard, mở **Authentication → Users**.
2. Dùng **Add user** để tạo người dùng thử bằng email của bạn và một mật khẩu mới, hoặc để chế độ đăng ký bật rồi dùng **Đăng ký** trên app.
3. Nếu project yêu cầu xác nhận email, mở email và bấm liên kết xác nhận trước khi đăng nhập.

## 5. Chạy và đăng nhập

Trong terminal VS Code, tại thư mục `eduspace`, chạy:

```bash
npm install
npm run dev
```

Mở địa chỉ localhost được in ra trong terminal. Nếu Next.js đang chạy trước khi tạo hoặc sửa `.env.local`, dừng server bằng `Ctrl+C` rồi chạy lại `npm run dev`. Các biến `NEXT_PUBLIC_` được đưa vào bundle trình duyệt ở thời điểm build, nên cần cấu hình đúng trước khi deploy.

Khi cấu hình đúng, khung đăng nhập sẽ hiện ra. Sau khi đăng nhập thành công, bạn sẽ thấy trạng thái workspace đã đăng nhập và có thể đăng xuất. Nếu vẫn thấy **Chưa kết nối Supabase**, kiểm tra tên file, tên biến, URL và key rồi khởi động lại Next.js.

## Thứ tự thao tác của mình và của bạn

- Mình tạo app, `.env.example`, Auth client và checklist này trước.
- Khi app sẵn sàng chạy, bạn tạo project Supabase theo các bước 1–2 và tự điền hai giá trị vào `.env.local` theo bước 3.
- Bạn không cần gửi credentials cho mình. Nếu có lỗi, gửi nội dung thông báo lỗi đã loại bỏ URL/key/token; mình sẽ hướng dẫn xử lý.
