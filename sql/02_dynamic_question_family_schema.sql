-- ==============================================================================
-- SQL MIGRATION: DYNAMIC QUESTION FAMILY & MATH TOPICS HIERARCHY
-- ==============================================================================
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> New Query -> dán và nhấn Run.
-- ==============================================================================

-- 1. Tạo bảng math_topics (Dạng bài toán chuẩn sư phạm theo từng bài học)
CREATE TABLE IF NOT EXISTS math_topics (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,                  -- Tên dạng bài (VD: 'Dạng 2: Tìm m để hàm số bậc 3 đơn điệu trên R')
    description TEXT,                          -- Mô tả phương pháp giải tổng quát
    topic_order INT DEFAULT 1,                 -- Thứ tự hiển thị trong bài học
    cognitive_level TEXT DEFAULT 'VD' CHECK (cognitive_level IN ('NB', 'TH', 'VD', 'VDC')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bổ sung các cột phục vụ Mô hình Question Family vào bảng questions
ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS topic_id INT REFERENCES math_topics(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS family_id INT,             -- Trỏ đến ID của Câu gốc Master trong nhóm
    ADD COLUMN IF NOT EXISTS is_master BOOLEAN DEFAULT TRUE, -- TRUE nếu là câu gốc đại diện, FALSE nếu là biến thể thay số
    ADD COLUMN IF NOT EXISTS variant_count INT DEFAULT 0, -- Số lượng câu biến thể thuộc về câu gốc này
    ADD COLUMN IF NOT EXISTS error_attempts INT DEFAULT 0; -- Đếm số lượt học sinh làm sai để phân tích lỗ hổng

-- Đánh chỉ mục Index tối ưu hóa truy vấn Question Family
CREATE INDEX IF NOT EXISTS idx_questions_family ON questions(family_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_master ON questions(is_master);

-- 3. Bật bảo mật RLS cho math_topics
ALTER TABLE math_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for math_topics" 
    ON math_topics FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated changes for math_topics" 
    ON math_topics FOR ALL TO authenticated USING (true);

-- 4. Chèn một số Dạng bài mẫu chuẩn mực cho Chương 1: Khảo sát hàm số (Bài 1: Sự đồng biến, nghịch biến)
INSERT INTO math_topics (id, lesson_id, topic_name, description, topic_order, cognitive_level) VALUES
(1, 2001, 'Dạng 1: Xét tính đơn điệu của hàm số cho bởi công thức tường minh', 'Tính đạo hàm y'', giải phương trình y'' = 0, lập bảng xét dấu để kết luận khoảng đơn điệu.', 1, 'NB'),
(2, 2001, 'Dạng 2: Đọc khoảng đơn điệu dựa vào đồ thị hoặc bảng biến thiên của hàm số y = f(x)', 'Nhìn hướng đi lên/đi xuống của đồ thị hoặc dấu + / - của đạo hàm trên BBT.', 2, 'TH'),
(3, 2001, 'Dạng 3: Đọc khoảng đơn điệu dựa vào đồ thị của đạo hàm y = f''(x)', 'Xác định các khoảng mà đồ thị f''(x) nằm phía trên/phía dưới trục hoành Ox.', 3, 'TH'),
(4, 2001, 'Dạng 4: Tìm tham số m để hàm số bậc ba đơn điệu trên khoảng xác định', 'Đưa về điều kiện y'' >= 0 hoặc y'' <= 0 với mọi x thuộc khoảng, sử dụng tam thức bậc hai hoặc cô lập tham số m.', 4, 'VD'),
(5, 2001, 'Dạng 5: Tính đơn điệu của hàm hợp y = f(u(x))', 'Áp dụng công thức đạo hàm hàm hợp y'' = u''(x) * f''(u(x)) và xét dấu tích hai thừa số.', 5, 'VDC')
ON CONFLICT (id) DO NOTHING;

SELECT setval('math_topics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM math_topics));
