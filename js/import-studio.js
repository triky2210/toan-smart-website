/**
 * TOÁN SMART - AI INGESTION & STAGING STUDIO CONTROLLER (js/import-studio.js)
 */

let supabaseClient = null;
let stagingQuestions = [];
let cachedCourses = [];
let cachedChapters = [];
let cachedLessons = [];
let currentEditingQuestionIndex = -1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo Supabase client
    if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
        supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    }

    // 2. Tải cây cấu trúc khoá học -> chương -> bài
    await loadCourseTree();

    // 3. Tải danh sách câu hỏi hiện có để kiểm tra trùng lặp
    await loadExistingQuestionsForDeduplication();

    // 4. Lắng nghe sự kiện dán ảnh từ Clipboard (Ctrl + V)
    setupClipboardPaste();

    // 5. Cấu hình kéo thả file (Drag and Drop)
    setupDragAndDrop();
});

/**
 * Tải cấu trúc Khoá học, Chương và Bài học vào các dropdown
 */
async function loadCourseTree() {
    if (!supabaseClient) return;
    try {
        const [cRes, chRes, lRes] = await Promise.all([
            supabaseClient.from('courses').select('id, title').order('id'),
            supabaseClient.from('chapters').select('id, course_id, title, order_index').order('order_index'),
            supabaseClient.from('lessons').select('id, chapter_id, title, order_index').order('order_index')
        ]);

        cachedCourses = cRes.data || [];
        cachedChapters = chRes.data || [];
        cachedLessons = lRes.data || [];

        const courseSelect = document.getElementById('targetCourse');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">-- Chọn Khóa học đích --</option>' + 
                cachedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
    } catch (err) {
        console.warn("Lỗi tải cây danh mục:", err);
    }
}

/**
 * Tải câu hỏi hiện có để đối soát chống trùng
 */
async function loadExistingQuestionsForDeduplication() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('questions').select('id, question_text').limit(500);
        if (data && typeof IngestionPipeline !== 'undefined') {
            IngestionPipeline.setExistingQuestions(data);
        }
    } catch (err) {
        console.warn("Lỗi tải câu hỏi đối soát:", err);
    }
}

function onTargetCourseChange() {
    const courseId = document.getElementById('targetCourse').value;
    const chSelect = document.getElementById('targetChapter');
    const lSelect = document.getElementById('targetLesson');

    if (!courseId) {
        chSelect.innerHTML = '<option value="">-- Tất cả chương --</option>';
        lSelect.innerHTML = '<option value="">-- Tất cả bài học --</option>';
        return;
    }

    const filteredCh = cachedChapters.filter(ch => ch.course_id == courseId);
    chSelect.innerHTML = '<option value="">-- Tất cả chương --</option>' + 
        filteredCh.map(ch => `<option value="${ch.id}">${ch.title}</option>`).join('');
    lSelect.innerHTML = '<option value="">-- Tất cả bài học --</option>';
}

function onTargetChapterChange() {
    const chapterId = document.getElementById('targetChapter').value;
    const lSelect = document.getElementById('targetLesson');

    if (!chapterId) {
        lSelect.innerHTML = '<option value="">-- Tất cả bài học --</option>';
        return;
    }

    const filteredL = cachedLessons.filter(l => l.chapter_id == chapterId);
    lSelect.innerHTML = '<option value="">-- Chọn Bài học đích --</option>' + 
        filteredL.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
}

/**
 * Chuyển đổi giữa các Tab nguồn nạp
 */
function switchSourceTab(tabId) {
    document.querySelectorAll('.source-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.source-tab-content').forEach(content => {
        content.style.display = (content.id === tabId) ? 'block' : 'none';
    });
}

/**
 * Thiết lập dán ảnh chụp đề thi từ clipboard (Ctrl + V)
 */
function setupClipboardPaste() {
    window.addEventListener('paste', async (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        const imageFiles = [];
        for (let item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                imageFiles.push(item.getAsFile());
            }
        }
        if (imageFiles.length > 0) {
            switchSourceTab('tab-pdf-img');
            await handleImageUpload(imageFiles);
        }
    });
}

