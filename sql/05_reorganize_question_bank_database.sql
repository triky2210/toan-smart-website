-- ==============================================================================
-- TOÁN SMART - TỔ CHỨC LẠI CƠ SỞ DỮ LIỆU NGÂN HÀNG CÂU HỎI & DẠNG TOÁN CHUẨN SƯ PHẠM
-- File: sql/05_reorganize_question_bank_database.sql
-- Mô tả: Chuẩn hóa quan hệ giữa Khóa học NHCH (Course 1200) -> Học liệu Dạng toán (Materials)
--        -> Chuyên đề (Chuyen_de_id) -> Dạng bài (Topic_id) -> Câu hỏi (Questions)
-- ==============================================================================

-- 1. Bổ sung các cột phân loại vào bảng materials (Học liệu)
ALTER TABLE materials 
    ADD COLUMN IF NOT EXISTS topic_id INT,
    ADD COLUMN IF NOT EXISTS topic_code TEXT,
    ADD COLUMN IF NOT EXISTS chuyen_de_id INT;

-- 2. Bổ sung các cột phân loại vào bảng questions (Câu hỏi)
ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS topic_id INT,
    ADD COLUMN IF NOT EXISTS topic_code TEXT,
    ADD COLUMN IF NOT EXISTS chuyen_de_id INT,
    ADD COLUMN IF NOT EXISTS family_id INT,
    ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS variant_count INT DEFAULT 0;

-- 3. Cập nhật ánh xạ chuẩn cho 25 Học liệu Dạng toán của NHCH Toán 12 (Course 1200)

-- --- CHƯƠNG 1: ỨNG DỤNG ĐẠO HÀM ---
-- Bài 1: Tính đơn điệu & Cực trị (CĐ 1)
UPDATE materials SET chuyen_de_id = 1, topic_code = '1.1', topic_id = 101 WHERE id = 12111;
UPDATE materials SET chuyen_de_id = 1, topic_code = '1.3', topic_id = 103 WHERE id = 12112;
UPDATE materials SET chuyen_de_id = 1, topic_code = '1.5', topic_id = 105 WHERE id = 12113;
UPDATE materials SET chuyen_de_id = 1, topic_code = '1.6', topic_id = 106 WHERE id = 12114;
UPDATE materials SET chuyen_de_id = 1, topic_code = '1.8', topic_id = 108 WHERE id = 12115;

-- Bài 2: GTLN & GTNN (CĐ 2)
UPDATE materials SET chuyen_de_id = 2, topic_code = '2.1', topic_id = 201 WHERE id = 12121;
UPDATE materials SET chuyen_de_id = 2, topic_code = '2.2', topic_id = 202 WHERE id = 12122;
UPDATE materials SET chuyen_de_id = 2, topic_code = '2.3', topic_id = 203 WHERE id = 12123;
UPDATE materials SET chuyen_de_id = 2, topic_code = '2.5', topic_id = 205 WHERE id = 12124;

-- Bài 3: Tiệm cận (CĐ 3)
UPDATE materials SET chuyen_de_id = 3, topic_code = '3.1', topic_id = 301 WHERE id = 12131;
UPDATE materials SET chuyen_de_id = 3, topic_code = '3.2', topic_id = 302 WHERE id = 12132;
UPDATE materials SET chuyen_de_id = 3, topic_code = '3.4', topic_id = 304 WHERE id = 12133;
UPDATE materials SET chuyen_de_id = 3, topic_code = '3.5', topic_id = 305 WHERE id = 12134;

-- Bài 4: Khảo sát hàm số & Nhận dạng đồ thị (CĐ 4)
UPDATE materials SET chuyen_de_id = 4, topic_code = '4.1', topic_id = 401 WHERE id = 12141;
UPDATE materials SET chuyen_de_id = 4, topic_code = '4.6', topic_id = 406 WHERE id = 12142;
UPDATE materials SET chuyen_de_id = 4, topic_code = '4.4', topic_id = 404 WHERE id = 12143;

-- Bài 5: Ứng dụng thực tiễn đạo hàm (CĐ 5)
UPDATE materials SET chuyen_de_id = 5, topic_code = '5.1', topic_id = 501 WHERE id = 12151;
UPDATE materials SET chuyen_de_id = 5, topic_code = '5.2', topic_id = 502 WHERE id = 12152;
UPDATE materials SET chuyen_de_id = 5, topic_code = '5.3', topic_id = 503 WHERE id = 12153;

-- --- CHƯƠNG 6: XÁC SUẤT CÓ ĐIỀU KIỆN ---
-- Bài 16: Xác suất có điều kiện & Quy tắc nhân (CĐ 18)
UPDATE materials SET chuyen_de_id = 18, topic_code = '18.1', topic_id = 1801 WHERE id = 12611;
UPDATE materials SET chuyen_de_id = 18, topic_code = '18.2', topic_id = 1802 WHERE id = 12612;

-- Bài 17: Xác suất toàn phần & Bayes (CĐ 19)
UPDATE materials SET chuyen_de_id = 19, topic_code = '19.1', topic_id = 1901 WHERE id = 12621;
UPDATE materials SET chuyen_de_id = 19, topic_code = '19.2', topic_id = 1902 WHERE id = 12622;
UPDATE materials SET chuyen_de_id = 19, topic_code = '19.3', topic_id = 1903 WHERE id = 12623;
UPDATE materials SET chuyen_de_id = 19, topic_code = '19.4', topic_id = 1904 WHERE id = 12624;

-- 4. Đánh chỉ mục Index tối ưu tìm kiếm theo chuyên đề và dạng toán
CREATE INDEX IF NOT EXISTS idx_materials_chuyen_de ON materials(chuyen_de_id);
CREATE INDEX IF NOT EXISTS idx_materials_topic_id ON materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_chuyen_de ON questions(chuyen_de_id, topic_id);

-- 5. Cập nhật câu hỏi #28 vào đúng Dạng 19.4 (Xác suất hộp bóng)
UPDATE questions 
SET chuyen_de_id = 19, topic_id = 1904, topic_code = '19.4', difficulty = 'VD'
WHERE id = 28;

-- Thông báo hoàn thành
SELECT 'Database question bank reorganized successfully!' AS status;
