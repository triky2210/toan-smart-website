-- SQL SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU TOÁN SMART TRÊN SUPABASE
-- Hướng dẫn: Thầy mở Supabase Dashboard -> chọn mục "SQL Editor" ở cột trái -> nhấn "New Query" -> dán toàn bộ mã này vào và nhấn "Run".

-- 1. Tạo bảng courses (Khóa học)
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT NOT NULL,
    price INT NOT NULL,
    description TEXT,
    duration TEXT,
    image_url TEXT,
    target_audience TEXT[] -- Mảng văn bản chứa các đối tượng học sinh
);

-- 2. Tạo bảng chapters (Chương học)
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INT DEFAULT 1
);

-- 3. Tạo bảng lessons (Bài học chi tiết)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('video', 'pdf')) DEFAULT 'video',
    url TEXT,
    duration TEXT,
    is_preview BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 1
);

-- 4. BẬT QUYỀN ĐỌC CÔNG KHAI (Row Level Security - RLS)
-- Cho phép bất kỳ ai (học sinh) cũng có thể đọc danh sách khóa học và bài giảng mà không cần đăng nhập.
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for courses" ON courses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access for chapters" ON chapters FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access for lessons" ON lessons FOR SELECT TO anon USING (true);

-- Cho phép quyền chỉnh sửa (Insert, Update, Delete) cho người dùng đã đăng nhập (Thầy Tùng Dương)
CREATE POLICY "Allow authenticated changes for courses" ON courses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated changes for chapters" ON chapters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated changes for lessons" ON lessons FOR ALL TO authenticated USING (true);


-- 5. CHÈN DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- Thêm 3 khóa học mẫu
INSERT INTO courses (id, title, tag, price, description, duration, image_url, target_audience) VALUES
(1, 'Luyện Thi Vào Lớp 10 Toán Mục Tiêu 9+', 'grade10', 1500000, 'Bứt phá điểm số hình học học kỳ 2, đại số chuyên đề, luyện giải đề thi thử tuyển sinh chính thức bám sát cấu trúc sở GD&ĐT các năm gần đây. Rèn luyện tư duy tự học giúp học sinh vững vàng đỗ trường THPT mong muốn.', '6 tháng (72 buổi)', 'assets/images/course-10.png', ARRAY['Học sinh lớp 9 chuẩn bị thi vào lớp 10.', 'Học sinh bị hổng kiến thức hình học phẳng.', 'Học sinh muốn đạt điểm 8.5 - 9.5 môn Toán.', 'Học sinh ôn thi các lớp chuyên Toán cấp ba.']),
(2, 'Luyện Thi Tốt Nghiệp THPT Chuyên Sâu', 'thpt', 2000000, 'Hệ thống toàn bộ kiến thức đại số, giải tích, hình học 12. Rèn luyện các kỹ năng phân tích nhanh trắc nghiệm, bấm máy tính Casio tối ưu 30 giây mỗi câu giúp học sinh bứt phá đạt điểm 9+ thi THPT Quốc Gia.', '8 tháng (96 buổi)', 'assets/images/course-thpt.png', ARRAY['Học sinh lớp 12 đang chuẩn bị cho kỳ thi Tốt nghiệp THPT.', 'Học sinh muốn tối ưu hóa thời gian làm bài trắc nghiệm Toán.', 'Học sinh muốn rèn luyện kỹ thuật Casio nâng cao.', 'Học sinh đặt mục tiêu đỗ các trường đại học top đầu (Bách Khoa, NEU...).']),
(3, 'Luyện Tư Duy Định Lượng HSA/APT (ĐGNL)', 'dgnl', 1800000, 'Phát triển sâu năng lực tư duy logic toán học, kỹ năng phân tích bảng biểu số liệu và giải quyết vấn đề thực tế bám sát cấu trúc phần thi định lượng của HSA (ĐHQGHN) và APT (ĐHQG TP.HCM).', '4 tháng (48 buổi)', 'assets/images/course-dgnl.png', ARRAY['Học sinh lớp 12 có mục tiêu xét tuyển đại học bằng điểm thi ĐGNL.', 'Học sinh muốn rèn luyện kỹ năng phân tích số liệu khoa học nhanh.', 'Học sinh muốn chinh phục mốc điểm cao phần tư duy định lượng.', 'Học sinh muốn phát triển tư duy suy luận logic toán học ứng dụng.']);

