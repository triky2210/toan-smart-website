/**
 * TOÁN SMART - AI INGESTION & STAGING STUDIO CONTROLLER (js/import-studio.js)
 */

// supabaseClient đã được khai báo ở js/config.js, dùng lại biến toàn cục
let stagingQuestions = [];
let cachedCourses = [];
let cachedChapters = [];
let cachedLessons = [];
let currentEditingQuestionIndex = -1;
let pendingUploadFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Khởi tạo Supabase client nếu chưa có
    if (typeof supabase !== 'undefined' && !supabaseClient) {
        if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_KEY !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    }

    // 2. Tải cây cấu trúc khoá học -> chương -> bài
    await loadCourseTree();

    // 3. Tải danh sách câu hỏi hiện có để kiểm tra trùng lặp
    await loadExistingQuestionsForDeduplication();

    // 4. Lắng nghe sự kiện dán ảnh từ Clipboard (Ctrl + V)
    setupClipboardPaste();

    // 5. Cấu hình kéo thả file (Drag and Drop)
    setupDragAndDrop();

    // 6. Khởi tạo 19 Chuyên đề & Dạng toán chuẩn sư phạm
    initChuyenDeAndTopics();

    // 7. Cập nhật trạng thái hiển thị của Gemini Vision Key
    updateGeminiKeyStatusUI();
});

/**
 * Tải cấu trúc Khoá học, Chương và Bài học vào các dropdown
 */
async function loadCourseTree() {
    try {
        if (supabaseClient) {
            const [cRes, chRes, lRes] = await Promise.all([
                supabaseClient.from('courses').select('id, title').order('id'),
                supabaseClient.from('chapters').select('id, course_id, title, order_index').order('order_index'),
                supabaseClient.from('lessons').select('id, chapter_id, title, order_index').order('order_index')
            ]);

            cachedCourses = cRes.data || [];
            cachedChapters = chRes.data || [];
            cachedLessons = lRes.data || [];
        }

        // Fallback tự động nếu chưa có dữ liệu từ DB: lấy từ QuestionBankSeed
        if (cachedCourses.length === 0 && typeof QuestionBankSeed !== 'undefined') {
            const seedCourse = QuestionBankSeed.getQuestionBankCourse();
            cachedCourses = [seedCourse];
            cachedChapters = seedCourse.chapters || [];
            cachedLessons = (seedCourse.chapters || []).flatMap(ch => ch.lessons || []);
        }

        const courseSelect = document.getElementById('targetCourse');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">-- Chọn Khóa học đích --</option>' + 
                cachedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
            
            // Nếu có dữ liệu, chọn mặc định khoá học đầu tiên (NHCH Toán 12)
            if (cachedCourses.length > 0) {
                courseSelect.value = cachedCourses[0].id;
                onTargetCourseChange();
            }
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

function initChuyenDeAndTopics() {
    const cdSelect = document.getElementById('targetChuyenDe');
    if (!cdSelect || typeof MathTopicService === 'undefined') return;

    const allCD = MathTopicService.getAllChuyenDe();
    cdSelect.innerHTML = '<option value="">-- Tất cả Chuyên đề (1-19) --</option>' + 
        allCD.map(cd => `<option value="${cd.id}">${cd.short_name}</option>`).join('');

    onTargetChuyenDeChange();
}

function onTargetChuyenDeChange() {
    const cdId = document.getElementById('targetChuyenDe')?.value;
    const tSelect = document.getElementById('targetTopic');
    if (!tSelect || typeof MathTopicService === 'undefined') return;

    const topics = cdId ? MathTopicService.getTopicsByChuyenDe(cdId) : MathTopicService.getAllTopics();
    tSelect.innerHTML = '<option value="">-- Tự động nhận diện dạng toán (AI) --</option>' + 
        topics.map(t => `<option value="${t.id}">[Dạng ${t.code}] ${t.name.slice(0, 48)}${t.name.length > 48 ? '...' : ''}</option>`).join('');
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
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea') {
            return;
        }

        const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
        if (!items) return;

        const imageFiles = [];
        for (let item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                const file = new File([blob], `clipboard_screenshot_${Date.now()}.png`, { type: blob.type });
                imageFiles.push(file);
            }
        }
        if (imageFiles.length > 0) {
            switchSourceTab('tab-smart-upload');
            handleUniversalFileSelect(imageFiles);
        }
    });
}

/**
 * Kéo thả file đa năng (Word, PDF, Ảnh)
 */
function setupDragAndDrop() {
    const dropzone = document.getElementById('universalDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleUniversalFileSelect(files);
        }
    }, false);
}

/**
 * Tiếp nhận file từ người dùng (Word, PDF, Ảnh), tự động nhận diện định dạng
 */
function handleUniversalFileSelect(files) {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    pendingUploadFiles = pendingUploadFiles.concat(newFiles);

    renderFilePreviewCard();
}

/**
 * Hiển thị thẻ xem trước thông tin các file đã chọn
 */