/**
 * Kéo thả file
 */
function setupDragAndDrop() {
    const dropzones = document.querySelectorAll('.upload-dropzone');
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const first = e.dataTransfer.files[0];
                if (first.name.endsWith('.docx')) {
                    handleWordUpload([first]);
                } else {
                    handleImageUpload(e.dataTransfer.files);
                }
            }
        });
    });
}

/**
 * Bắt đầu hiệu ứng thanh tiến trình AI Multi-Agent
 */
function animateAiPipeline(onComplete) {
    const tracker = document.getElementById('aiTracker');
    const percent = document.getElementById('trackerPercent');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4')
    ];

    if (!tracker) {
        onComplete();
        return;
    }

    tracker.style.display = 'block';
    steps.forEach(s => { s.className = 'tracker-step'; });

    let current = 0;
    const interval = setInterval(() => {
        if (current < steps.length) {
            if (current > 0) steps[current - 1].className = 'tracker-step completed';
            steps[current].className = 'tracker-step active';
            percent.textContent = Math.round(((current + 1) / steps.length) * 100) + '%';
            current++;
        } else {
            clearInterval(interval);
            steps[steps.length - 1].className = 'tracker-step completed';
            setTimeout(() => {
                tracker.style.display = 'none';
                onComplete();
            }, 300);
        }
    }, 250);
}

/**
 * Xử lý tải file Word
 */
async function handleWordUpload(files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    animateAiPipeline(async () => {
        try {
            const questions = await IngestionPipeline.parseWordFile(file);
            appendStagingQuestions(questions);
        } catch (err) {
            alert("Lỗi khi đọc file Word: " + err.message);
        }
    });
}

/**
 * Xử lý tải ảnh / PDF
 */
async function handleImageUpload(files) {
    if (!files || files.length === 0) return;

    animateAiPipeline(async () => {
        try {
            const questions = await IngestionPipeline.parseImages(Array.from(files));
            appendStagingQuestions(questions);
        } catch (err) {
            alert("Lỗi khi nhận diện ảnh: " + err.message);
        }
    });
}

/**
 * Xử lý bóc tách từ Web URL
 */
function handleWebScrape() {
    const url = document.getElementById('webUrlInput').value.trim();
    if (!url) {
        alert("Vui lòng nhập đường link bài viết cần bóc tách.");
        return;
    }

    animateAiPipeline(() => {
        // Mô phỏng bóc tách từ Web với cấu trúc Bộ GD&ĐT 2025
        const mockQuestions = [
            {
                id: Date.now() + 101,
                question_type: 'multiple_choice',
                difficulty: 'TH',
                question_text: `[Nguồn Web: ${url}] Cho hàm số bậc ba $y = ax^3 + bx^2 + cx + d$ có đồ thị như hình vẽ bên. Mệnh đề nào dưới đây là đúng?`,
                options: [
                    "A. $a > 0, b < 0, c > 0, d < 0$",
                    "B. $a < 0, b > 0, c < 0, d > 0$",
                    "C. $a > 0, b > 0, c < 0, d < 0$",
                    "D. $a < 0, b < 0, c > 0, d > 0$"
                ],
                correct_option: 0,
                explanation: `Hướng dẫn giải:\n- Nhánh cuối của đồ thị đi lên từ trái sang phải nên hệ số $a > 0$.\n- Đồ thị cắt trục tung tại điểm có tung độ âm nên $d < 0$.\n- Hai điểm cực trị nằm về hai phía trục tung nên $ac < 0 \\implies c < 0$.\nVậy ta chọn đáp án A.`,
                tikz_code: `\\begin{tikzpicture}\n  \\draw[->] (-3,0) -- (3,0) node[right] {$x$};\n  \\draw[->] (0,-3) -- (0,3) node[above] {$y$};\n  \\draw[scale=1,domain=-2.1:2.1,smooth,variable=\\x,blue,thick] plot ({\\x},{\\x^3 - 3*\\x - 0.5});\n\\end{tikzpicture}`,
                source_type: 'web',
                source_metadata: { url: url },
                skill_tag: 'Nhận diện hệ số hàm số'
            }
        ];
        appendStagingQuestions(IngestionPipeline.auditQuestions(mockQuestions));
        document.getElementById('webUrlInput').value = '';
    });
}