-- Thêm các chương học mẫu
INSERT INTO chapters (id, course_id, title, order_index) VALUES
(101, 1, 'Chương 1: Đại số chuyên sâu & Hệ thức Vi-ét ôn thi vào 10', 1),
(102, 1, 'Chương 2: Hình học phẳng & Tứ giác nội tiếp đường tròn', 2),
(103, 1, 'Chương 3: Luyện đề thi thử & Chiến thuật tối ưu điểm số', 3),
(201, 2, 'Chương 1: Khảo sát hàm số & Giải tích 12 chuyên sâu', 1),
(202, 2, 'Chương 2: Tuyệt kỹ Casio & Phương pháp giải nhanh trắc nghiệm 30s', 2),
(203, 2, 'Chương 3: Hình học không gian & Hình học tọa độ Oxyz', 3),
(301, 3, 'Chương 1: Logic toán học & Kỹ năng phân tích bảng số liệu thực tế', 1),
(302, 3, 'Chương 2: Tổng ôn toán học phổ thông bám sát cấu trúc đề HSA/APT', 2);

-- Thêm các bài học mẫu
INSERT INTO lessons (id, chapter_id, title, type, url, duration, is_preview, order_index) VALUES
(1001, 101, 'Bài 1: Phương trình bậc hai & Hệ thức Vi-ét cơ bản', 'video', 'https://www.youtube.com/embed/zH0QG_uPez8', '25:12', TRUE, 1),
(1002, 101, 'Bài 2: Phương pháp rút gọn biểu thức chứa căn thức bậc hai', 'pdf', 'assets/docs/de-thi-thu-toan-vao-10.pdf', '', TRUE, 2),
(1003, 101, 'Bài 3: Giải toán bằng cách lập phương trình, hệ phương trình', 'video', '', '', FALSE, 3),
(1004, 101, 'Bài 4: Các bài toán chứa tham số m liên quan đến cực trị Vi-ét', 'video', '', '', FALSE, 4),
(1005, 102, 'Bài 5: Định nghĩa & 4 phương pháp chứng minh Tứ giác nội tiếp', 'video', '', '', FALSE, 1),
(1006, 102, 'Bài 6: Các bài toán về tiếp tuyến đường tròn cực kỳ đặc sắc', 'video', '', '', FALSE, 2),
(1007, 102, 'Bài 7: Chứng minh ba điểm thẳng hàng, hai đường thẳng vuông góc', 'video', '', '', FALSE, 3),
(1008, 103, 'Bài 8: Giải đề thi thử bám sát cấu trúc sở GD&ĐT Hà Nội', 'video', '', '', FALSE, 1),
(1009, 103, 'Bài 9: Các lỗi sai ngớ ngẩn làm mất điểm Toán tự luận', 'video', '', '', FALSE, 2),
(2001, 201, 'Bài 1: Sự đồng biến, nghịch biến của hàm số chứa tham số m', 'video', 'https://www.youtube.com/embed/zH0QG_uPez8', '28:45', TRUE, 1),
(2002, 201, 'Bài 2: Phương pháp cực trị hàm số liên kết đồ thị f''(x)', 'pdf', 'assets/docs/so-tay-toan-12.pdf', '', TRUE, 2),
(2003, 201, 'Bài 3: Nhận diện đồ thị hàm số và các bài toán biện luận nghiệm', 'video', '', '', FALSE, 3),
(2004, 202, 'Bài 4: Kỹ thuật Casio giải nhanh tích phân chống sai số nâng cao', 'video', '', '', FALSE, 1),
(2005, 202, 'Bài 5: Tối ưu thời gian giải toán số phức bằng máy tính Casio', 'video', '', '', FALSE, 2),
(2006, 203, 'Bài 6: Phương pháp ghép trục tọa độ Oxyz giải nhanh cực trị hình học', 'video', '', '', FALSE, 1),
(2007, 203, 'Bài 7: Góc và khoảng cách trong không gian - Giải nhanh trắc nghiệm', 'video', '', '', FALSE, 2),
(3001, 301, 'Bài 1: Phương pháp đọc đề, phân tích bảng biểu thống kê phức tạp', 'video', 'https://www.youtube.com/embed/zH0QG_uPez8', '32:10', TRUE, 1),
(3002, 301, 'Bài 2: Các bài toán tư duy logic, suy luận toán học đặc sắc tuyển chọn', 'pdf', 'assets/docs/so-tay-toan-12.pdf', '', TRUE, 2),
(3003, 301, 'Bài 3: Kỹ thuật loại trừ phương án nhiễu trong phần thi Định lượng', 'video', '', '', FALSE, 3),
(3004, 302, 'Bài 4: Chuyên đề Số học & Đại số ôn thi ĐGNL Hà Nội', 'video', '', '', FALSE, 1),
(3005, 302, 'Bài 5: Chuyên đề Tổ hợp, Xác suất & Thống kê trong đề ĐGNL TP.HCM', 'video', '', '', FALSE, 2);