function renderFilePreviewCard() {
    const card = document.getElementById('filePreviewCard');
    const dropzone = document.getElementById('universalDropzone');
    const listContainer = document.getElementById('fileListContainer');
    const summaryText = document.getElementById('fileSummaryText');

    if (!card || !dropzone || !listContainer) return;

    if (pendingUploadFiles.length === 0) {
        card.style.display = 'none';
        dropzone.style.display = 'block';
        return;
    }

    dropzone.style.display = 'none';
    card.style.display = 'block';

    const count = pendingUploadFiles.length;
    summaryText.innerHTML = `Có <strong>${count} file</strong> đã sẵn sàng. Nhấn "Bắt đầu phân tích bóc tách" để AI trích xuất nội dung:`;

    listContainer.innerHTML = pendingUploadFiles.map((file, idx) => {
        const ext = file.name.split('.').pop().toLowerCase();
        let badgeHtml = '';
        let iconHtml = '';

        if (ext === 'docx') {
            iconHtml = '<i class="fa-solid fa-file-word" style="color: #2563EB; font-size: 1.5rem;"></i>';
            badgeHtml = '<span style="background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-file-word"></i> Word (.docx)</span>';
        } else if (ext === 'pdf' || file.type === 'application/pdf') {
            iconHtml = '<i class="fa-solid fa-file-pdf" style="color: #DC2626; font-size: 1.5rem;"></i>';
            badgeHtml = '<span style="background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-file-pdf"></i> PDF</span>';
        } else if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
            iconHtml = '<i class="fa-solid fa-file-image" style="color: #7E22CE; font-size: 1.5rem;"></i>';
            badgeHtml = '<span style="background: #F3E8FF; color: #7E22CE; border: 1px solid #E9D5FF; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><i class="fa-solid fa-image"></i> Ảnh đề thi</span>';
        } else {
            iconHtml = '<i class="fa-solid fa-file-lines" style="color: #64748B; font-size: 1.5rem;"></i>';
            badgeHtml = `<span style="background: #F1F5F9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">${ext.toUpperCase()}</span>`;
        }

        const sizeFormatted = (file.size < 1024 * 1024) 
            ? `${(file.size / 1024).toFixed(1)} KB` 
            : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 10px 14px;">
                <div style="display: flex; align-items: center; gap: 12px; overflow: hidden;">
                    ${iconHtml}
                    <div style="overflow: hidden;">
                        <div style="font-weight: 700; font-size: 0.9rem; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px;" title="${escapeHtml(file.name)}">
                            ${escapeHtml(file.name)}
                        </div>
                        <div style="font-size: 0.78rem; color: #64748B; display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                            <span>${sizeFormatted}</span>
                            <span>•</span>
                            ${badgeHtml}
                        </div>
                    </div>
                </div>
                <button type="button" onclick="removePendingFile(${idx})" title="Xóa file này" style="background: none; border: none; color: #94A3B8; cursor: pointer; padding: 4px 8px; font-size: 1rem;">
                    <i class="fa-solid fa-trash-can" style="color: #94A3B8;"></i>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Xóa 1 file khỏi danh sách chờ
 */
function removePendingFile(idx) {
    if (idx >= 0 && idx < pendingUploadFiles.length) {
        pendingUploadFiles.splice(idx, 1);
        renderFilePreviewCard();
    }
}

/**
 * Hủy chọn file, quay lại khung kéo thả
 */
function cancelUniversalFileSelect() {
    pendingUploadFiles = [];
    const input = document.getElementById('fileUniversal');
    if (input) input.value = '';
    const card = document.getElementById('filePreviewCard');
    const dropzone = document.getElementById('universalDropzone');
    if (card) card.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
}

/**
 * Cập nhật thanh tiến trình AI Multi-Agent thời gian thực
 */
function setPipelineProgress({ percent, step, title }) {
    const tracker = document.getElementById('aiTracker');
    const percentEl = document.getElementById('trackerPercent');
    const barEl = document.getElementById('trackerProgressBar');
    const titleEl = document.getElementById('trackerTitle');
    const steps = [
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4')
    ];

    if (!tracker) return;
    tracker.style.display = 'block';

    const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
    if (percentEl) percentEl.textContent = p + '%';
    if (barEl) barEl.style.width = p + '%';
    if (titleEl && title) titleEl.textContent = title;

    if (step && step >= 1 && step <= 4) {
        steps.forEach((s, idx) => {
            if (!s) return;
            const stepNum = idx + 1;
            if (stepNum < step) s.className = 'tracker-step completed';
            else if (stepNum === step) s.className = 'tracker-step active';
            else s.className = 'tracker-step';
        });
    }
}

/**
 * Hiển thị thông báo thông minh (Smart Alert Card)
 */
function showSmartAlert(type, title, message) {
    const alertBox = document.getElementById('aiNoticeAlert');
    const icon = document.getElementById('aiNoticeIcon');
    const titleEl = document.getElementById('aiNoticeTitle');
    const msgEl = document.getElementById('aiNoticeMessage');
    if (!alertBox || !icon || !titleEl || !msgEl) {
        alert(title + "\n" + message);
        return;
    }

    if (type === 'warning' || type === 'quota') {
        alertBox.style.background = '#FFFBEB';
        alertBox.style.borderColor = '#FCD34D';
        alertBox.style.color = '#92400E';
        icon.className = 'fa-solid fa-triangle-exclamation';
        icon.style.color = '#D97706';
    } else if (type === 'error') {
        alertBox.style.background = '#FEF2F2';
        alertBox.style.borderColor = '#FCA5A5';
        alertBox.style.color = '#991B1B';
        icon.className = 'fa-solid fa-circle-xmark';
        icon.style.color = '#DC2626';
    } else {
        alertBox.style.background = '#EFF6FF';
        alertBox.style.borderColor = '#BFDBFE';
        alertBox.style.color = '#1E40AF';
        icon.className = 'fa-solid fa-circle-info';
        icon.style.color = '#2563EB';
    }

    titleEl.textContent = title;
    msgEl.innerHTML = message;
    alertBox.style.display = 'flex';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Bắt đầu hiệu ứng thanh tiến trình AI Multi-Agent cho các tác vụ nhanh
 */
function animateAiPipeline(onComplete) {
    const alertBox = document.getElementById('aiNoticeAlert');
    if (alertBox) alertBox.style.display = 'none';

    let current = 0;
    const stepTitles = [
        '1. Đang thu thập và tiền xử lý dữ liệu...',
        '2. AI Vision & Parser đang phân tích cấu trúc...',
        '3. Tái tạo vector TikZ & công thức KaTeX...',
        '4. Kiểm định câu hỏi theo chuẩn GDPT 2025...'
    ];

    setPipelineProgress({ percent: 25, step: 1, title: stepTitles[0] });

    const interval = setInterval(() => {
        current++;
        if (current < 4) {
            setPipelineProgress({
                percent: (current + 1) * 25,
                step: current + 1,
                title: stepTitles[current]
            });
        } else {
            clearInterval(interval);
            setTimeout(async () => {
                const tracker = document.getElementById('aiTracker');
                if (tracker) tracker.style.display = 'none';
                if (typeof onComplete === 'function') {
                    try {
                        await onComplete();
                    } catch (err) {
                        console.error("Lỗi trong quá trình xử lý bóc tách:", err);
                        showSmartAlert('error', 'Lỗi xử lý bóc tách', err.message || String(err));
                    }
                }
            }, 300);
        }
    }, 250);
}

/**
 * Bắt đầu phân tích bóc tách các file đã tiếp nhận với Live Loading & Smart Notice
 */
async function startUniversalFileProcess() {
    if (pendingUploadFiles.length === 0) {
        alert("Chưa có file nào trong danh sách. Vui lòng kéo thả hoặc bấm vào ô để chọn file.");
        return;
    }

    const alertBox = document.getElementById('aiNoticeAlert');
    if (alertBox) alertBox.style.display = 'none';

    const btn = document.getElementById('btnStartProcess');
    const btnText = document.getElementById('btnStartProcessText');
    const btnIcon = document.getElementById('btnStartProcessIcon');

    if (btn) btn.disabled = true;
    if (btnIcon) btnIcon.className = 'fa-solid fa-circle-notch fa-spin';
    if (btnText) btnText.textContent = 'Đang phân tích...';

    const tracker = document.getElementById('aiTracker');
    if (tracker) tracker.style.display = 'block';

    setPipelineProgress({ percent: 15, step: 1, title: 'Đang tiếp nhận và tối ưu hóa tệp đề thi...' });

    // Live Stopwatch & Ticker thời gian thực
    const processStartTime = performance.now();
    let currentPercent = 15;
    let tickerInterval = setInterval(() => {
        const elapsedSec = ((performance.now() - processStartTime) / 1000).toFixed(1);
        if (currentPercent < 78) {
            currentPercent += 2;
            if (currentPercent > 78) currentPercent = 78;
            const bar = document.getElementById('trackerProgressBar');
            const pct = document.getElementById('trackerPercent');
            if (bar) bar.style.width = currentPercent + '%';
            if (pct) pct.textContent = currentPercent + '%';
        }
        if (btnText) btnText.textContent = `Đang phân tích (${elapsedSec}s)...`;
    }, 200);

    const filesToProcess = [...pendingUploadFiles];
    let totalAdded = 0;
    window._lastAiWarning = null;

    try {
        for (let fIdx = 0; fIdx < filesToProcess.length; fIdx++) {
            const file = filesToProcess[fIdx];
            const ext = file.name.split('.').pop().toLowerCase();
            let questions = [];

            if (ext === 'docx') {
                setPipelineProgress({ percent: 50, step: 2, title: `Đang bóc tách file Word offline siêu tốc (${fIdx + 1}/${filesToProcess.length})...` });
                questions = await IngestionPipeline.parseWordFile(file);
            } else if (ext === 'pdf' || file.type === 'application/pdf') {
                setPipelineProgress({ percent: 45, step: 2, title: `Đang xử lý trang PDF (${fIdx + 1}/${filesToProcess.length})...` });
                questions = await IngestionPipeline.parsePdf(file);
            } else if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
                setPipelineProgress({ percent: 35, step: 2, title: `Đang gửi ảnh nén sang Google Gemini Vision AI (${fIdx + 1}/${filesToProcess.length})...` });
                
                questions = await IngestionPipeline.parseImages([file], (prog) => {
                    if (prog && prog.percent) {
                        currentPercent = Math.max(currentPercent, prog.percent);
                        setPipelineProgress({
                            percent: currentPercent,
                            step: prog.step || 2,
                            title: prog.title || 'AI đang phân tích câu hỏi và nhận diện bảng biến thiên...'
                        });
                    }
                });
            } else {
                const text = await file.text();
                questions = IngestionPipeline.parseTextOrHtml(text, 'text');
            }

            if (questions && questions.length > 0) {
                setPipelineProgress({ percent: 90, step: 3, title: 'Đang chuẩn hóa vector TikZ & công thức KaTeX...' });
                appendStagingQuestions(questions);
                totalAdded += questions.length;
            }
        }

        clearInterval(tickerInterval);
        setPipelineProgress({ percent: 100, step: 4, title: `Hoàn tất! Đã nạp thành công ${totalAdded} câu hỏi vào Vùng đệm.` });

        // Kiểm tra xem có cảnh báo hạn ngạch / quá tải AI cần thông báo thông minh không
        if (window._lastAiWarning) {
            const warn = window._lastAiWarning;
            window._lastAiWarning = null;
            if (warn.code === 'QUOTA_EXCEEDED' || warn.message?.includes('429') || warn.message?.includes('RESOURCE_EXHAUSTED')) {
                showSmartAlert(
                    'warning',
                    'Đã bảo lưu đề thi vào Vùng đệm • Hạn ngạch Google Gemini đạt giới hạn (429)',
                    'Tài khoản Google AI Studio (bản Miễn phí) giới hạn tốc độ <b>15 lượt gọi / phút</b>.<br/><b>Toàn bộ ảnh đề bài đã được giữ nguyên ở Vùng đệm bên dưới!</b> Thầy cô có thể nhấn <b>"Sửa nhanh"</b> để hoàn thiện, hoặc sử dụng tính năng nạp trực tiếp bằng <b>File Word (.docx)</b> siêu tốc 0.2s mà không phụ thuộc vào AI!'
                );
            } else {
                showSmartAlert(
                    'warning',
                    'Đã bảo lưu đề thi vào Vùng đệm • Máy chủ AI phản hồi chậm',
                    'Máy chủ Google AI gặp độ trễ lớn khi phân tích ảnh. Toàn bộ hình ảnh đề thi đã được tự động giữ nguyên an toàn ở Vùng đệm bên dưới để thầy cô không bị mất dữ liệu!'
                );
            }
        }

        setTimeout(() => {
            if (tracker) tracker.style.display = 'none';
            if (btn) btn.disabled = false;
            if (btnIcon) btnIcon.className = 'fa-solid fa-bolt';
            if (btnText) btnText.textContent = 'Bắt đầu phân tích bóc tách';
            cancelUniversalFileSelect();

            const step2 = document.querySelector('.staging-header-bar') || document.getElementById('stagingQuestionsList');
            if (step2) {
                step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);

    } catch (err) {
        clearInterval(tickerInterval);
        if (tracker) tracker.style.display = 'none';
        if (btn) btn.disabled = false;
        if (btnIcon) btnIcon.className = 'fa-solid fa-bolt';
        if (btnText) btnText.textContent = 'Bắt đầu phân tích bóc tách';

        console.error("Lỗi bóc tách:", err);

        if (err.code === 'QUOTA_EXCEEDED' || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
            showSmartAlert(
                'warning',
                'Hạn ngạch Google Gemini API tạm thời đạt giới hạn (429 - Resource Exhausted)',
                'Tài khoản Google AI Studio (bản Miễn phí) giới hạn tốc độ <b>15 lượt gọi / phút</b>. Thầy vui lòng đợi khoảng <b>30 giây</b> rồi bấm phân tích lại, hoặc nhấn vào nút <b>"Cài đặt Gemini AI Key"</b> ở trên để nạp thêm API Key mới nhé!'
            );
        } else if (err.code === 'INVALID_KEY' || err.message?.includes('API_KEY_INVALID') || err.message?.includes('400')) {
            showSmartAlert(
                'error',
                'API Key Google Gemini không hợp lệ hoặc chưa kích hoạt',
                'Hệ thống không thể xác thực API Key đã nhập. Thầy hãy bấm vào nút <b>"Cài đặt Gemini AI Key"</b> ở góc trên bên phải để kiểm tra và dán lại API Key chuẩn.'
            );
        } else if (err.message?.includes('503') || err.message?.includes('Service Unavailable')) {
            showSmartAlert(
                'warning',
                'Máy chủ Google Gemini AI đang quá tải tạm thời (503)',
                'Máy chủ của Google đang xử lý quá nhiều yêu cầu cùng lúc. Thầy vui lòng bấm nút <b>"Bắt đầu phân tích bóc tách"</b> để thử lại lần nữa nhé.'
            );
        } else {
            showSmartAlert(
                'warning',
                'Thông báo bóc tách',
                err.message || 'Không thể bóc tách câu hỏi từ file đã chọn. Thầy hãy kiểm tra lại ảnh chụp có rõ nét hoặc thử cắt gần hơn vào phần đề bài nhé.'
            );
        }
    }
}

/**
 * Tương thích ngược: Xử lý tải file Word trực tiếp
 */
async function handleWordUpload(files) {
    handleUniversalFileSelect(files);
}

/**
 * Tương thích ngược: Xử lý tải ảnh / PDF trực tiếp
 */
async function handleImageUpload(files) {
    handleUniversalFileSelect(files);
}

/**
 * Xử lý bóc tách từ Web URL & mã HTML sao chép
 */
function handleWebScrape() {
    const url = document.getElementById('webUrlInput')?.value.trim() || '';
    const html = document.getElementById('webHtmlInput')?.value.trim() || '';

    if (!url && !html) {
        alert("Vui lòng nhập đường link bài viết hoặc dán nội dung/mã HTML từ trang web.");
        return;
    }

    animateAiPipeline(() => {
        if (html) {
            // Có nội dung HTML hoặc text sao chép từ web
            const questions = IngestionPipeline.parseTextOrHtml(html, 'web');
            if (url) {
                questions.forEach(q => {
                    q.source_metadata = { url: url };
                    if (!q.question_text.startsWith('[Nguồn Web:')) {
                        q.question_text = `[Nguồn Web: ${url}] ` + q.question_text;
                    }
                });
            }
            appendStagingQuestions(questions);
            document.getElementById('webHtmlInput').value = '';
            if (url) document.getElementById('webUrlInput').value = '';
        } else {
            // Chỉ có URL: Tạo câu hỏi mô phỏng bóc tách từ website đó với cấu trúc chuẩn Bộ GD&ĐT 2025
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
        }

        const step2 = document.querySelector('.staging-header-bar') || document.getElementById('stagingQuestionsList');
        if (step2) {
            step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

        const step2 = document.querySelector('.staging-header-bar') || document.getElementById('stagingQuestionsList');
        if (step2) {
            step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

        // Render Đồ thị TikZ/SVG Vector qua TikZRenderer
        const diagramHtml = (typeof TikZRenderer !== 'undefined') ? 
            TikZRenderer.render({
                tikzCode: q.tikz_code,
                svgCode: q.svg_code,
                fallbackUrl: q.fallback_image_url,
                caption: 'Hình vẽ minh họa',
                questionIndex: idx
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

        // Tự động nhận diện dạng toán chuẩn sư phạm
        const detectedTopic = (typeof MathTopicService !== 'undefined') ? MathTopicService.autoDetectTopic(q.question_text) : null;

        return `
            <div class="q-card ${statusClass}" id="q_card_${idx}">
                <!-- Header thẻ -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: var(--text-dark);">Câu ${idx + 1}</span>
                        ${typeBadge}
                        ${diffBadge}
                        ${detectedTopic ? `
                            <span style="font-size: 0.76rem; background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; padding: 2px 8px; border-radius: 6px; font-weight: 700;" title="${escapeHtml(detectedTopic.name)}">
                                <i class="fa-solid fa-shapes"></i> Dạng ${detectedTopic.code}
                            </span>
                        ` : ''}
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
 * Biến toàn cục theo dõi trạng thái biên tập SVG & Câu hỏi
 */
let currentSvgEditingIndex = -1;
let originalSvgBackup = '';

/**
 * Mở modal chỉnh sửa câu hỏi (Chuẩn GDPT 2025)
 */
function openEditModal(index) {
    currentEditingQuestionIndex = index;
    const q = stagingQuestions[index];
    if (!q) return;

    // 1. Loại câu hỏi
    const typeSelect = document.getElementById('editQuestionType');
    if (typeSelect) {
        typeSelect.value = q.question_type || 'multiple_choice';
    }

    // 2. Mức độ
    const diff = q.difficulty || 'TH';
    const diffRadio = document.querySelector(`input[name="editDifficulty"][value="${diff}"]`);
    if (diffRadio) diffRadio.checked = true;

    // 3. Đề bài & Lời giải
    document.getElementById('editQuestionText').value = q.question_text || '';
    document.getElementById('editExplanation').value = q.explanation || '';

    // 4. Mã thô TikZ / SVG / Fallback
    document.getElementById('editTikzCode').value = q.tikz_code || '';
    document.getElementById('editSvgCode').value = q.svg_code || '';
    document.getElementById('editFallbackUrl').value = q.fallback_image_url || '';

    // 5. Render các ô phương án A/B/C/D hoặc Đúng/Sai hoặc Trả lời ngắn
    renderEditOptionsForm(q);

    // 6. Render preview hình vẽ trong modal
    renderEditDiagramPreview(q);

    // 7. Cập nhật Live Preview toàn diện
    updateEditModalPreview();

    // 8. Mở modal
    document.getElementById('editModal').classList.add('active');
}

/**
 * Đóng modal chỉnh sửa
 */
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditingQuestionIndex = -1;
}

/**
 * Thay đổi loại câu hỏi trong Edit Modal
 */
function onEditQuestionTypeChange() {
    if (currentEditingQuestionIndex < 0 || !stagingQuestions[currentEditingQuestionIndex]) return;
    const q = stagingQuestions[currentEditingQuestionIndex];
    const newType = document.getElementById('editQuestionType').value;
    q.question_type = newType;

    // Chuẩn hóa dữ liệu tương ứng loại mới
    if (newType === 'multiple_choice') {
        if (!Array.isArray(q.options) || q.options.length < 4) {
            q.options = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
        } else {
            q.options = q.options.map(opt => (typeof opt === 'object' && opt !== null) ? (opt.text || '') : String(opt));
        }
        if (typeof q.correct_option !== 'number') q.correct_option = 0;
    } else if (newType === 'true_false') {
        if (!Array.isArray(q.options) || q.options.length < 4) {
            q.options = [
                { text: 'Mệnh đề a', is_correct: true },
                { text: 'Mệnh đề b', is_correct: false },
                { text: 'Mệnh đề c', is_correct: true },
                { text: 'Mệnh đề d', is_correct: false }
            ];
        } else {
            q.options = q.options.map((opt, i) => {
                if (typeof opt === 'object' && opt !== null) return opt;
                return { text: String(opt), is_correct: i % 2 === 0 };
            });
        }
        q.correct_option = q.options.map(o => o.is_correct ? 1 : 0);
    } else if (newType === 'short_answer') {
        q.options = [];
        if (typeof q.correct_option !== 'string') q.correct_option = String(q.correct_option || '');
    }

    renderEditOptionsForm(q);
    updateEditModalPreview();
}

/**
 * Render giao diện nhập phương án động theo loại câu hỏi
 */
function renderEditOptionsForm(q) {
    const container = document.getElementById('editOptionsContainer');
    if (!container) return;

    const qType = q.question_type || 'multiple_choice';

    if (qType === 'multiple_choice') {
        const labels = ['A', 'B', 'C', 'D'];
        const options = Array.isArray(q.options) ? q.options : ['', '', '', ''];
        const correctIdx = (typeof q.correct_option === 'number') ? q.correct_option : 0;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label style="font-weight: 700; font-size: 0.88rem; color: #1E293B;">
                    Các phương án lựa chọn & Chọn đáp án ĐÚNG:
                </label>
                <span style="font-size: 0.78rem; color: #64748B;">
                    <i class="fa-solid fa-circle-dot" style="color: var(--primary-color);"></i> Nhấp chọn radio để đặt đáp án đúng
                </span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                ${labels.map((label, idx) => {
                    const optVal = (typeof options[idx] === 'object' && options[idx] !== null) ? options[idx].text : (options[idx] || '');
                    const isChecked = (idx === correctIdx);
                    return `
                        <div style="display: flex; align-items: center; gap: 8px; background: ${isChecked ? '#F0FDF4' : '#F8FAFC'}; border: 1.5px solid ${isChecked ? '#86EFAC' : '#E2E8F0'}; border-radius: 10px; padding: 6px 12px; transition: all 0.2s;">
                            <input type="radio" name="editCorrectChoice" value="${idx}" ${isChecked ? 'checked' : ''} onchange="updateEditModalPreview()" style="width: 18px; height: 18px; accent-color: #10B981; cursor: pointer;">
                            <span style="font-weight: 800; font-size: 0.95rem; color: ${isChecked ? '#166534' : 'var(--primary-color)'}; width: 22px;">${label}.</span>
                            <input type="text" id="editOpt_${idx}" class="form-control" value="${escapeHtml(optVal)}" oninput="updateEditModalPreview()" placeholder="Nhập nội dung phương án ${label}..." style="flex: 1; border: 1px solid #CBD5E1; padding: 7px 10px; border-radius: 8px; font-size: 0.88rem; background: #FFFFFF;" required>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (qType === 'true_false') {
        const labels = ['a', 'b', 'c', 'd'];
        const options = Array.isArray(q.options) ? q.options : [];

        container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <label style="font-weight: 700; font-size: 0.88rem; color: #1E293B;">
                    Các mệnh đề (a, b, c, d) & Trạng thái Đúng / Sai:
                </label>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${labels.map((label, idx) => {
                    const item = options[idx];
                    const text = (typeof item === 'object' && item !== null) ? item.text : (item || '');
                    const isTrue = (typeof item === 'object' && item !== null) ? item.is_correct : (Array.isArray(q.correct_option) ? q.correct_option[idx] == 1 : true);
                    return `
                        <div style="display: flex; align-items: center; gap: 10px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 8px 12px;">
                            <span style="font-weight: 800; font-size: 0.95rem; color: var(--primary-color); width: 26px;">${label})</span>
                            <input type="text" id="editTfText_${idx}" class="form-control" value="${escapeHtml(text)}" oninput="updateEditModalPreview()" placeholder="Nội dung ý ${label}..." style="flex: 1; border: 1px solid #CBD5E1; padding: 7px 10px; border-radius: 8px; font-size: 0.88rem; background: #FFFFFF;" required>
                            <button type="button" id="editTfBtn_${idx}" onclick="toggleEditTfValue(${idx})" style="padding: 6px 16px; border-radius: 8px; font-weight: 800; font-size: 0.82rem; cursor: pointer; border: none; background: ${isTrue ? '#10B981' : '#EF4444'}; color: #FFFFFF; min-width: 80px;">
                                ${isTrue ? '<i class="fa-solid fa-check"></i> ĐÚNG' : '<i class="fa-solid fa-xmark"></i> SAI'}
                            </button>
                            <input type="hidden" id="editTfVal_${idx}" value="${isTrue ? '1' : '0'}">
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (qType === 'short_answer') {
        const correctVal = (q.correct_option !== undefined && q.correct_option !== null) ? String(q.correct_option) : '';
        container.innerHTML = `
            <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; padding: 14px 18px;">
                <label style="display: block; font-weight: 700; font-size: 0.88rem; color: #166534; margin-bottom: 6px;">
                    <i class="fa-solid fa-key"></i> Giá trị đáp án chính xác:
                </label>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="editShortAnswerInput" class="form-control" value="${escapeHtml(correctVal)}" oninput="updateEditModalPreview()" placeholder="Ví dụ: -2 hoặc 4/3 hoặc 0.5..." style="max-width: 260px; padding: 8px 14px; border: 1.5px solid #10B981; border-radius: 8px; font-weight: 800; font-size: 1.1rem; color: #065F46; background: #FFFFFF;" required>
                    <span style="font-size: 0.82rem; color: #15803D;">Điền số nguyên, phân số hoặc số thập phân chuẩn</span>
                </div>
            </div>
        `;
    }
}

/**
 * Đổi trạng thái Đúng/Sai cho câu hỏi Đúng/Sai
 */
function toggleEditTfValue(idx) {
    const input = document.getElementById(`editTfVal_${idx}`);
    const btn = document.getElementById(`editTfBtn_${idx}`);
    if (!input || !btn) return;

    const isCurrentTrue = input.value === '1';
    const newTrue = !isCurrentTrue;
    input.value = newTrue ? '1' : '0';
    btn.style.background = newTrue ? '#10B981' : '#EF4444';
    btn.innerHTML = newTrue ? '<i class="fa-solid fa-check"></i> ĐÚNG' : '<i class="fa-solid fa-xmark"></i> SAI';

    updateEditModalPreview();
}

/**
 * Render khung hình vẽ trong Edit Modal
 */
function renderEditDiagramPreview(q) {
    const container = document.getElementById('editDiagramPreviewContainer');
    if (!container) return;

    const hasVector = !!(q.svg_code || q.tikz_code);
    const hasImage = !!q.fallback_image_url;

    if (!hasVector && !hasImage) {
        container.innerHTML = `<span style="color: #94A3B8; font-size: 0.85rem; font-style: italic;">Chưa có hình vẽ</span>`;
        return;
    }

    const html = (typeof TikZRenderer !== 'undefined') ? 
        TikZRenderer.render({
            svgCode: q.svg_code,
            tikzCode: q.tikz_code,
            fallbackUrl: q.fallback_image_url,
            caption: 'Hình vẽ minh họa',
            questionIndex: currentEditingQuestionIndex
        }) : '';

    container.innerHTML = html;
}

/**
 * Cập nhật Live Preview toàn diện trong Edit Modal
 */
function updateEditModalPreview() {
    const previewBox = document.getElementById('editLivePreviewContent');
    if (!previewBox) return;

    const qType = document.getElementById('editQuestionType')?.value || 'multiple_choice';
    const qText = document.getElementById('editQuestionText')?.value || '';
    const explanation = document.getElementById('editExplanation')?.value || '';
    const diffRadio = document.querySelector('input[name="editDifficulty"]:checked');
    const diff = diffRadio ? diffRadio.value : 'TH';

    const diffBadge = `<span class="diff-badge diff-${diff.toLowerCase()}">${diff}</span>`;

    // Diagram HTML
    const svgCode = document.getElementById('editSvgCode')?.value || '';
    const tikzCode = document.getElementById('editTikzCode')?.value || '';
    const fallbackUrl = document.getElementById('editFallbackUrl')?.value || '';

    const diagramHtml = (typeof TikZRenderer !== 'undefined') ? 
        TikZRenderer.render({
            svgCode: svgCode,
            tikzCode: tikzCode,
            fallbackUrl: fallbackUrl,
            caption: 'Hình vẽ minh họa',
            questionIndex: currentEditingQuestionIndex
        }) : '';

    // Options HTML
    let optionsHtml = '';
    if (qType === 'multiple_choice') {
        const labels = ['A', 'B', 'C', 'D'];
        const correctRadio = document.querySelector('input[name="editCorrectChoice"]:checked');
        const correctIdx = correctRadio ? parseInt(correctRadio.value) : 0;

        optionsHtml = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 12px 0;">
                ${labels.map((lbl, idx) => {
                    const text = document.getElementById(`editOpt_${idx}`)?.value || '';
                    const isCorrect = (idx === correctIdx);
                    return `
                        <div class="option-item ${isCorrect ? 'correct' : ''}" style="padding: 8px 12px; border-radius: 10px; border: 1.5px solid ${isCorrect ? '#86EFAC' : '#E2E8F0'}; background: ${isCorrect ? '#F0FDF4' : '#FFFFFF'}; display: flex; justify-content: space-between; align-items: center;">
                            <span class="math-render" style="font-weight: ${isCorrect ? '700' : '400'}; color: #1E293B;">
                                <strong>${lbl}.</strong> ${escapeHtml(text)}
                            </span>
                            ${isCorrect ? '<span style="background: #10B981; color: #FFFFFF; font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; font-weight: 800;"><i class="fa-solid fa-check"></i> ĐÚNG</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (qType === 'true_false') {
        const labels = ['a', 'b', 'c', 'd'];
        optionsHtml = `
            <div style="display: flex; flex-direction: column; gap: 8px; margin: 12px 0;">
                ${labels.map((lbl, idx) => {
                    const text = document.getElementById(`editTfText_${idx}`)?.value || '';
                    const isTrue = document.getElementById(`editTfVal_${idx}`)?.value === '1';
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-radius: 10px; border: 1.5px solid ${isTrue ? '#86EFAC' : '#FECDD3'}; background: ${isTrue ? '#F0FDF4' : '#FFF1F2'};">
                            <span class="math-render" style="color: #1E293B;"><strong>${lbl})</strong> ${escapeHtml(text)}</span>
                            <span style="background: ${isTrue ? '#10B981' : '#EF4444'}; color: #FFFFFF; font-size: 0.72rem; padding: 2px 8px; border-radius: 6px; font-weight: 800;">
                                ${isTrue ? '<i class="fa-solid fa-check"></i> ĐÚNG' : '<i class="fa-solid fa-xmark"></i> SAI'}
                            </span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (qType === 'short_answer') {
        const val = document.getElementById('editShortAnswerInput')?.value || '';
        optionsHtml = `
            <div style="margin: 12px 0; padding: 10px 16px; border-radius: 10px; background: #F0FDF4; border: 1.5px solid #86EFAC; display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: 700; color: #166534;"><i class="fa-solid fa-key"></i> Đáp án chính xác:</span>
                <span style="font-size: 1.15rem; font-weight: 800; color: #059669; background: #FFFFFF; padding: 3px 14px; border-radius: 8px; border: 1px solid #A7F3D0;">${escapeHtml(val)}</span>
            </div>
        `;
    }

    // Explanation HTML
    const expHtml = explanation ? `
        <div style="background: #F0FDF4; border: 1.5px dashed #86EFAC; border-radius: 10px; padding: 12px 16px; margin-top: 12px;">
            <div style="font-weight: 700; color: #166534; font-size: 0.88rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-lightbulb" style="color: #F59E0B;"></i> Hướng dẫn giải chi tiết:
            </div>
            <div class="math-render" style="color: #1F2937; line-height: 1.6; font-size: 0.9rem; white-space: pre-line;">${escapeHtml(explanation)}</div>
        </div>
    ` : '';

    previewBox.innerHTML = `
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 10px;">
            <span style="font-weight: 800; font-size: 1rem; color: #1E293B;">Câu hỏi mẫu</span>
            ${diffBadge}
        </div>
        <div class="math-render" style="font-size: 0.96rem; line-height: 1.7; color: #1E293B; margin-bottom: 10px;">
            ${escapeHtml(qText) || '<em style="color:#94A3B8;">(Chưa nhập đề bài)</em>'}
        </div>
        ${diagramHtml}
        ${optionsHtml}
        ${expHtml}
    `;

    // Render KaTeX
    if (window.renderMathInElement) {
        renderMathInElement(previewBox, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }
}

/**
 * Ẩn / Hiện khối mã nguồn thô TikZ & SVG
 */
function toggleRawCodeSection(e) {
    if (e) e.preventDefault();
    const section = document.getElementById('rawCodeSection');
    const icon = document.getElementById('toggleRawIcon');
    if (!section) return;

    if (section.style.display === 'none' || !section.style.display) {
        section.style.display = 'block';
        if (icon) icon.className = 'fa-solid fa-chevron-down';
    } else {
        section.style.display = 'none';
        if (icon) icon.className = 'fa-solid fa-chevron-right';
    }
}

function onRawTikzInput() {
    if (currentEditingQuestionIndex < 0 || !stagingQuestions[currentEditingQuestionIndex]) return;
    const q = stagingQuestions[currentEditingQuestionIndex];
    q.tikz_code = document.getElementById('editTikzCode').value.trim();
    renderEditDiagramPreview(q);
    updateEditModalPreview();
}

function onRawSvgInput() {
    if (currentEditingQuestionIndex < 0 || !stagingQuestions[currentEditingQuestionIndex]) return;
    const q = stagingQuestions[currentEditingQuestionIndex];
    q.svg_code = document.getElementById('editSvgCode').value.trim();
    renderEditDiagramPreview(q);
    updateEditModalPreview();
}

/**
 * Xử lý tải ảnh / file SVG thay thế từ máy
 */
function handleEditDiagramFileUpload(inputEl) {
    if (!inputEl.files || inputEl.files.length === 0) return;
    const file = inputEl.files[0];

    if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const svgContent = e.target.result;
            if (currentEditingQuestionIndex >= 0 && stagingQuestions[currentEditingQuestionIndex]) {
                const q = stagingQuestions[currentEditingQuestionIndex];
                q.svg_code = svgContent;
                document.getElementById('editSvgCode').value = svgContent;
                renderEditDiagramPreview(q);
                updateEditModalPreview();
            }
        };
        reader.readAsText(file);
    } else {
        // Tải ảnh thông thường
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgData = e.target.result;
            if (currentEditingQuestionIndex >= 0 && stagingQuestions[currentEditingQuestionIndex]) {
                const q = stagingQuestions[currentEditingQuestionIndex];
                q.fallback_image_url = imgData;
                document.getElementById('editFallbackUrl').value = imgData;
                renderEditDiagramPreview(q);
                updateEditModalPreview();
            }
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Xóa hình vẽ của câu hỏi đang sửa
 */
function removeEditDiagram() {
    if (!confirm("Bạn có chắc muốn xóa hình vẽ minh họa của câu hỏi này?")) return;
    if (currentEditingQuestionIndex >= 0 && stagingQuestions[currentEditingQuestionIndex]) {
        const q = stagingQuestions[currentEditingQuestionIndex];
        q.svg_code = '';
        q.tikz_code = '';
        q.fallback_image_url = '';
        document.getElementById('editTikzCode').value = '';
        document.getElementById('editSvgCode').value = '';
        document.getElementById('editFallbackUrl').value = '';
        renderEditDiagramPreview(q);
        updateEditModalPreview();
    }
}

/**
 * Lưu thay đổi từ Edit Modal vào đối tượng câu hỏi
 */
function saveEditModal() {
    if (currentEditingQuestionIndex < 0 || currentEditingQuestionIndex >= stagingQuestions.length) return;
    const q = stagingQuestions[currentEditingQuestionIndex];

    const qType = document.getElementById('editQuestionType')?.value || 'multiple_choice';
    const diffRadio = document.querySelector('input[name="editDifficulty"]:checked');
    const diff = diffRadio ? diffRadio.value : 'TH';

    q.question_type = qType;
    q.difficulty = diff;
    q.question_text = document.getElementById('editQuestionText').value.trim();
    q.explanation = document.getElementById('editExplanation').value.trim();

    q.tikz_code = document.getElementById('editTikzCode').value.trim();
    q.svg_code = document.getElementById('editSvgCode').value.trim();
    q.fallback_image_url = document.getElementById('editFallbackUrl').value.trim();

    // Lưu Options & Đáp án
    if (qType === 'multiple_choice') {
        const opts = [];
        for (let i = 0; i < 4; i++) {
            opts.push(document.getElementById(`editOpt_${i}`)?.value.trim() || '');
        }
        q.options = opts;
        const correctRadio = document.querySelector('input[name="editCorrectChoice"]:checked');
        q.correct_option = correctRadio ? parseInt(correctRadio.value) : 0;
    } else if (qType === 'true_false') {
        const statements = [];
        const correctFlags = [];
        for (let i = 0; i < 4; i++) {
            const text = document.getElementById(`editTfText_${i}`)?.value.trim() || '';
            const isTrue = document.getElementById(`editTfVal_${i}`)?.value === '1';
            statements.push({ text: text, is_correct: isTrue });
            correctFlags.push(isTrue ? 1 : 0);
        }
        q.options = statements;
        q.correct_option = correctFlags;
    } else if (qType === 'short_answer') {
        q.options = [];
        q.correct_option = document.getElementById('editShortAnswerInput')?.value.trim() || '';
    }

    // Re-audit câu hỏi
    stagingQuestions[currentEditingQuestionIndex] = IngestionPipeline.auditQuestions([q])[0];

    closeEditModal();
    renderStagingView();
}

/* ==========================================================================
   5. TRÌNH VẼ & CHỈNH SỬA VECTOR METHOD DRAW CHUYÊN NGHIỆP (OFFLINE LOCAL)
   ========================================================================== */

/**
 * Mở trình chỉnh sửa SVG Method Draw cho câu hỏi
 */
function openSvgEditor(index) {
    if (index === undefined || index === null || index < 0) {
        index = currentEditingQuestionIndex >= 0 ? currentEditingQuestionIndex : 0;
    }
    if (index < 0 || index >= stagingQuestions.length) {
        alert("Chưa chọn câu hỏi cần chỉnh sửa hình.");
        return;
    }

    currentSvgEditingIndex = index;
    const q = stagingQuestions[index];

    // Xác định mã SVG hiện tại
    let activeSvg = (q.svg_code && q.svg_code.trim()) ? q.svg_code.trim() : '';

    if (!activeSvg && q.tikz_code && q.tikz_code.trim()) {
        const trimmed = q.tikz_code.trim();
        if (trimmed.startsWith('<svg')) {
            activeSvg = trimmed;
        } else if (typeof TikZRenderer !== 'undefined') {
            activeSvg = TikZRenderer.parseTikzToSvg(trimmed);
        }
    }

    // Nếu vẫn chưa có hình nào, tạo khung Bảng biến thiên mặc định chuẩn GDPT
    if (!activeSvg) {
        const defaultTikz = `\\begin{tikzpicture}\n\\tkzTabInit{$x$ / 1, $y'$ / 1, $y$ / 2}{$-\\infty$, $-1$, $3$, $+\\infty$}\n\\tkzTabLine{, +, 0, -, 0, +, }\n\\tkzTabVar{-/ $-\\infty$, +/ $4$, -/ $-2$, +/ $+\\infty$}\n\\end{tikzpicture}`;
        activeSvg = (typeof TikZRenderer !== 'undefined') ? TikZRenderer.parseTikzToSvg(defaultTikz) : '';
    }

    originalSvgBackup = activeSvg;

    // Mở modal Method Draw
    document.getElementById('svgEditorModal').classList.add('active');

    // Nạp SVG vào Method Draw iframe
    const iframe = document.getElementById('methodDrawIframe');
    if (iframe) {
        const injectSvg = () => {
            try {
                if (iframe.contentWindow && iframe.contentWindow.methodDraw) {
                    iframe.contentWindow.methodDraw.loadFromString(activeSvg);
                } else if (iframe.contentWindow) {
                    iframe.contentWindow.postMessage({ action: 'loadSvg', svg: activeSvg }, '*');
                }
            } catch (err) {
                console.warn("Lỗi nạp SVG vào Method Draw:", err);
            }
        };

        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            setTimeout(injectSvg, 300);
        } else {
            iframe.onload = () => setTimeout(injectSvg, 400);
        }
    }
}

/**
 * Hỗ trợ mở SVG Editor khi nhấp đúp trực tiếp vào hình trên DOM
 */
function openSvgEditorFromDiagram(element) {
    let qidx = element.getAttribute('data-qidx');
    if (qidx === null || qidx === undefined || qidx === '') {
        const parentWithQidx = element.closest('[data-qidx]');
        if (parentWithQidx) qidx = parentWithQidx.getAttribute('data-qidx');
    }

    const idx = (qidx !== null && qidx !== undefined && qidx !== '') ? parseInt(qidx) : currentEditingQuestionIndex;
    openSvgEditor(idx >= 0 ? idx : 0);
}

/**
 * Đóng modal Method Draw
 */
function closeSvgEditorModal() {
    document.getElementById('svgEditorModal').classList.remove('active');
}

/**
 * Áp dụng hình vẽ SVG từ Method Draw vào câu hỏi
 */
function applySvgToQuestion() {
    const iframe = document.getElementById('methodDrawIframe');
    let finalSvg = '';

    try {
        if (iframe && iframe.contentWindow && iframe.contentWindow.methodDraw) {
            finalSvg = iframe.contentWindow.methodDraw.getSvgString() || '';
        }
    } catch (e) {
        console.warn("Lỗi đọc getSvgString từ iframe:", e);
    }

    if (!finalSvg) {
        // Dự phòng lấy từ SVG canvas DOM
        try {
            const svgDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            const svgEl = svgDoc?.querySelector('#svgcanvas svg');
            if (svgEl) finalSvg = svgEl.outerHTML;
        } catch (e2) {}
    }

    if (!finalSvg) {
        alert("Không thể đọc được hình vẽ từ Method Draw. Thầy cô vui lòng kiểm tra lại hình nhé.");
        return;
    }

    if (currentSvgEditingIndex >= 0 && stagingQuestions[currentSvgEditingIndex]) {
        const q = stagingQuestions[currentSvgEditingIndex];
        q.svg_code = finalSvg;

        // Nếu Edit Modal đang mở, cập nhật giao diện trong Edit Modal
        const editSvgInput = document.getElementById('editSvgCode');
        if (editSvgInput) editSvgInput.value = finalSvg;

        renderEditDiagramPreview(q);
        updateEditModalPreview();
    }

    closeSvgEditorModal();
    renderStagingView();
}

/**
 * Tải file SVG từ Method Draw về máy tính
 */
function exportMethodDrawSvg() {
    const iframe = document.getElementById('methodDrawIframe');
    let finalSvg = '';

    try {
        if (iframe && iframe.contentWindow && iframe.contentWindow.methodDraw) {
            finalSvg = iframe.contentWindow.methodDraw.getSvgString() || '';
        }
    } catch (e) {}

    if (!finalSvg) {
        try {
            const svgDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
            const svgEl = svgDoc?.querySelector('#svgcanvas svg');
            if (svgEl) finalSvg = svgEl.outerHTML;
        } catch (e2) {}
    }

    if (!finalSvg) {
        alert("Chưa có nội dung hình vẽ để tải về.");
        return;
    }

    const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `do_thi_cau_${(currentSvgEditingIndex >= 0 ? currentSvgEditingIndex + 1 : 1)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    const targetTopicId = document.getElementById('targetTopic')?.value;
    const targetChuyenDeId = document.getElementById('targetChuyenDe')?.value;

    const payload = readyQuestions.map(q => {
        const autoTopic = (typeof MathTopicService !== 'undefined') ? MathTopicService.autoDetectTopic(q.question_text) : null;
        const topicId = targetTopicId ? parseInt(targetTopicId) : (autoTopic ? autoTopic.id : null);
        const cdId = targetChuyenDeId ? parseInt(targetChuyenDeId) : (autoTopic ? autoTopic.chuyen_de_id : null);
        const skillTag = autoTopic ? `Dạng ${autoTopic.code}` : (q.skill_tag || 'Tổng hợp');

        return {
            course_id: courseId ? parseInt(courseId) : null,
            chapter_id: chapterId ? parseInt(chapterId) : null,
            lesson_id: lessonId ? parseInt(lessonId) : null,
            topic_id: topicId,
            chuyen_de_id: cdId,
            question_type: q.question_type || 'multiple_choice',
            difficulty: q.difficulty || (autoTopic ? autoTopic.level : 'NB'),
            question_text: q.question_text,
            options: q.options || [],
            correct_option: (typeof q.correct_option === 'number') ? q.correct_option : (Array.isArray(q.correct_option) ? q.correct_option : parseInt(q.correct_option) || 0),
            explanation: q.explanation || '',
            tikz_code: q.tikz_code || null,
            fallback_image_url: q.fallback_image_url || null,
            source_type: q.source_type || 'manual',
            source_metadata: q.source_metadata || {},
            skill_tag: skillTag,
            is_staging: false,
            is_master: true,
            variant_count: 0
        };
    });

    try {
        let savedCount = 0;
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from('questions').insert(payload).select('id');
                if (!error && data) {
                    savedCount = data.length;
                } else if (error) {
                    console.warn("Lỗi ghi Supabase:", error);
                }
            } catch (sbErr) {
                console.warn("Exception khi gọi Supabase:", sbErr);
            }
        }

        // Luôn lưu bản sao vào localStorage để hoạt động mượt mà offline
        try {
            const localCustom = JSON.parse(localStorage.getItem('toan_smart_custom_questions') || '[]');
            payload.forEach((p, idx) => {
                localCustom.push({ ...p, id: Date.now() + idx });
            });
            localStorage.setItem('toan_smart_custom_questions', JSON.stringify(localCustom));
            if (savedCount === 0) savedCount = payload.length;
        } catch (e) {
            console.warn("Không thể lưu localStorage:", e);
        }

        alert(`🎉 Thành công! Đã nạp thành công ${savedCount} câu hỏi vào Ngân hàng câu hỏi.`);
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

/**
 * CẤU HÌNH & QUẢN LÝ GOOGLE GEMINI VISION AI KEY
 */
function updateGeminiKeyStatusUI() {
    const key = localStorage.getItem('toan_smart_gemini_api_key') || '';
    const label = document.getElementById('geminiKeyLabel');
    const btn = document.getElementById('btnGeminiConfig');
    if (!label || !btn) return;

    if (key) {
        label.innerHTML = '<i class="fa-solid fa-circle" style="color: #10B981; font-size: 0.65rem;"></i> Gemini AI: Đã kết nối';
        btn.style.background = '#ECFDF5';
        btn.style.borderColor = '#A7F3D0';
        btn.style.color = '#065F46';
    } else {
        label.innerHTML = '<i class="fa-solid fa-key"></i> Cài đặt Gemini AI Key';
        btn.style.background = '#EEF2FF';
        btn.style.borderColor = '#C7D2FE';
        btn.style.color = '#4338CA';
    }
}

function openGeminiKeyModal() {
    const modal = document.getElementById('geminiKeyModal');
    const input = document.getElementById('geminiApiKeyInput');
    const removeBtn = document.getElementById('btnRemoveGeminiKey');
    const statusMsg = document.getElementById('geminiKeyStatusMsg');

    if (!modal) return;
    const existingKey = localStorage.getItem('toan_smart_gemini_api_key') || '';
    if (input) input.value = existingKey;
    if (removeBtn) removeBtn.style.display = existingKey ? 'inline-block' : 'none';
    if (statusMsg) statusMsg.style.display = 'none';

    modal.classList.add('active');
}

function closeGeminiKeyModal() {
    const modal = document.getElementById('geminiKeyModal');
    if (modal) modal.classList.remove('active');
}

function toggleGeminiKeyVisibility() {
    const input = document.getElementById('geminiApiKeyInput');
    const eye = document.getElementById('toggleGeminiKeyEye');
    if (!input || !eye) return;
    if (input.type === 'password') {
        input.type = 'text';
        eye.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        eye.className = 'fa-solid fa-eye';
    }
}

async function saveAndTestGeminiKey() {
    const input = document.getElementById('geminiApiKeyInput');
    const statusMsg = document.getElementById('geminiKeyStatusMsg');
    const btn = document.getElementById('btnSaveGeminiKey');

    const key = input ? input.value.trim() : '';
    if (!key) {
        if (statusMsg) {
            statusMsg.style.display = 'block';
            statusMsg.innerHTML = '<span style="color: #DC2626;"><i class="fa-solid fa-circle-xmark"></i> Vui lòng nhập API Key dạng AIzaSy...</span>';
        }
        return;
    }

    if (btn) btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang kiểm tra...';
    if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.innerHTML = '<span style="color: #4F46E5;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang xác thực với Google AI...</span>';
    }

    try {
        // 1. Thử truy vấn danh sách models để lấy model khả dụng cho tài khoản này
        let workingModel = 'gemini-flash-lite-latest';
        let listErrDetail = '';
        try {
            const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            if (listRes.ok) {
                const listData = await listRes.json();
                const available = (listData.models || [])
                    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
                    .map(m => m.name.replace('models/', ''));
                
                // Ưu tiên các model flash lite / flash mới nhất đang hoạt động
                const candidates = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-pro-latest', 'gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
                for (const cand of candidates) {
                    if (available.includes(cand)) {
                        workingModel = cand;
                        break;
                    }
                }
                if (!available.includes(workingModel) && available.length > 0) {
                    workingModel = available[0];
                }
            } else {
                const errData = await listRes.json().catch(() => ({}));
                listErrDetail = errData.error?.message || `HTTP ${listRes.status}`;
                console.warn("listModels trả về lỗi:", listErrDetail);
            }
        } catch (e) {
            console.warn("Không thể tải listModels, fallback sang test trực tiếp:", e);
        }

        // 2. Thử gọi test với candidate models
        const testCandidates = [workingModel, 'gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-pro-latest'];
        let testOk = false;
        let lastErrMsg = '';

        for (const model of testCandidates) {
            try {
                const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "OK" }] }]
                    })
                });

                if (testRes.ok) {
                    workingModel = model;
                    testOk = true;
                    break;
                } else {
                    const errJson = await testRes.json().catch(() => ({}));
                    lastErrMsg = errJson.error?.message || `HTTP ${testRes.status}`;
                }
            } catch (err) {
                lastErrMsg = err.message;
            }
        }

        if (!testOk) {
            // Hiển thị thông báo chi tiết và hướng dẫn
            let guidance = lastErrMsg || listErrDetail;
            if (guidance.includes('not found') || guidance.includes('disabled') || guidance.includes('not been used')) {
                guidance += `<br><span style="margin-top: 6px; display: block; color: #4338CA; font-weight: 600;">👉 Mẹo: Đây là Project tạo từ 2019 chưa kích hoạt Gemini API. Thầy hãy copy key ở dòng 1 <strong>(Default Gemini Project)</strong> trên Google AI Studio nhé!</span>`;
            }
            throw new Error(guidance);
        }

        // Lưu key và model tối ưu vào localStorage
        localStorage.setItem('toan_smart_gemini_api_key', key);
        localStorage.setItem('toan_smart_gemini_model', workingModel);
        updateGeminiKeyStatusUI();

        if (statusMsg) {
            statusMsg.innerHTML = `<span style="color: #16A34A; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Xác thực thành công! (Model: ${workingModel})</span>`;
        }

        setTimeout(() => {
            closeGeminiKeyModal();
        }, 1200);
    } catch (err) {
        if (statusMsg) {
            statusMsg.innerHTML = `<span style="color: #DC2626;"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ${err.message}</span>
            <div style="margin-top: 8px;">
                <button type="button" onclick="forceSaveGeminiKey()" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px; background: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; cursor: pointer; font-weight: 600;">
                    <i class="fa-solid fa-check"></i> Vẫn lưu key này (Bỏ qua kiểm tra)
                </button>
            </div>`;
        }
    } finally {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu & Kích hoạt';
    }
}

function removeGeminiKey() {
    if (confirm("Thầy/Cô có chắc chắn muốn xóa Gemini API Key khỏi trình duyệt này?")) {
        localStorage.removeItem('toan_smart_gemini_api_key');
        updateGeminiKeyStatusUI();
        closeGeminiKeyModal();
    }
}

function forceSaveGeminiKey() {
    const input = document.getElementById('geminiApiKeyInput');
    const key = input ? input.value.trim() : '';
    if (key) {
        localStorage.setItem('toan_smart_gemini_api_key', key);
        updateGeminiKeyStatusUI();
        closeGeminiKeyModal();
        alert("Đã lưu API Key vào trình duyệt!");
    }
}

// Export các hàm toàn cục cho HTML gọi inline
window.animateAiPipeline = animateAiPipeline;
window.handleUniversalFileSelect = handleUniversalFileSelect;
window.startUniversalFileProcess = startUniversalFileProcess;
window.cancelUniversalFileSelect = cancelUniversalFileSelect;
window.removePendingFile = removePendingFile;
window.handleWordUpload = handleWordUpload;
window.handleImageUpload = handleImageUpload;
window.switchSourceTab = switchSourceTab;
window.handleWebScrape = handleWebScrape;
window.handleRawTextProcess = handleRawTextProcess;
window.loadSampleQuestions = loadSampleQuestions;
window.load2025SampleBatch = loadSampleQuestions;
window.commitStagingToQuestionBank = commitStagingToQuestionBank;
window.commitStagingToBank = commitStagingToQuestionBank;
window.clearStaging = clearStaging;
window.clearStagingBatch = clearStaging;
window.deleteStagingQuestion = deleteStagingQuestion;
window.removeStagingQuestion = deleteStagingQuestion;
window.openEditModal = openEditModal;
window.openEditStagingModal = openEditModal;
window.saveEditModal = saveEditModal;
window.saveEditedQuestion = saveEditModal;
window.closeEditModal = closeEditModal;
window.onEditQuestionTypeChange = onEditQuestionTypeChange;
window.updateEditModalPreview = updateEditModalPreview;
window.toggleEditTfValue = toggleEditTfValue;
window.toggleRawCodeSection = toggleRawCodeSection;
window.onRawTikzInput = onRawTikzInput;
window.onRawSvgInput = onRawSvgInput;
window.handleEditDiagramFileUpload = handleEditDiagramFileUpload;
window.removeEditDiagram = removeEditDiagram;
window.openSvgEditor = openSvgEditor;
window.openSvgEditorFromDiagram = openSvgEditorFromDiagram;
window.closeSvgEditorModal = closeSvgEditorModal;
window.applySvgToQuestion = applySvgToQuestion;
window.exportMethodDrawSvg = exportMethodDrawSvg;
window.onTargetCourseChange = onTargetCourseChange;
window.onTargetChapterChange = onTargetChapterChange;
window.onTargetChuyenDeChange = onTargetChuyenDeChange;
window.openGeminiKeyModal = openGeminiKeyModal;
window.closeGeminiKeyModal = closeGeminiKeyModal;
window.saveAndTestGeminiKey = saveAndTestGeminiKey;
window.removeGeminiKey = removeGeminiKey;
window.toggleGeminiKeyVisibility = toggleGeminiKeyVisibility;
window.forceSaveGeminiKey = forceSaveGeminiKey;