/**
 * Xử lý văn bản thô
 */
function handleRawTextProcess() {
    const raw = document.getElementById('rawTextInput').value.trim();
    if (!raw) {
        alert("Vui lòng nhập nội dung văn bản câu hỏi.");
        return;
    }

    animateAiPipeline(() => {
        const questions = IngestionPipeline.parseTextOrHtml(raw, 'text');
        appendStagingQuestions(questions);
        document.getElementById('rawTextInput').value = '';
    });
}

/**
 * Nạp bộ câu hỏi mẫu chuẩn cấu trúc Bộ GD&ĐT 2025
 */
function loadSampleQuestions() {
    animateAiPipeline(() => {
        const sample2025 = [
            // Phần 1: Trắc nghiệm 4 lựa chọn (Có đồ thị TikZ)
            {
                id: Date.now() + 1,
                question_type: 'multiple_choice',
                difficulty: 'TH',
                question_text: 'Cho hàm số $y = f(x)$ có bảng biến thiên như hình vẽ. Hàm số đã cho đồng biến trên khoảng nào dưới đây?',
                options: [
                    'A. $(-\\infty; -1)$ và $(1; +\\infty)$',
                    'B. $(-1; 1)$',
                    'C. $(-\\infty; 1)$',
                    'D. $(0; 2)$'
                ],
                correct_option: 0,
                explanation: 'Hướng dẫn giải chi tiết:\nDựa vào bảng biến thiên ta thấy đạo hàm $y\' > 0$ trên các khoảng $(-\\infty; -1)$ và $(1; +\\infty)$. Do đó hàm số đồng biến trên các khoảng này. Chọn đáp án A.',
                tikz_code: `\\begin{tikzpicture}\n\\tkzTabInit{$x$/1, $y'$/1, $y$/2}{$-\\infty$, $-1$, $1$, $+\\infty$}\n\\tkzTabLine{,+,0,-,0,+,}\n\\tkzTabVar{-/ $-\\infty$, +/ $2$, -/ $-2$, +/ $+\\infty$}\n\\end{tikzpicture}`,
                source_type: 'manual',
                skill_tag: 'Đồng biến & Nghịch biến'
            },
            // Phần 2: Đúng / Sai 4 mệnh đề (Bộ GD&ĐT 2025)
            {
                id: Date.now() + 2,
                question_type: 'true_false',
                difficulty: 'VD',
                question_text: 'Một công ty sản xuất đồ hộp cần thiết kế lon hình trụ có thể tích $V = 500\\text{ cm}^3$. Gọi $r$ là bán kính đáy và $h$ là chiều cao của lon nước. Xét tính đúng/sai của các mệnh đề sau:',
                options: [
                    { text: 'a) Diện tích toàn phần của lon nước là $S_{tp} = 2\\pi r^2 + \\frac{1000}{r}$', is_correct: true },
                    { text: 'b) Để tốn ít vật liệu nhất thì diện tích toàn phần phải đạt giá trị lớn nhất', is_correct: false },
                    { text: 'c) Diện tích toàn phần đạt giá trị nhỏ nhất khi $r = \\sqrt[3]{\\frac{250}{\\pi}}\\text{ cm}$', is_correct: true },
                    { text: 'd) Khi diện tích toàn phần nhỏ nhất thì chiều cao lon gấp ba lần bán kính đáy ($h = 3r$)', is_correct: false }
                ],
                correct_option: [1, 0, 1, 0],
                explanation: 'Hướng dẫn giải:\n- Ta có $V = \\pi r^2 h = 500 \\implies h = \\frac{500}{\\pi r^2}$.\n- $S_{tp} = 2\\pi r^2 + 2\\pi rh = 2\\pi r^2 + \\frac{1000}{r}$. Khẳng định a ĐÚNG.\n- Để tốn ít vật liệu nhất thì $S_{tp}$ phải nhỏ nhất (cực tiểu), nên b SAI.\n- Đạo hàm $S\'(r) = 4\\pi r - \\frac{1000}{r^2} = 0 \\implies r = \\sqrt[3]{\\frac{250}{\\pi}}$. Khẳng định c ĐÚNG.\n- Khi đó $h = 2r$ (lon có chiều cao bằng đường kính đáy), nên d SAI.',
                tikz_code: `\\begin{tikzpicture}\n  \\draw (0,0) ellipse (1.2cm and 0.4cm);\n  \\draw (0,2.5) ellipse (1.2cm and 0.4cm);\n  \\draw (-1.2,0) -- (-1.2,2.5);\n  \\draw (1.2,0) -- (1.2,2.5);\n  \\draw[dashed] (0,0) -- (1.2,0) node[midway,below] {$r$};\n  \\draw[dashed] (1.5,0) -- (1.5,2.5) node[midway,right] {$h$};\n\\end{tikzpicture}`,
                source_type: 'manual',
                skill_tag: 'Ứng dụng thực tế & Cực trị'
            },
            // Phần 3: Trả lời ngắn / Điền số (Hình học không gian)
            {
                id: Date.now() + 3,
                question_type: 'short_answer',
                difficulty: 'VD',
                question_text: 'Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông cân tại $B, AB = a$. Cạnh bên $SA$ vuông góc với mặt phẳng đáy và $SA = a\\sqrt{3}$. Tính thể tích khối chóp $S.ABC$ theo $a^3$ (lấy hệ số trước $a^3$, làm tròn đến chữ số thập phân thứ hai).',
                options: [],
                correct_option: '0.29',
                explanation: 'Hướng dẫn giải chi tiết:\n- Diện tích đáy $S_{ABC} = \\frac{1}{2} AB \\cdot BC = \\frac{1}{2} a^2$.\n- Chiều cao $h = SA = a\\sqrt{3}$.\n- Thể tích $V = \\frac{1}{3} S_{ABC} \\cdot h = \\frac{1}{3} \\cdot \\frac{a^2}{2} \\cdot a\\sqrt{3} = \\frac{\\sqrt{3}}{6} a^3 \\approx 0.29 a^3$.\nĐáp số: 0.29',
                tikz_code: `\\begin{tikzpicture}\n  \\draw (0,0) -- (3,0) -- (1.5,-1) -- cycle;\n  \\draw (0,0) -- (0,2.5) node[above] {$S$};\n  \\draw (0,2.5) -- (3,0) node[right] {$C$};\n  \\draw (0,2.5) -- (1.5,-1) node[below] {$B$};\n  \\node[left] at (0,0) {$A$};\n\\end{tikzpicture}`,
                source_type: 'manual',
                skill_tag: 'Thể tích khối chóp'
            }
        ];

        appendStagingQuestions(IngestionPipeline.auditQuestions(sample2025));
    });
}