-- Reset lại chuỗi ID tự tăng sau khi chèn cứng ID mẫu để tránh lỗi khóa ngoại khi thầy thêm mới
SELECT setval('courses_id_seq', (SELECT MAX(id) FROM courses));
SELECT setval('chapters_id_seq', (SELECT MAX(id) FROM chapters));
SELECT setval('lessons_id_seq', (SELECT MAX(id) FROM lessons));

-- 6. TẠO BẢNG HỖ TRỢ CHỈNH SỬA TRANG CHỦ (HOMEPAGE CONFIG)
CREATE TABLE IF NOT EXISTS homepage_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Bật bảo mật RLS
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách truy cập công khai
CREATE POLICY "Allow public read access for homepage_settings" ON homepage_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated changes for homepage_settings" ON homepage_settings FOR ALL TO authenticated USING (true);

-- Chèn dữ liệu mẫu ban đầu cho trang chủ
INSERT INTO homepage_settings (key, value) VALUES ('content', $$
{
    "hero_title": "Bứt Phá Điểm Số<br><span>Toán Học</span> Kỳ Thi Lớn",
    "hero_desc": "Khóa học ôn thi Toán chuyên sâu vào lớp 10, thi tốt nghiệp THPT Quốc Gia và Đánh giá năng lực (HSA/APT). Giúp học sinh nắm vững bản chất, rèn luyện tư duy giải nhanh để tự tin đỗ nguyện vọng 1.",
    "hero_btn_primary_text": "Khám phá khóa học",
    "hero_btn_primary_link": "#courses",
    "hero_btn_secondary_text": "Đăng ký tư vấn miễn phí",
    "hero_btn_secondary_link": "#contact",
    "hero_image_url": "assets/images/teacher-avatar.jpg",
    "about_tag": "Người đồng hành",
    "about_title": "Thầy Tùng Dương",
    "about_intro": "Thầy Tùng Dương, cựu học sinh THPT chuyên Vĩnh Phúc, Tốt nghiệp ĐH Sư phạm Hà Nội ngành Toán Tiếng Anh, Thạc sĩ Toán học ĐH Sư phạm Hà Nội, nhiều năm kinh nghiệm ôn thi vào 10, ôn thi tốt nghiệp THPT, ĐGNL.",
    "about_quote": "\"Toán học không đơn thuần là những công thức khô khan, mà là nghệ thuật rèn luyện tư duy logic. Tại Toán Smart, thầy không chỉ truyền thụ kiến thức thi cử bám sát thực tế, mà còn giúp các em xây dựng nền tảng tư duy toán học rộng mở để tự tin vượt qua mọi dạng bài mới.\"",
    "about_image_url": "assets/images/teacher-avatar.jpg",
    "feature_1_title": "Tư duy mở rộng",
    "feature_1_desc": "Dạy phương pháp giải bản chất thay vì học vẹt công thức toán.",
    "feature_2_title": "Bám sát đề thi",
    "feature_2_desc": "Cập nhật liên tục xu hướng ra đề thi vào 10, tốt nghiệp THPT mới nhất.",
    "contact_title": "Nhận Tư Vấn Lộ Trình Học Chi Tiết",
    "contact_desc": "Hãy gửi lại thông tin để thầy tư vấn trực tiếp và gửi tặng bộ tài liệu ôn thi đắc lực nhất phù hợp với học lực hiện tại của em.",
    "contact_hotline": "0912.345.678 (Hỗ trợ 24/7)",
    "contact_email": "lienhe@toansmart.edu.vn",
    "footer_desc": "Nơi học Toán từ bản chất, nâng tầm tư duy logic và đồng hành cùng sự bứt phá học thuật của thế hệ trẻ Việt Nam.",
    "footer_fb_link": "#",
    "footer_yt_link": "#",
    "footer_tt_link": "#"
}
$$) ON CONFLICT (key) DO NOTHING;

