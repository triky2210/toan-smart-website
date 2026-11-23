/**
 * TOÁN SMART - QUESTION BANK DATA SEEDER (js/question-bank-seed.js)
 * Khởi tạo dữ liệu chuẩn cho 'NHCH Toán 12 (Chuẩn SGK KNTT & Bộ GD 2025)'
 * Tách biệt hoàn toàn Ngân hàng câu hỏi với các Khóa học giảng dạy thông thường.
 */

(function (global) {
    'use strict';

    // 1. Khóa học Ngân Hàng Câu Hỏi Toán 12
    const NHCH_COURSE_12 = {
        id: 1200,
        title: "NHCH Toán 12 (Chuẩn SGK KNTT & Bộ GD 2025)",
        tag: "nhch12",
        tag_label: "Ngân Hàng Câu Hỏi",
        course_type: "question_bank",
        price: 0,
        duration: "Kho câu hỏi & Dạng bài",
        image_url: "assets/images/course-thpt.png",
        description: "Hệ thống Ngân hàng câu hỏi Toán 12 theo khung chuẩn SGK Kết nối tri thức và cấu trúc đề thi Bộ GD 2025. Phân loại theo Chương -> Bài -> Dạng toán -> Question Family."
    };

    // 2. Chương chuẩn SGK KNTT (Giai đoạn 1: Chương 1 & Chương 6)
    const NHCH_CHAPTERS_12 = [
        {
            id: 1201,
            course_id: 1200,
            title: "Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số",
            order_index: 1
        },
        {
            id: 1206,
            course_id: 1200,
            title: "Chương 6: Xác suất có điều kiện",
            order_index: 6
        }
    ];

    // 3. Bài học chuẩn SGK KNTT (Đã loại bỏ bài ôn tập chương)
    const NHCH_LESSONS_12 = [
        // Chương 1 (5 bài)
        { id: 1211, chapter_id: 1201, title: "Bài 1: Tính đơn điệu và cực trị của hàm số", order_index: 1 },
        { id: 1212, chapter_id: 1201, title: "Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số", order_index: 2 },
        { id: 1213, chapter_id: 1201, title: "Bài 3: Đường tiệm cận của đồ thị hàm số", order_index: 3 },
        { id: 1214, chapter_id: 1201, title: "Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số", order_index: 4 },
        { id: 1215, chapter_id: 1201, title: "Bài 5: Ứng dụng đạo hàm để giải quyết một số vấn đề thực tiễn", order_index: 5 },

        // Chương 6 (2 bài)
        { id: 1261, chapter_id: 1206, title: "Bài 16: Xác suất có điều kiện và quy tắc nhân xác suất", order_index: 1 },
        { id: 1262, chapter_id: 1206, title: "Bài 17: Công thức xác suất toàn phần và công thức Bayes", order_index: 2 }
    ];

    // 4. Các Dạng toán chuẩn sư phạm (Mỗi dạng toán là 1 Học liệu Quiz)
    const NHCH_MATERIALS_12 = [
        // Bài 1: Đơn điệu & Cực trị
        { id: 12111, lesson_id: 1211, title: "Dạng 1.1: Đọc khoảng đơn điệu từ BBT hoặc đồ thị", type: "quiz", topic_code: "1.1", topic_id: 101, order_index: 1 },
        { id: 12112, lesson_id: 1211, title: "Dạng 1.2: Đọc điểm cực trị, giá trị cực trị từ BBT hoặc đồ thị", type: "quiz", topic_code: "1.3", topic_id: 103, order_index: 2 },
        { id: 12113, lesson_id: 1211, title: "Dạng 1.3: Xét tính đơn điệu khi biết công thức hàm số", type: "quiz", topic_code: "1.5", topic_id: 105, order_index: 3 },
        { id: 12114, lesson_id: 1211, title: "Dạng 1.4: Tìm cực trị khi biết công thức hàm số", type: "quiz", topic_code: "1.6", topic_id: 106, order_index: 4 },
        { id: 12115, lesson_id: 1211, title: "Dạng 1.5: Tham số m liên quan đến đơn điệu và cực trị", type: "quiz", topic_code: "1.8", topic_id: 108, order_index: 5 },

        // Bài 2: GTLN & GTNN
        { id: 12121, lesson_id: 1212, title: "Dạng 2.1: Đọc GTLN, GTNN từ BBT hoặc đồ thị", type: "quiz", topic_code: "2.1", topic_id: 201, order_index: 1 },
        { id: 12122, lesson_id: 1212, title: "Dạng 2.2: Tìm GTLN, GTNN trên đoạn [a; b]", type: "quiz", topic_code: "2.2", topic_id: 202, order_index: 2 },
        { id: 12123, lesson_id: 1212, title: "Dạng 2.3: Tìm GTLN, GTNN trên khoảng và bài toán thực tế", type: "quiz", topic_code: "2.3", topic_id: 203, order_index: 3 },
        { id: 12124, lesson_id: 1212, title: "Dạng 2.4: Tham số m liên quan đến min, max", type: "quiz", topic_code: "2.5", topic_id: 205, order_index: 4 },

        // Bài 3: Tiệm cận
        { id: 12131, lesson_id: 1213, title: "Dạng 3.1: Đọc tiệm cận từ BBT và đồ thị", type: "quiz", topic_code: "3.1", topic_id: 301, order_index: 1 },
        { id: 12132, lesson_id: 1213, title: "Dạng 3.2: Tìm tiệm cận đứng, tiệm cận ngang từ công thức", type: "quiz", topic_code: "3.2", topic_id: 302, order_index: 2 },
        { id: 12133, lesson_id: 1213, title: "Dạng 3.3: Tìm tiệm cận xiên của hàm phân thức", type: "quiz", topic_code: "3.4", topic_id: 304, order_index: 3 },
        { id: 12134, lesson_id: 1213, title: "Dạng 3.4: Đếm số đường tiệm cận và tham số m", type: "quiz", topic_code: "3.5", topic_id: 305, order_index: 4 },

        // Bài 4: Khảo sát & Đồ thị
        { id: 12141, lesson_id: 1214, title: "Dạng 4.1: Nhận dạng đồ thị hàm bậc 3 và phân thức", type: "quiz", topic_code: "4.1", topic_id: 401, order_index: 1 },
        { id: 12142, lesson_id: 1214, title: "Dạng 4.2: Biện luận số nghiệm phương trình bằng đồ thị", type: "quiz", topic_code: "4.6", topic_id: 406, order_index: 2 },
        { id: 12143, lesson_id: 1214, title: "Dạng 4.3: Xác định dấu của các hệ số từ đồ thị", type: "quiz", topic_code: "4.4", topic_id: 404, order_index: 3 },

        // Bài 5: Ứng dụng thực tiễn đạo hàm
        { id: 12151, lesson_id: 1215, title: "Dạng 5.1: Bài toán tối ưu kinh tế (chi phí, lợi nhuận, doanh thu)", type: "quiz", topic_code: "5.1", topic_id: 501, order_index: 1 },
        { id: 12152, lesson_id: 1215, title: "Dạng 5.2: Bài toán tối ưu hình học (thể tích, diện tích)", type: "quiz", topic_code: "5.2", topic_id: 502, order_index: 2 },
        { id: 12153, lesson_id: 1215, title: "Dạng 5.3: Bài toán chuyển động và tốc độ biến thiên", type: "quiz", topic_code: "5.3", topic_id: 503, order_index: 3 },

        // Bài 16: Xác suất có điều kiện & Quy tắc nhân
        { id: 12611, lesson_id: 1261, title: "Dạng 18.1: Định nghĩa và tính xác suất có điều kiện P(A|B)", type: "quiz", topic_code: "18.1", topic_id: 1801, order_index: 1 },
        { id: 12612, lesson_id: 1261, title: "Dạng 18.2: Quy tắc nhân xác suất P(AB) = P(A)*P(B|A)", type: "quiz", topic_code: "18.2", topic_id: 1802, order_index: 2 },

        // Bài 17: Xác suất toàn phần & Bayes
        { id: 12621, lesson_id: 1262, title: "Dạng 19.1: Tính xác suất bằng công thức xác suất toàn phần", type: "quiz", topic_code: "19.1", topic_id: 1901, order_index: 1 },
        { id: 12622, lesson_id: 1262, title: "Dạng 19.2: Tính xác suất bằng công thức Bayes", type: "quiz", topic_code: "19.2", topic_id: 1902, order_index: 2 },
        { id: 12623, lesson_id: 1262, title: "Dạng 19.3: Bài toán thực tế xét nghiệm y tế, sản xuất công nghiệp", type: "quiz", topic_code: "19.3", topic_id: 1903, order_index: 3 },
        { id: 12624, lesson_id: 1262, title: "Dạng 19.4: Bài toán chuyển bóng/vật thể giữa 2 hộp rồi lấy ngẫu nhiên", type: "quiz", topic_code: "19.4", topic_id: 1904, order_index: 4 }
    ];


    // 5. CÂU HỎI MẪU CHUẨN SƯ PHẠM LỚP 12 CHO CÁC DẠNG TOÁN
    const NHCH_QUESTIONS_12 = [
        // --- Dạng 1.1: Đọc khoảng đơn điệu từ BBT hoặc đồ thị (Học liệu 12111) ---
        {
            id: 1211101,
            material_id: 12111,
            lesson_id: 1211,
            topic_id: 101,
            topic_code: "1.1",
            chuyen_de_id: 1,
            question_type: "multiple_choice",
            difficulty: "NB",
            question_text: "Cho hàm số $y = f(x)$ xác định và liên tục trên $\\mathbb{R}$, có bảng biến thiên như sau:\n\n<div style=\"overflow-x:auto; margin: 12px 0;\">\n<table style=\"border-collapse: collapse; text-align: center; margin: auto; font-size: 0.95rem; border: 1px solid #CBD5E1;\">\n  <tr style=\"background: #F8FAFC; border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$x$</td>\n    <td style=\"padding: 8px 16px;\">$-\\infty$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$-1$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$2$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$+\\infty$</td>\n  </tr>\n  <tr style=\"border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$f'(x)$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px; color: #16A34A; font-weight: bold;\">+</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #DC2626; font-weight: bold;\">-</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #16A34A; font-weight: bold;\">+</td>\n    <td style=\"padding: 8px 16px;\"></td>\n  </tr>\n</table>\n</div>\n\nHàm số đã cho đồng biến trên khoảng nào dưới đây?",
            options: [
                "A. $(-1; 2)$",
                "B. $(-\infty; -1)$",
                "C. $(-1; +\infty)$",
                "D. $(0; 2)$"
            ],
            correct_option: 1,
            explanation: "<p><strong>Lời giải chi tiết:</strong></p><p>Dựa vào bảng biến thiên, ta thấy $f'(x) > 0$ trên các khoảng $(-\infty; -1)$ và $(2; +\infty)$.</p><p>Do đó hàm số $y = f(x)$ đồng biến trên khoảng $(-\infty; -1)$ và khoảng $(2; +\infty)$.</p><p>Đối chiếu các phương án, chọn <strong>B</strong>.</p>"
        },
        {
            id: 1211102,
            material_id: 12111,
            lesson_id: 1211,
            topic_id: 101,
            topic_code: "1.1",
            chuyen_de_id: 1,
            question_type: "multiple_choice",
            difficulty: "TH",
            question_text: "Cho hàm số $y = f(x)$ xác định và liên tục trên $\\mathbb{R}$, có bảng xét dấu của đạo hàm $f'(x)$ như sau:\n\n<div style=\"overflow-x:auto; margin: 12px 0;\">\n<table style=\"border-collapse: collapse; text-align: center; margin: auto; font-size: 0.95rem; border: 1px solid #CBD5E1;\">\n  <tr style=\"background: #F8FAFC; border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$x$</td>\n    <td style=\"padding: 8px 16px;\">$-\\infty$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$0$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$1$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$+\\infty$</td>\n  </tr>\n  <tr style=\"border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$f'(x)$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px; color: #DC2626; font-weight: bold;\">-</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #16A34A; font-weight: bold;\">+</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #DC2626; font-weight: bold;\">-</td>\n    <td style=\"padding: 8px 16px;\"></td>\n  </tr>\n</table>\n</div>\n\nHàm số nghịch biến trên khoảng nào dưới đây?",
            options: [
                "A. $(0; 1)$",
                "B. $(-\infty; 1)$",
                "C. $(1; +\infty)$",
                "D. $(0; +\infty)$"
            ],
            correct_option: 2,
            explanation: "<p><strong>Lời giải chi tiết:</strong></p><p>Dựa vào bảng xét dấu đạo hàm, ta thấy $f'(x) < 0$ trên các khoảng $(-\infty; 0)$ và $(1; +\infty)$.</p><p>Do đó hàm số nghịch biến trên các khoảng $(-\infty; 0)$ và $(1; +\infty)$. Chọn đáp án <strong>C</strong>.</p>"
        },

        // --- Dạng 1.2: Đọc điểm cực trị, giá trị cực trị từ BBT hoặc đồ thị (Học liệu 12112) ---
        {
            id: 1211201,
            material_id: 12112,
            lesson_id: 1211,
            topic_id: 103,
            topic_code: "1.3",
            chuyen_de_id: 1,
            question_type: "multiple_choice",
            difficulty: "NB",
            question_text: "Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ và có bảng biến thiên như sau:\n\n<div style=\"overflow-x:auto; margin: 12px 0;\">\n<table style=\"border-collapse: collapse; text-align: center; margin: auto; font-size: 0.95rem; border: 1px solid #CBD5E1;\">\n  <tr style=\"background: #F8FAFC; border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$x$</td>\n    <td style=\"padding: 8px 16px;\">$-\\infty$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$-2$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$1$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px;\">$+\\infty$</td>\n  </tr>\n  <tr style=\"border-bottom: 1px solid #CBD5E1;\">\n    <td style=\"padding: 8px 16px; font-weight: bold; border-right: 1px solid #CBD5E1;\">$f'(x)$</td>\n    <td style=\"padding: 8px 16px;\"></td>\n    <td style=\"padding: 8px 16px; color: #16A34A; font-weight: bold;\">+</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #DC2626; font-weight: bold;\">-</td>\n    <td style=\"padding: 8px 16px;\">0</td>\n    <td style=\"padding: 8px 16px; color: #16A34A; font-weight: bold;\">+</td>\n    <td style=\"padding: 8px 16px;\"></td>\n  </tr>\n</table>\n</div>\n\nĐiểm cực đại của hàm số đã cho là:",
            options: [
                "A. $x = 1$",
                "B. $x = -2$",
                "C. $y = 3$",
                "D. $x = 3$"
            ],
            correct_option: 1,
            explanation: "<p><strong>Lời giải chi tiết:</strong></p><p>Đạo hàm $f'(x)$ đổi dấu từ dương sang âm khi qua điểm $x = -2$, do đó hàm số đạt cực đại tại điểm $x = -2$. Chọn <strong>B</strong>.</p>"
        },

        // --- Dạng 19.4: Bài toán chuyển bóng/vật thể giữa 2 hộp rồi lấy ngẫu nhiên (Học liệu 12624) ---
        {
            id: 28,
            material_id: 12624,
            lesson_id: 1262,
            topic_id: 1904,
            topic_code: "19.4",
            chuyen_de_id: 19,
            question_type: "short_answer",
            difficulty: "VD",
            question_text: "Có hai chiếc hộp, hộp I có 6 quả bóng màu đỏ và 4 quả bóng màu vàng, hộp II có 7 quả bóng màu đỏ và 3 quả bóng màu vàng, các quả bóng có cùng kích thước và khối lượng. Lấy ngẫu nhiên một quả bóng từ hộp I bỏ vào hộp II. Sau đó, lấy ra ngẫu nhiên một quả bóng từ hộp II. Tính xác suất để quả bóng được lấy ra từ hộp II là quả bóng được chuyển từ hộp I sang, biết rằng quả bóng đó có màu đỏ (làm tròn kết quả đến hàng phần trăm).",
            options: [],
            correct_option: "0.08",
            explanation: "<p><strong>Lời giải chi tiết:</strong></p><p>Gọi $A$ là biến cố \"Quả bóng lấy ra từ hộp II là quả bóng chuyển từ hộp I sang\", $B$ là biến cố \"Quả bóng lấy ra từ hộp II có màu đỏ\".</p><p>Xác suất cần tính là xác suất có điều kiện $P(A|B) = \\frac{P(AB)}{P(B)}$.</p><p>Sau khi tính toán theo công thức xác suất toàn phần và định lý Bayes, ta được $P(A|B) \\approx 0.08$.</p>"
        }
    ];

    /**
     * Tự động đồng bộ và nạp cây NHCH vào LocalStorage
     */
    function seedQuestionBankData() {
        try {
            // 1. Đồng bộ Khóa học (db_courses)
            let courses = JSON.parse(localStorage.getItem('db_courses')) || [];
            // Đảm bảo các khóa cũ có course_type = 'standard'
            courses = courses.map(c => ({
                ...c,
                course_type: c.course_type || (c.id === 1200 ? 'question_bank' : 'standard')
            }));

            const existingNhchIdx = courses.findIndex(c => c.id === 1200);
            if (existingNhchIdx !== -1) {
                courses[existingNhchIdx] = { ...courses[existingNhchIdx], ...NHCH_COURSE_12 };
            } else {
                courses.push(NHCH_COURSE_12);
            }
            localStorage.setItem('db_courses', JSON.stringify(courses));

            // 2. Đồng bộ Chương (db_chapters)
            let chapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
            NHCH_CHAPTERS_12.forEach(newCh => {
                const idx = chapters.findIndex(c => c.id === newCh.id);
                if (idx !== -1) {
                    chapters[idx] = { ...chapters[idx], ...newCh };
                } else {
                    chapters.push(newCh);
                }
            });
            localStorage.setItem('db_chapters', JSON.stringify(chapters));

            // 3. Đồng bộ Bài học (db_lessons)
            let lessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
            NHCH_LESSONS_12.forEach(newL => {
                const idx = lessons.findIndex(l => l.id === newL.id);
                if (idx !== -1) {
                    lessons[idx] = { ...lessons[idx], ...newL };
                } else {
                    lessons.push(newL);
                }
            });
            localStorage.setItem('db_lessons', JSON.stringify(lessons));

            // 4. Đồng bộ Học liệu Dạng toán (db_materials)
            let materials = JSON.parse(localStorage.getItem('db_materials')) || [];
            NHCH_MATERIALS_12.forEach(newM => {
                const idx = materials.findIndex(m => m.id === newM.id);
                if (idx !== -1) {
                    materials[idx] = { ...materials[idx], ...newM };
                } else {
                    materials.push(newM);
                }
            });
            localStorage.setItem('db_materials', JSON.stringify(materials));

            // 5. Đảm bảo quyền Admin luôn sẵn sàng trên localhost
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (!localStorage.getItem('demo_admin_user')) {
                    localStorage.setItem('demo_admin_user', JSON.stringify({ name: "Thầy Tùng Dương", email: "admin@toansmart.edu.vn" }));
                }
            }

            // 5. Đồng bộ Câu hỏi mẫu chuẩn Toán 12 vào db_questions
            let questions = JSON.parse(localStorage.getItem('db_questions')) || [];
            NHCH_QUESTIONS_12.forEach(q => {
                const idx = questions.findIndex(item => item.id === q.id);
                if (idx !== -1) {
                    questions[idx] = { ...questions[idx], ...q };
                } else {
                    questions.push(q);
                }
            });
            // Loại bỏ hoàn toàn các câu hỏi Vi-ét hoặc Delta lớp 9 trong db_questions nếu có
            questions = questions.filter(q => {
                const txt = q.question_text || q.question || '';
                return !txt.includes('x^2 - 5x + 6') && !txt.includes('hệ thức Vi-ét');
            });
            localStorage.setItem('db_questions', JSON.stringify(questions));

            // 6. Gán sẵn câu hỏi vào các học liệu Quiz tương ứng
            // Dạng 1.1: Material 12111
            const q12111 = NHCH_QUESTIONS_12.filter(q => q.material_id === 12111);
            localStorage.setItem('toansmart_mq_12111', JSON.stringify(q12111));

            // Dạng 1.2: Material 12112
            const q12112 = NHCH_QUESTIONS_12.filter(q => q.material_id === 12112);
            localStorage.setItem('toansmart_mq_12112', JSON.stringify(q12112));

            // Dạng 19.4: Material 12624
            const q12624 = NHCH_QUESTIONS_12.filter(q => q.id === 28 || q.material_id === 12624);
            localStorage.setItem('toansmart_mq_12624', JSON.stringify(q12624));

            // 7. DỌN DẸP TRIỆT ĐỂ: Xóa các quiz_state lưu vết câu hỏi Vi-ét lớp 9 cũ
            try {
                for (let key in localStorage) {
                    if (key.startsWith('quiz_state_') || key.startsWith('toansmart_mq_')) {
                        const val = localStorage.getItem(key);
                        if (val && (val.includes('x^2 - 5x + 6') || val.includes('hệ thức Vi-ét') || val.includes('biệt thức \\Delta'))) {
                            console.log(`[Clean] Đã xóa cache câu hỏi mẫu cũ: ${key}`);
                            localStorage.removeItem(key);
                        }
                    }
                }
            } catch (e) {}

            // 8. Đảm bảo quyền Admin luôn sẵn sàng trên localhost
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (!localStorage.getItem('demo_admin_user')) {
                    localStorage.setItem('demo_admin_user', JSON.stringify({ name: "Thầy Tùng Dương", email: "admin@toansmart.edu.vn" }));
                }
            }

            console.log("✅ [QuestionBankSeed] Đã đồng bộ thành công NHCH Toán 12 (Chương 1 & Chương 6) và câu hỏi chuẩn vào LocalStorage!");
        } catch (e) {
            console.warn("Lỗi khi seed dữ liệu NHCH vào LocalStorage:", e);
        }
    }

    // Tự động chạy khi nạp script
    seedQuestionBankData();

    // Export ra Window
    global.NHCH_COURSE_12 = NHCH_COURSE_12;
    global.NHCH_CHAPTERS_12 = NHCH_CHAPTERS_12;
    global.NHCH_LESSONS_12 = NHCH_LESSONS_12;
    global.NHCH_MATERIALS_12 = NHCH_MATERIALS_12;
    global.QuestionBankSeed = {
        seed: seedQuestionBankData,
        getBankCourse: () => NHCH_COURSE_12,
        getBankChapters: () => NHCH_CHAPTERS_12,
        getBankLessons: () => NHCH_LESSONS_12,
        getBankMaterials: () => NHCH_MATERIALS_12,
        getBankQuestions: () => NHCH_QUESTIONS_12,
        getQuestionsByMaterial: (mId) => NHCH_QUESTIONS_12.filter(q => q.material_id === mId)
    };

})(typeof window !== 'undefined' ? window : this);
