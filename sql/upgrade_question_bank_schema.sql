-- ==============================================================================
-- SQL MIGRATION: NÂNG CẤP HỆ THỐNG NGÂN HÀNG CÂU HỎI & VÙNG ĐỆM STAGING (TOÁN SMART)
-- ==============================================================================
-- Hướng dẫn: Thầy mở Supabase Dashboard -> chọn mục "SQL Editor" ở cột trái 
--            -> nhấn "New Query" -> dán toàn bộ mã này vào và nhấn "Run".
-- ==============================================================================

-- 1. Bổ sung các cột mới cho bảng questions nếu chưa có
ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice',
    ADD COLUMN IF NOT EXISTS tikz_code TEXT,
    ADD COLUMN IF NOT EXISTS fallback_image_url TEXT,
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS source_metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_staging BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS skill_tag TEXT;

-- Đảm bảo cột options là JSONB
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'options' AND data_type = 'text'
    ) THEN
        ALTER TABLE questions ALTER COLUMN options TYPE JSONB USING options::jsonb;
    END IF;
END $$;

-- 2. Đánh chỉ mục (Index) để tối ưu hóa truy vấn lọc và tìm kiếm câu hỏi
CREATE INDEX IF NOT EXISTS idx_questions_course_lesson 
    ON questions(course_id, chapter_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_questions_type_diff 
    ON questions(question_type, difficulty);

CREATE INDEX IF NOT EXISTS idx_questions_staging 
    ON questions(is_staging);

CREATE INDEX IF NOT EXISTS idx_questions_source_type 
    ON questions(source_type);

-- 3. Tạo bảng staging_batches để quản lý các phiên nhập liệu đa nguồn
CREATE TABLE IF NOT EXISTS staging_batches (
    id SERIAL PRIMARY KEY,
    batch_name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('word', 'pdf', 'image', 'web', 'manual')),
    source_info TEXT,
    total_questions INT DEFAULT 0,
    valid_questions INT DEFAULT 0,
    warning_questions INT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready_for_review', 'committed', 'discarded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm batch_id vào questions để nhóm các câu hỏi theo phiên nhập
ALTER TABLE questions 
    ADD COLUMN IF NOT EXISTS batch_id INT REFERENCES staging_batches(id) ON DELETE SET NULL;

-- 4. Bật bảo mật RLS cho staging_batches
ALTER TABLE staging_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for staging_batches" 
    ON staging_batches FOR SELECT TO anon USING (true);

CREATE POLICY "Allow authenticated changes for staging_batches" 
    ON staging_batches FOR ALL TO authenticated USING (true);

-- 5. Hàm cập nhật updated_at tự động
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_questions ON questions;
CREATE TRIGGER set_timestamp_questions
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS set_timestamp_staging_batches ON staging_batches;
CREATE TRIGGER set_timestamp_staging_batches
BEFORE UPDATE ON staging_batches
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();