/**
 * Thêm danh sách câu hỏi vào vùng đệm Staging
 */
function appendStagingQuestions(newQuestions) {
    stagingQuestions = [...stagingQuestions, ...newQuestions];
    renderStagingView();
}

/**
 * Render toàn bộ danh sách câu hỏi trong Staging
 */
function renderStagingView() {
    const container = document.getElementById('stagingQuestionsList');
    const stickyBar = document.getElementById('commitStickyBar');
    const commitCount = document.getElementById('commitCount');

    // Thống kê số lượng
    const total = stagingQuestions.length;
    const valid = stagingQuestions.filter(q => q.audit?.status === 'valid').length;
    const warning = stagingQuestions.filter(q => q.audit?.status === 'warning').length;
    const error = stagingQuestions.filter(q => q.audit?.status === 'error').length;

    document.getElementById('statTotal').innerHTML = `<i class="fa-solid fa-list-check"></i> Tổng: ${total}`;
    document.getElementById('statValid').innerHTML = `<i class="fa-solid fa-check"></i> Hợp lệ: ${valid}`;
    document.getElementById('statWarning').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Cảnh báo: ${warning}`;
    
    const statErr = document.getElementById('statError');
    if (error > 0) {
        statErr.style.display = 'inline-flex';
        statErr.innerHTML = `<i class="fa-solid fa-xmark"></i> Lỗi: ${error}`;
    } else {
        statErr.style.display = 'none';
    }

    if (total === 0) {
        container.innerHTML = `
            <div style="background: #FFFFFF; border: 1px dashed var(--border-color); border-radius: 16px; padding: 48px; text-align: center; color: var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size: 3rem; color: #CBD5E1; margin-bottom: 14px;"></i>
                <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; color: var(--text-dark);">Vùng đệm hiện đang trống</h4>
                <p style="margin: 0; font-size: 0.9rem;">Hãy tải lên file Word, ảnh chụp hoặc nhấn <b>"Nạp đề mẫu 2025"</b> ở góc phải phía trên để trải nghiệm!</p>
            </div>
        `;
        stickyBar.style.display = 'none';
        return;
    }

    stickyBar.style.display = 'flex';
    commitCount.textContent = total;

    container.innerHTML = stagingQuestions.map((q, idx) => {
        const audit = q.audit || { status: 'valid', warnings: [], errors: [], completeness_score: 100 };
        const statusClass = `status-${audit.status}`;

        // Badge loại câu
        let typeBadge = '';
        if (q.question_type === 'true_false') {
            typeBadge = `<span class="badge-type badge-tf"><i class="fa-solid fa-square-check"></i> Phần 2: Đúng / Sai</span>`;
        } else if (q.question_type === 'short_answer') {
            typeBadge = `<span class="badge-type badge-sa"><i class="fa-solid fa-pen"></i> Phần 3: Trả lời ngắn</span>`;
        } else {
            typeBadge = `<span class="badge-type badge-mc"><i class="fa-solid fa-list-ol"></i> Phần 1: Trắc nghiệm</span>`;
        }

        // Badge mức độ
        const diff = q.difficulty || 'NB';
        const diffBadge = `<span class="diff-tag diff-${diff.toLowerCase()}">${diff}</span>`;

        // Render Đồ thị TikZ Vector qua TikZRenderer
        const diagramHtml = (typeof TikZRenderer !== 'undefined') ? 
            TikZRenderer.render({
                tikzCode: q.tikz_code,
                fallbackUrl: q.fallback_image_url,
                caption: 'Hình vẽ minh họa'
            }) : '';

        // Render Phương án & Đáp án
        let optionsHtml = '';
        if (q.question_type === 'multiple_choice') {
            optionsHtml = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin: 12px 0;">
                    ${(q.options || []).map((opt, oIdx) => {
                        const isCorrect = (oIdx === q.correct_option);
                        return `
                            <div class="option-item ${isCorrect ? 'correct' : ''}">
                                <span class="math-render" style="color: #1E293B; font-weight: ${isCorrect ? '700' : '400'};">${escapeHtml(opt)}</span>
                                ${isCorrect ? '<span style="background: #10B981; color: #FFFFFF; font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; font-weight: 800;"><i class="fa-solid fa-check"></i> ĐÚNG</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (q.question_type === 'true_false') {
            optionsHtml = `
                <div style="display: flex; flex-direction: column; gap: 8px; margin: 12px 0;">
                    ${(q.options || []).map((stmt, sIdx) => {
                        const isTrue = (typeof stmt === 'object' && stmt !== null) ? stmt.is_correct : (Array.isArray(q.correct_option) ? q.correct_option[sIdx] == 1 : true);
                        const text = (typeof stmt === 'object' && stmt !== null) ? stmt.text : stmt;
                        return `
                            <div class="option-item ${isTrue ? 'correct' : ''}" style="border-color: ${isTrue ? '#86EFAC' : '#FECDD3'}; background: ${isTrue ? '#F0FDF4' : '#FFF1F2'};">
                                <span class="math-render" style="color: #1E293B;">${escapeHtml(text)}</span>
                                <span style="background: ${isTrue ? '#10B981' : '#EF4444'}; color: #FFFFFF; font-size: 0.72rem; padding: 3px 10px; border-radius: 6px; font-weight: 800;">
                                    ${isTrue ? '<i class="fa-solid fa-check"></i> ĐÚNG' : '<i class="fa-solid fa-xmark"></i> SAI'}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (q.question_type === 'short_answer') {
            optionsHtml = `
                <div style="margin: 12px 0; padding: 12px 18px; border-radius: 12px; background: #F0FDF4; border: 1.5px solid #86EFAC; display: flex; align-items: center; gap: 12px;">
                    <span style="font-weight: 700; color: #166534;"><i class="fa-solid fa-key"></i> Đáp án chính xác:</span>
                    <span style="font-size: 1.2rem; font-weight: 800; color: #059669; background: #FFFFFF; padding: 4px 16px; border-radius: 8px; border: 1px solid #A7F3D0;">${escapeHtml(String(q.correct_option || ''))}</span>
                </div>
            `;
        }

        // Hướng dẫn giải (HDG)
        const expHtml = q.explanation ? `
            <div style="background: #F0FDF4; border: 1.5px dashed #86EFAC; border-radius: 12px; padding: 14px 18px; margin-top: 14px;">
                <div style="font-weight: 700; color: #166534; font-size: 0.9rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-lightbulb" style="color: #F59E0B;"></i> Hướng dẫn giải chi tiết:
                </div>
                <div class="math-render" style="color: #1F2937; line-height: 1.6; font-size: 0.92rem; white-space: pre-line;">${escapeHtml(q.explanation)}</div>
            </div>
        ` : '';

        // Cảnh báo Audit
        const warningsHtml = (audit.warnings && audit.warnings.length > 0) ? `
            <div style="margin-top: 12px; padding: 10px 14px; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 10px; font-size: 0.82rem; color: #92400E; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1rem;"></i>
                <div>${audit.warnings.join(' • ')}</div>
            </div>
        ` : '';

        return `
            <div class="q-card ${statusClass}" id="q_card_${idx}">
                <!-- Header thẻ -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: var(--text-dark);">Câu ${idx + 1}</span>
                        ${typeBadge}
                        ${diffBadge}
                        ${q.skill_tag ? `<span style="font-size: 0.75rem; background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 6px;"><i class="fa-solid fa-tag"></i> ${escapeHtml(q.skill_tag)}</span>` : ''}
                    </div>

                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.78rem; font-weight: 700; color: #64748B;">Độ hoàn thiện: 
                            <strong style="color: ${audit.completeness_score >= 80 ? '#10B981' : '#F59E0B'};">${audit.completeness_score}%</strong>
                        </span>
                        <button type="button" onclick="openEditModal(${idx})" class="btn" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 8px; border: 1px solid #CBD5E1; background: #FFFFFF; color: var(--text-dark); cursor: pointer; font-weight: 600;">
                            <i class="fa-solid fa-pen"></i> Sửa nhanh
                        </button>
                        <button type="button" onclick="deleteStagingQuestion(${idx})" class="btn" style="padding: 6px 10px; font-size: 0.82rem; border-radius: 8px; border: 1px solid #FECDD3; background: #FFF1F2; color: #EF4444; cursor: pointer;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <!-- Đề bài -->
                <div class="math-render" style="font-size: 1rem; line-height: 1.7; color: var(--text-dark); margin-bottom: 12px;">
                    ${escapeHtml(q.question_text)}
                </div>

                <!-- Đồ thị / TikZ SVG -->
                ${diagramHtml}

                <!-- Phương án -->
                ${optionsHtml}

                <!-- Lời giải -->
                ${expHtml}

                <!-- Cảnh báo nếu có -->
                ${warningsHtml}
            </div>
        `;
    }).join('');

    // Tự động render KaTeX cho toàn bộ các phần tử vừa tạo
    if (window.renderMathInElement) {
        renderMathInElement(container, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
            ],
            throwOnError: false
        });
    }
}

