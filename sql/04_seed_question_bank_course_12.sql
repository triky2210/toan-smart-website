-- ==============================================================================
-- SQL SEED: KHÓA HỌC NGÂN HÀNG CÂU HỎI TOÁN 12 (NHCH TOÁN 12 - SGK KNTT)
-- Cấu trúc: Khóa học (1200) -> Chương (1 & 6) -> Bài (SGK) -> Dạng toán (Quiz)
-- ==============================================================================

-- 1. Bổ sung cột course_type vào bảng courses nếu chưa có
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'standard';

-- Cập nhật các khóa học thông thường
UPDATE courses SET course_type = 'standard' WHERE id IN (1, 2, 3);

-- 2. Thêm Khóa học 'NHCH Toán 12'
INSERT INTO courses (id, title, tag, course_type, price, duration, image_url, description)
VALUES (
    1200, 
    'NHCH Toán 12 (Chuẩn SGK KNTT & Bộ GD 2025)', 
    'nhch12', 
    'question_bank', 
    0, 
    'Kho câu hỏi & Dạng bài', 
    'assets/images/course-thpt.png',
    'Hệ thống Ngân hàng câu hỏi Toán 12 theo khung chuẩn SGK Kết nối tri thức và cấu trúc đề thi Bộ GD 2025. Phân loại theo Chương -> Bài -> Dạng toán -> Question Family.'
)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    course_type = 'question_bank',
    description = EXCLUDED.description;

-- 3. Thêm Chương 1 & Chương 6
INSERT INTO chapters (id, course_id, title, order_index)
VALUES 
    (1201, 1200, 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số', 1),
    (1206, 1200, 'Chương 6: Xác suất có điều kiện', 6)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    order_index = EXCLUDED.order_index;

-- 4. Thêm Bài học (Theo SGK KNTT, bỏ bài ôn tập chương)
INSERT INTO lessons (id, chapter_id, title, order_index)
VALUES 
    -- Chương 1 (5 bài)
    (1211, 1201, 'Bài 1: Tính đơn điệu và cực trị của hàm số', 1),
    (1212, 1201, 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số', 2),
    (1213, 1201, 'Bài 3: Đường tiệm cận của đồ thị hàm số', 3),
    (1214, 1201, 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số', 4),
    (1215, 1201, 'Bài 5: Ứng dụng đạo hàm để giải quyết một số vấn đề thực tiễn', 5),

    -- Chương 6 (2 bài)
    (1261, 1206, 'Bài 16: Xác suất có điều kiện và quy tắc nhân xác suất', 1),
    (1262, 1206, 'Bài 17: Công thức xác suất toàn phần và công thức Bayes', 2)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    order_index = EXCLUDED.order_index;

-- 5. Thêm Học liệu Quiz đại diện cho các Dạng toán
INSERT INTO materials (id, lesson_id, title, type, order_index)
VALUES 
    -- Bài 1
    (12111, 1211, 'Dạng 1.1: Đọc khoảng đơn điệu từ BBT hoặc đồ thị', 'quiz', 1),
    (12112, 1211, 'Dạng 1.2: Đọc điểm cực trị, giá trị cực trị từ BBT hoặc đồ thị', 'quiz', 2),
    (12113, 1211, 'Dạng 1.3: Xét tính đơn điệu khi biết công thức hàm số', 'quiz', 3),
    (12114, 1211, 'Dạng 1.4: Tìm cực trị khi biết công thức hàm số', 'quiz', 4),
    (12115, 1211, 'Dạng 1.5: Tham số m liên quan đến đơn điệu và cực trị', 'quiz', 5),

    -- Bài 2
    (12121, 1212, 'Dạng 2.1: Đọc GTLN, GTNN từ BBT hoặc đồ thị', 'quiz', 1),
    (12122, 1212, 'Dạng 2.2: Tìm GTLN, GTNN trên đoạn [a; b]', 'quiz', 2),
    (12123, 1212, 'Dạng 2.3: Tìm GTLN, GTNN trên khoảng và bài toán thực tế', 'quiz', 3),
    (12124, 1212, 'Dạng 2.4: Tham số m liên quan đến min, max', 'quiz', 4),

    -- Bài 3
    (12131, 1213, 'Dạng 3.1: Đọc tiệm cận từ BBT và đồ thị', 'quiz', 1),
    (12132, 1213, 'Dạng 3.2: Tìm tiệm cận đứng, tiệm cận ngang từ công thức', 'quiz', 2),
    (12133, 1213, 'Dạng 3.3: Tìm tiệm cận xiên của hàm phân thức', 'quiz', 3),
    (12134, 1213, 'Dạng 3.4: Đếm số đường tiệm cận và tham số m', 'quiz', 4),

    -- Bài 4
    (12141, 1214, 'Dạng 4.1: Nhận dạng đồ thị hàm bậc 3 và phân thức', 'quiz', 1),
    (12142, 1214, 'Dạng 4.2: Biện luận số nghiệm phương trình bằng đồ thị', 'quiz', 2),
    (12143, 1214, 'Dạng 4.3: Xác định dấu của các hệ số từ đồ thị', 'quiz', 3),

    -- Bài 5
    (12151, 1215, 'Dạng 5.1: Bài toán tối ưu kinh tế (chi phí, lợi nhuận, doanh thu)', 'quiz', 1),
    (12152, 1215, 'Dạng 5.2: Bài toán tối ưu hình học (thể tích, diện tích)', 'quiz', 2),
    (12153, 1215, 'Dạng 5.3: Bài toán chuyển động và tốc độ biến thiên', 'quiz', 3),

    -- Bài 16
    (12611, 1261, 'Dạng 18.1: Định nghĩa và tính xác suất có điều kiện P(A|B)', 'quiz', 1),
    (12612, 1261, 'Dạng 18.2: Quy tắc nhân xác suất P(AB) = P(A)*P(B|A)', 'quiz', 2),

    -- Bài 17
    (12621, 1262, 'Dạng 19.1: Tính xác suất bằng công thức xác suất toàn phần', 'quiz', 1),
    (12622, 1262, 'Dạng 19.2: Tính xác suất bằng công thức Bayes', 'quiz', 2),
    (12623, 1262, 'Dạng 19.3: Bài toán thực tế xét nghiệm y tế, sản xuất công nghiệp', 'quiz', 3),
    (12624, 1262, 'Dạng 19.4: Bài toán chuyển bóng/vật thể giữa 2 hộp rồi lấy ngẫu nhiên', 'quiz', 4)
ON CONFLICT (id) DO UPDATE SET 
    title = EXCLUDED.title,
    order_index = EXCLUDED.order_index;

-- 6. Gán Câu hỏi #28 vào Học liệu Dạng 19.4 (id 12624)
INSERT INTO material_questions (material_id, question_id, order_index)
VALUES (12624, 28, 1)
ON CONFLICT DO NOTHING;