/**
 * Xóa một câu hỏi khỏi Staging
 */
function deleteStagingQuestion(index) {
    if (confirm(`Bạn có chắc muốn xóa Câu ${index + 1} khỏi danh sách chờ nạp?`)) {
        stagingQuestions.splice(index, 1);
        renderStagingView();
    }
}

/**
 * Xóa toàn bộ Staging
 */
function clearStaging() {
    if (confirm("Bạn có chắc muốn xóa toàn bộ câu hỏi trong vùng đệm?")) {
        stagingQuestions = [];
        renderStagingView();
    }
}

/**
 * Mở modal chỉnh sửa câu hỏi
 */
function openEditModal(index) {
    currentEditingQuestionIndex = index;
    const q = stagingQuestions[index];
    if (!q) return;

    document.getElementById('editQuestionText').value = q.question_text || '';
    document.getElementById('editTikzCode').value = q.tikz_code || '';
    document.getElementById('editFallbackUrl').value = q.fallback_image_url || '';
    document.getElementById('editExplanation').value = q.explanation || '';

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditingQuestionIndex = -1;
}

function saveEditModal() {
    if (currentEditingQuestionIndex < 0 || currentEditingQuestionIndex >= stagingQuestions.length) return;
    const q = stagingQuestions[currentEditingQuestionIndex];

    q.question_text = document.getElementById('editQuestionText').value.trim();
    q.tikz_code = document.getElementById('editTikzCode').value.trim();
    q.fallback_image_url = document.getElementById('editFallbackUrl').value.trim();
    q.explanation = document.getElementById('editExplanation').value.trim();

    // Re-audit
    stagingQuestions[currentEditingQuestionIndex] = IngestionPipeline.auditQuestions([q])[0];
    closeEditModal();
    renderStagingView();
}

/**
 * Nạp toàn bộ câu hỏi trong Staging vào CSDL Supabase
 */
async function commitStagingToQuestionBank() {
    if (stagingQuestions.length === 0) {
        alert("Vùng đệm hiện không có câu hỏi nào để nạp.");
        return;
    }

    const courseId = document.getElementById('targetCourse').value;
    const chapterId = document.getElementById('targetChapter').value;
    const lessonId = document.getElementById('targetLesson').value;

    if (!supabaseClient) {
        alert("Chưa kết nối được Supabase. Vui lòng kiểm tra lại cấu hình.");
        return;
    }

    const readyQuestions = stagingQuestions.filter(q => q.audit?.status !== 'error');
    if (readyQuestions.length === 0) {
        alert("Không có câu hỏi nào đủ điều kiện hợp lệ để nạp.");
        return;
    }

    if (!confirm(`Bạn có chắc muốn nạp ${readyQuestions.length} câu hỏi này vào Ngân hàng câu hỏi?`)) {
        return;
    }

    // Chuẩn bị payload nạp vào bảng questions
    const payload = readyQuestions.map(q => ({
        course_id: courseId ? parseInt(courseId) : null,
        chapter_id: chapterId ? parseInt(chapterId) : null,
        lesson_id: lessonId ? parseInt(lessonId) : null,
        question_type: q.question_type || 'multiple_choice',
        difficulty: q.difficulty || 'NB',
        question_text: q.question_text,
        options: q.options || [],
        correct_option: (typeof q.correct_option === 'number') ? q.correct_option : (Array.isArray(q.correct_option) ? q.correct_option : parseInt(q.correct_option) || 0),
        explanation: q.explanation || '',
        tikz_code: q.tikz_code || null,
        fallback_image_url: q.fallback_image_url || null,
        source_type: q.source_type || 'manual',
        source_metadata: q.source_metadata || {},
        skill_tag: q.skill_tag || 'Tổng hợp',
        is_staging: false
    }));

    try {
        const { data, error } = await supabaseClient.from('questions').insert(payload).select('id');
        if (error) throw error;

        alert(`🎉 Thành công! Đã nạp thành công ${data.length} câu hỏi vào Ngân hàng.`);
        stagingQuestions = [];
        renderStagingView();
    } catch (err) {
        alert("Lỗi khi nạp vào CSDL: " + (err.message || err));
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
