// ==========================================================
// TOÁN SMART - QUẢN LÝ NỘI DUNG HỌC LIỆU ĐA NĂNG (v1.3.1)
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);

    // 1. Lấy thông số từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const materialIdParam = parseInt(urlParams.get('material_id')) || parseInt(urlParams.get('id'));
    const fromParam = urlParams.get('from') || 'study';

    // Biến trạng thái
    let currentMaterialId = materialIdParam;
    let currentMaterial = null;
    let currentCourseId = 1;
    let currentLessonId = null;

    let cachedCourses = [];
    let cachedChapters = [];
    let cachedLessons = [];
    let cachedMaterials = [];
    let allSourceQuestions = [];
    let selectedQuestions = [];

    // Nút Quay lại thông minh
    const manageBackBtn = document.getElementById('manageBackBtn');
    if (manageBackBtn) {
        manageBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (fromParam === 'study' && currentMaterialId) {
                window.location.href = `study.html?id=${currentCourseId}&material_id=${currentMaterialId}`;
            } else if (fromParam === 'lesson' && currentLessonId) {
                window.location.href = `lesson.html?id=${currentCourseId}&lesson_id=${currentLessonId}`;
            } else {
                window.location.href = `course-detail.html?id=${currentCourseId}`;
            }
        });
    }

    // 2. Tải dữ liệu ban đầu
    await initMaterialManager();

    async function initMaterialManager() {
        if (isOnline) {
            try {
                const [coursesRes, chaptersRes, lessonsRes, materialsRes] = await Promise.all([
                    supabaseClient.from('courses').select('id, title').order('id'),
                    supabaseClient.from('chapters').select('id, course_id, title').order('order_index'),
                    supabaseClient.from('lessons').select('id, chapter_id, title').order('order_index'),
                    supabaseClient.from('materials').select('*').order('order_index')
                ]);

                cachedCourses = coursesRes.data || [];
                cachedChapters = chaptersRes.data || [];
                cachedLessons = lessonsRes.data || [];
                cachedMaterials = materialsRes.data || [];
            } catch (err) {
                console.error("Lỗi tải dữ liệu Supabase:", err);
                loadOfflineCache();
            }
        } else {
            loadOfflineCache();
        }

        // Nếu chưa chỉ định material_id hoặc không tìm thấy, tự động chọn học liệu Quiz đầu tiên
        if (!currentMaterialId && cachedMaterials.length > 0) {
            const defaultQuiz = cachedMaterials.find(m => m.type === 'quiz' || m.type === 'exercise') || cachedMaterials[0];
            if (defaultQuiz) {
                currentMaterialId = defaultQuiz.id;
            }
        }

        if (currentMaterialId) {
            currentMaterial = cachedMaterials.find(m => m.id == currentMaterialId);
            if (currentMaterial) {
                currentLessonId = currentMaterial.lesson_id;
                const foundLesson = cachedLessons.find(l => l.id == currentLessonId);
                if (foundLesson) {
                    const foundChapter = cachedChapters.find(ch => ch.id == foundLesson.chapter_id);
                    if (foundChapter) {
                        currentCourseId = foundChapter.course_id;
                    }
                }
            }
        }

        // Đổ dữ liệu vào các select lọc
        populateFilterDropdowns();

        // Bind sự kiện nút mở Modal tạo câu hỏi
        setupModalQuestionHandlers();

        // Hiển thị giao diện theo loại học liệu
        renderHeaderAndSections();
    }

    function loadOfflineCache() {
        cachedCourses = JSON.parse(localStorage.getItem('db_courses')) || [];
        cachedChapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
        cachedLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
        cachedMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
    }

    // 3. Đổ dữ liệu vào các Select bộ lọc
    function populateFilterDropdowns() {
        const qbFilterCourse = document.getElementById('qbFilterCourse');
        const qbFilterChapter = document.getElementById('qbFilterChapter');
        const qbFilterLesson = document.getElementById('qbFilterLesson');
        const qbFilterMaterial = document.getElementById('qbFilterMaterial');

        if (qbFilterCourse) {
            qbFilterCourse.innerHTML = `<option value="">Tất cả khóa học</option>` + 
                cachedCourses.map(c => `<option value="${c.id}" ${c.id == currentCourseId ? 'selected' : ''}>${c.title}</option>`).join('');
            
            qbFilterCourse.onchange = (e) => {
                const cId = e.target.value;
                filterChaptersByCourse(cId);
            };
        }

        if (qbFilterChapter) {
            filterChaptersByCourse(currentCourseId);
            qbFilterChapter.onchange = (e) => {
                const chId = e.target.value;
                filterLessonsByChapter(chId);
            };
        }

        if (qbFilterLesson) {
            filterLessonsByChapter(currentLessonId ? (cachedLessons.find(l => l.id == currentLessonId)?.chapter_id) : '');
            qbFilterLesson.onchange = (e) => {
                const lId = e.target.value;
                filterMaterialsByLesson(lId);
            };
        }

        if (qbFilterMaterial) {
            filterMaterialsByLesson(currentLessonId);
            qbFilterMaterial.onchange = (e) => {
                currentMaterialId = parseInt(e.target.value);
                currentMaterial = cachedMaterials.find(m => m.id == currentMaterialId);
                renderHeaderAndSections();
            };
        }

        // Đổ dữ liệu vào các select trong Modal Form tạo câu hỏi
        populateModalFormDropdowns();
    }

    function filterChaptersByCourse(courseId) {
        const qbFilterChapter = document.getElementById('qbFilterChapter');
        if (!qbFilterChapter) return;
        const filtered = courseId ? cachedChapters.filter(ch => ch.course_id == courseId) : cachedChapters;
        qbFilterChapter.innerHTML = `<option value="">Tất cả chương</option>` + 
            filtered.map(ch => `<option value="${ch.id}">${ch.title}</option>`).join('');
    }

    function filterLessonsByChapter(chapterId) {
        const qbFilterLesson = document.getElementById('qbFilterLesson');
        if (!qbFilterLesson) return;
        const filtered = chapterId ? cachedLessons.filter(l => l.chapter_id == chapterId) : cachedLessons;
        qbFilterLesson.innerHTML = `<option value="">Tất cả bài học</option>` + 
            filtered.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
    }

    function filterMaterialsByLesson(lessonId) {
        const qbFilterMaterial = document.getElementById('qbFilterMaterial');
        if (!qbFilterMaterial) return;
        const filtered = lessonId ? cachedMaterials.filter(m => m.lesson_id == lessonId) : cachedMaterials;
        qbFilterMaterial.innerHTML = `<option value="">Tất cả học liệu</option>` + 
            filtered.map(m => `<option value="${m.id}" ${m.id == currentMaterialId ? 'selected' : ''}>${m.title} (${(m.type || 'video').toUpperCase()})</option>`).join('');
    }

    function populateModalFormDropdowns() {
        const modalFormCourse = document.getElementById('modalFormCourse');
        const modalFormChapter = document.getElementById('modalFormChapter');
        const modalFormLesson = document.getElementById('modalFormLesson');

        if (modalFormCourse) {
            modalFormCourse.innerHTML = `<option value="">Chọn khóa học</option>` + 
                cachedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
            modalFormCourse.onchange = (e) => {
                const cId = e.target.value;
                if (modalFormChapter) {
                    const filteredCh = cId ? cachedChapters.filter(ch => ch.course_id == cId) : cachedChapters;
                    modalFormChapter.innerHTML = `<option value="">Chọn chương</option>` + 
                        filteredCh.map(ch => `<option value="${ch.id}">${ch.title}</option>`).join('');
                }
            };
        }
    }

    // 4. Hiển thị phần quản lý tương ứng với Loại học liệu (`type`)
    function renderHeaderAndSections() {
        const manageTitle = document.getElementById('manageTitle');
        const manageBreadcrumb = document.getElementById('manageBreadcrumb');

        const videoSection = document.getElementById('videoManagerSection');
        const pdfSection = document.getElementById('pdfManagerSection');
        const quizSection = document.getElementById('quizManagerSection');
        const textSection = document.getElementById('textManagerSection');

        // Ẩn tất cả các section trước
        if (videoSection) videoSection.style.display = 'none';
        if (pdfSection) pdfSection.style.display = 'none';
        if (quizSection) quizSection.style.display = 'none';
        if (textSection) textSection.style.display = 'none';

        if (!currentMaterial && cachedMaterials.length > 0) {
            currentMaterial = cachedMaterials[0];
            currentMaterialId = currentMaterial.id;
        }

        if (!currentMaterial) {
            manageTitle.innerHTML = `<i class="fa-solid fa-layer-group" style="color: var(--accent-color);"></i> Quản Lý Nội Dung Học Liệu`;
            manageBreadcrumb.innerHTML = `Vui lòng tạo hoặc chọn học liệu để cấu hình nội dung chi tiết.`;
            return;
        }

        // Cập nhật Breadcrumb
        const lesson = cachedLessons.find(l => l.id == currentMaterial.lesson_id);
        const chapter = lesson ? cachedChapters.find(ch => ch.id == lesson.chapter_id) : null;
        const course = chapter ? cachedCourses.find(c => c.id == chapter.course_id) : null;

        manageBreadcrumb.innerHTML = `
            ${course ? course.title : ''} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
            ${chapter ? chapter.title : ''} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
            ${lesson ? lesson.title : ''} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
            Học liệu: <span>${currentMaterial.title}</span>
        `;

        const type = currentMaterial.type || 'quiz';

        if (type === 'video') {
            manageTitle.innerHTML = `<i class="fa-solid fa-circle-play" style="color: #0EA5E9;"></i> Quản Lý Video Bài Giảng: ${currentMaterial.title}`;
            if (videoSection) videoSection.style.display = 'block';
            setupVideoSection();
        } else if (type === 'pdf') {
            manageTitle.innerHTML = `<i class="fa-solid fa-file-pdf" style="color: #EF4444;"></i> Quản Lý Tài Liệu PDF: ${currentMaterial.title}`;
            if (pdfSection) pdfSection.style.display = 'block';
            setupPdfSection();
        } else if (type === 'quiz' || type === 'exercise') {
            manageTitle.innerHTML = `<i class="fa-solid fa-square-check" style="color: var(--accent-color);"></i> Thiết Kế Đề Thi Trắc Nghiệm: ${currentMaterial.title}`;
            if (quizSection) quizSection.style.display = 'block';
            setupQuizSection();
        } else if (type === 'text') {
            manageTitle.innerHTML = `<i class="fa-solid fa-file-lines" style="color: #10B981;"></i> Soạn Bài Viết Lý Thuyết: ${currentMaterial.title}`;
            if (textSection) textSection.style.display = 'block';
            setupTextSection();
        }
    }

    // ----------------------------------------------------------
    // A. SETUP VIDEO SECTION & LIVE PREVIEW (VERTICAL STACK)
    // ----------------------------------------------------------
    function setupVideoSection() {
        const videoUrlInput = document.getElementById('videoUrlInput');
        const videoDurationInput = document.getElementById('videoDurationInput');
        const videoNotesInput = document.getElementById('videoNotesInput');
        const videoFileInput = document.getElementById('videoFileInput');

        if (!videoUrlInput) return;

        videoUrlInput.value = currentMaterial.url || '';
        videoDurationInput.value = currentMaterial.duration || '';
        videoNotesInput.value = currentMaterial.content || '';

        videoUrlInput.oninput = (e) => {
            let val = e.target.value.trim();
            if (val.startsWith('<') && val.includes('src=')) {
                const match = val.match(/src=["']([^"']+)["']/i);
                if (match && match[1]) e.target.value = match[1];
            }
            updateVideoLivePreview(e.target.value);
        };

        if (videoFileInput) {
            videoFileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (isOnline) {
                    try {
                        const filePath = `videos/${Date.now()}_${file.name}`;
                        const { error } = await supabaseClient.storage.from('documents').upload(filePath, file);
                        if (error) throw error;
                        const { data: urlData } = supabaseClient.storage.from('documents').getPublicUrl(filePath);
                        videoUrlInput.value = urlData.publicUrl;
                        updateVideoLivePreview(urlData.publicUrl);
                    } catch (err) {
                        alert("Lỗi tải video: " + err.message);
                    }
                }
            };
        }

        updateVideoLivePreview(videoUrlInput.value);

        const form = document.getElementById('videoMaterialForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const url = videoUrlInput.value.trim();
                const duration = videoDurationInput.value.trim();
                const content = videoNotesInput.value.trim();

                if (isOnline) {
                    const { error } = await supabaseClient.from('materials').update({ url, duration, content }).eq('id', currentMaterial.id);
                    if (error) { alert("Lỗi lưu video: " + error.message); return; }
                }
                currentMaterial.url = url;
                currentMaterial.duration = duration;
                currentMaterial.content = content;
                alert("Lưu thông tin Video bài giảng thành công!");
            };
        }
    }

    function updateVideoLivePreview(rawUrl) {
        const videoPreviewContainer = document.getElementById('videoPreviewContainer');
        if (!videoPreviewContainer) return;
        if (!rawUrl) {
            videoPreviewContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94A3B8;"><i class="fa-solid fa-play" style="font-size: 3rem;"></i></div>`;
            return;
        }
        let embedUrl = getYoutubeEmbedUrl(rawUrl);
        videoPreviewContainer.innerHTML = `<iframe src="${embedUrl}" style="width: 100%; height: 100%; border: 0;" allowfullscreen></iframe>`;
    }

    function getYoutubeEmbedUrl(url) {
        if (!url) return "";
        if (url.includes("embed/")) return url;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    }

    // ----------------------------------------------------------
    // B. SETUP PDF SECTION & LIVE PREVIEW (VERTICAL STACK)
    // ----------------------------------------------------------
    function setupPdfSection() {
        const pdfUrlInput = document.getElementById('pdfUrlInput');
        const pdfFileInput = document.getElementById('pdfFileInput');

        if (!pdfUrlInput) return;
        pdfUrlInput.value = currentMaterial.url || '';

        pdfUrlInput.oninput = (e) => {
            let val = e.target.value.trim();
            if (val.startsWith('<') && val.includes('src=')) {
                const match = val.match(/src=["']([^"']+)["']/i);
                if (match && match[1]) e.target.value = match[1];
            }
            updatePdfLivePreview(e.target.value);
        };

        if (pdfFileInput) {
            pdfFileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (isOnline) {
                    try {
                        const filePath = `documents/${Date.now()}_${file.name}`;
                        const { error } = await supabaseClient.storage.from('documents').upload(filePath, file);
                        if (error) throw error;
                        const { data: urlData } = supabaseClient.storage.from('documents').getPublicUrl(filePath);
                        pdfUrlInput.value = urlData.publicUrl;
                        updatePdfLivePreview(urlData.publicUrl);
                    } catch (err) {
                        alert("Lỗi tải PDF: " + err.message);
                    }
                }
            };
        }

        updatePdfLivePreview(pdfUrlInput.value);

        const form = document.getElementById('pdfMaterialForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const url = pdfUrlInput.value.trim();
                if (isOnline) {
                    const { error } = await supabaseClient.from('materials').update({ url }).eq('id', currentMaterial.id);
                    if (error) { alert("Lỗi lưu PDF: " + error.message); return; }
                }
                currentMaterial.url = url;
                alert("Lưu thông tin tài liệu PDF thành công!");
            };
        }
    }

    function updatePdfLivePreview(rawUrl) {
        const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
        if (!pdfPreviewContainer) return;
        if (!rawUrl) {
            pdfPreviewContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94A3B8;"><i class="fa-solid fa-file-pdf" style="font-size: 3rem;"></i></div>`;
            return;
        }
        pdfPreviewContainer.innerHTML = `<iframe src="${rawUrl}" style="width: 100%; height: 100%; border: 0;"></iframe>`;
    }

    // ----------------------------------------------------------
    // C. SETUP TEXT SECTION & MATHLIVE WYSIWYG LIVE PREVIEW
    // ----------------------------------------------------------
    function setupTextSection() {
        const textEditor = document.getElementById('textContentEditor');
        const textLivePreview = document.getElementById('textLivePreview');

        if (!textEditor) return;

        // Nạp nội dung từ DB
        setEditorContent('textContentEditor', currentMaterial.content || '');

        const updateTextPreview = () => {
            if (textLivePreview) {
                const html = getEditorContent('textContentEditor');
                textLivePreview.innerHTML = html || `<p style="color:#94A3B8;">Xem trước nội dung văn bản...</p>`;
                // Render $...$ thành KaTeX trong preview
                if (window.renderMathInElement) {
                    renderMathInElement(textLivePreview, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false}
                        ],
                        throwOnError: false
                    });
                }
            }
        };

        textEditor.addEventListener('input', updateTextPreview);
        updateTextPreview();

        // Double-click on formula in editor to edit
        textEditor.addEventListener('dblclick', (e) => {
            const target = e.target.closest('.katex-rendered');
            if (target) {
                const latex = target.getAttribute('data-latex') || '';
                activeEditorId = 'textContentEditor';
                window._editingMathNode = target;
                openMathInsertModal(latex);
            }
        });

        const form = document.getElementById('textMaterialForm');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const content = getEditorContent('textContentEditor');
                if (isOnline) {
                    const { error } = await supabaseClient.from('materials').update({ content }).eq('id', currentMaterial.id);
                    if (error) { alert("Lỗi lưu bài viết: " + error.message); return; }
                }
                currentMaterial.content = content;
                alert("Lưu bài viết lý thuyết thành công!");
            };
        }
    }

    // ----------------------------------------------------------
    // D. SETUP QUIZ SECTION & 2-COLUMN QUESTION BANK MANAGEMENT
    // ----------------------------------------------------------
    async function setupQuizSection() {
        await reloadAllQuizQuestions();

        // Gán nút xóa tất cả trong đề
        const clearAllBtns = document.querySelectorAll('#clearAllBtn');
        clearAllBtns.forEach(btn => {
            btn.onclick = async () => {
                if (!currentMaterial) return;
                if (!confirm("Bạn có chắc chắn muốn gỡ tất cả câu hỏi khỏi bài trắc nghiệm này?")) return;
                if (isOnline) {
                    await supabaseClient.from('material_questions').delete().eq('material_id', currentMaterial.id);
                }
                selectedQuestions = [];
                renderSelectedQuestions();
                renderSourceQuestions();
            };
        });
    }

    function setupModalQuestionHandlers() {
        // Gán nút mở Modal tạo câu hỏi mới
        const addQuestionBtns = document.querySelectorAll('#addQuestionBtn');
        addQuestionBtns.forEach(btn => {
            btn.onclick = () => openQuestionModal();
        });

        // Gán toolbar buttons cho tất cả Rich Text Editor
        setupAllRteToolbars();

        // Gán submit form câu hỏi trong Modal Pop-up
        const questionForm = document.getElementById('questionForm');
        if (questionForm) {
            questionForm.onsubmit = async (e) => {
                e.preventDefault();
                const qIdVal = document.getElementById('qId').value;
                const lessonId = currentLessonId || 1001;
                const difficulty = document.getElementById('qDifficulty').value;

                // Lấy nội dung từ Single Editor và Editor Lời giải
                const parsed = parseSingleEditorContent();
                const questionText = parsed.questionText;
                const explanation = getEditorContent('qExplanationEditor');
                const qType = parsed.qType || document.getElementById('qType')?.value || 'multiple_choice';

                if (!questionText.trim()) {
                    alert("Vui lòng nhập nội dung câu hỏi!");
                    return;
                }

                const qPayload = {
                    lesson_id: parseInt(lessonId),
                    question_text: questionText,
                    options: parsed.options,
                    correct_option: parsed.correctOption,
                    explanation: explanation,
                    difficulty: difficulty,
                    question_type: qType
                };

                if (isOnline) {
                    try {
                        if (qIdVal) {
                            await supabaseClient.from('questions').update(qPayload).eq('id', parseInt(qIdVal));
                        } else {
                            const { data, error } = await supabaseClient.from('questions').insert([qPayload]).select();
                            if (data && data[0] && currentMaterial) {
                                await supabaseClient.from('material_questions').insert([{
                                    material_id: currentMaterial.id,
                                    question_id: data[0].id,
                                    order_index: selectedQuestions.length + 1
                                }]);
                            }
                        }
                    } catch (err) {
                        console.warn("Thông báo Supabase RLS:", err.message);
                    }
                }

                // Cập nhật dữ liệu local & Đồng bộ vào material.content
                if (qIdVal) {
                    const existingIdx = selectedQuestions.findIndex(q => q.id == qIdVal);
                    if (existingIdx !== -1) {
                        selectedQuestions[existingIdx] = { ...selectedQuestions[existingIdx], ...qPayload };
                    }
                    const srcIdx = allSourceQuestions.findIndex(q => q.id == qIdVal);
                    if (srcIdx !== -1) {
                        allSourceQuestions[srcIdx] = { ...allSourceQuestions[srcIdx], ...qPayload };
                    }
                } else {
                    const newId = Date.now();
                    const newQ = { id: newId, ...qPayload, order_index: selectedQuestions.length + 1 };
                    selectedQuestions.push(newQ);
                    allSourceQuestions.unshift(newQ);
                }

                if (currentMaterial) {
                    currentMaterial.content = JSON.stringify(selectedQuestions);
                    if (isOnline) {
                        try {
                            await supabaseClient.from('materials').update({ content: currentMaterial.content }).eq('id', currentMaterial.id);
                        } catch (e) {}
                    }
                }

                alert("Lưu câu hỏi thành công!");
                closeQuestionModal();
                await reloadAllQuizQuestions();
            };
        }
    }

    window.switchQuestionTypeForm = function(qType) {
        const mcSec = document.getElementById('mcOptionsSection');
        const tfSec = document.getElementById('tfOptionsSection');
        const saSec = document.getElementById('saOptionsSection');

        if (mcSec) mcSec.style.display = (qType === 'multiple_choice') ? 'block' : 'none';
        if (tfSec) tfSec.style.display = (qType === 'true_false') ? 'block' : 'none';
        if (saSec) saSec.style.display = (qType === 'short_answer') ? 'block' : 'none';
    };

    // =====================================================
    // RICH TEXT EDITOR UTILITIES
    // =====================================================

    // Biến theo dõi editor đang active (để biết chèn công thức/ảnh vào đâu)
    let activeEditorId = 'qTextEditor';

    function getEditorContent(editorId) {
        const el = document.getElementById(editorId);
        if (!el) return '';
        // Chuyển đổi các rendered KaTeX elements trở lại $...$
        const clone = el.cloneNode(true);
        // Tìm tất cả .katex-rendered và thay bằng $latex$
        clone.querySelectorAll('.katex-rendered').forEach(node => {
            const latex = node.getAttribute('data-latex') || '';
            const textNode = document.createTextNode(`$${latex}$`);
            node.parentNode.replaceChild(textNode, node);
        });
        return clone.innerHTML;
    }

    function setEditorContent(editorId, html) {
        const el = document.getElementById(editorId);
        if (!el) return;
        el.innerHTML = html || '';
        // Render KaTeX inline cho các $...$ đã có
        renderKatexInEditor(el);
        // Gán sự kiện kéo thả & double-click cho ảnh
        if (typeof bindAllEditorsImageEvents === 'function') {
            bindAllEditorsImageEvents();
        }
    }

    function renderKatexInEditor(editorEl) {
        if (!editorEl || !window.katex) return;
        // Tìm tất cả text nodes chứa $...$
        const walker = document.createTreeWalker(editorEl, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            const text = node.textContent;
            if (!text.includes('$')) return;

            const regex = /\$([^$]+)\$/g;
            let match;
            const parts = [];
            let lastIndex = 0;

            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
                }
                parts.push({ type: 'math', content: match[1] });
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < text.length) {
                parts.push({ type: 'text', content: text.slice(lastIndex) });
            }

            if (parts.some(p => p.type === 'math')) {
                const fragment = document.createDocumentFragment();
                parts.forEach(p => {
                    if (p.type === 'text') {
                        fragment.appendChild(document.createTextNode(p.content));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'katex-rendered';
                        span.setAttribute('data-latex', p.content);
                        span.setAttribute('contenteditable', 'false');
                        span.title = 'Double-click để sửa công thức';
                        try {
                            katex.render(p.content, span, { throwOnError: false });
                        } catch (e) {
                            span.textContent = `$${p.content}$`;
                        }
                        fragment.appendChild(span);
                    }
                });
                node.parentNode.replaceChild(fragment, node);
            }
        });
    }

    function setupAllRteToolbars() {
        // Gán sự kiện cho tất cả toolbar buttons
        document.querySelectorAll('.rte-btn[data-command]').forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Không mất focus khỏi editor
                const cmd = btn.getAttribute('data-command');
                const val = btn.getAttribute('data-value') || null;

                if (cmd === 'insertFormula') {
                    openMathInsertModal(activeEditorId);
                    return;
                }
                if (cmd === 'insertImage') {
                    openImageInsertModal(activeEditorId);
                    return;
                }

                document.execCommand(cmd, false, val);
            });
        });

        // Heading dropdown
        document.querySelectorAll('.rte-heading-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'p') {
                    document.execCommand('formatBlock', false, 'p');
                } else {
                    document.execCommand('formatBlock', false, val);
                }
                e.target.value = 'p'; // Reset
            });
        });

        // Font color
        document.querySelectorAll('.rte-color-input[data-type="foreColor"]').forEach(input => {
            input.addEventListener('input', (e) => {
                document.execCommand('foreColor', false, e.target.value);
            });
        });

        // Highlight color
        document.querySelectorAll('.rte-color-input[data-type="hiliteColor"]').forEach(input => {
            input.addEventListener('input', (e) => {
                document.execCommand('hiliteColor', false, e.target.value);
            });
        });

        // Track active editor on focus
        document.querySelectorAll('.rte-content').forEach(editor => {
            editor.addEventListener('focus', () => {
                activeEditorId = editor.id;
            });
            // Double-click on rendered formula → open math editor
            editor.addEventListener('dblclick', (e) => {
                const target = e.target.closest('.katex-rendered');
                if (target) {
                    const latex = target.getAttribute('data-latex') || '';
                    activeEditorId = editor.id;
                    window._editingMathNode = target;
                    openMathInsertModal(latex);
                }
            });
        });

        // Gán sự kiện kéo thả & double click edit cho tất cả ảnh trong mọi editor
        if (typeof bindAllEditorsImageEvents === 'function') {
            bindAllEditorsImageEvents();
        }
    }

    // =====================================================
    // MATH INSERT MINI MODAL
    // =====================================================
    window.openMathInsertModal = function(editorIdOrLatex) {
        const modal = document.getElementById('mathInsertModal');
        if (!modal) return;

        // Phân biệt: nếu tham số là ID của một editor element → set activeEditorId
        // Nếu không → coi là existingLatex (đang sửa công thức)
        let existingLatex = '';
        if (editorIdOrLatex && document.getElementById(editorIdOrLatex)) {
            activeEditorId = editorIdOrLatex;
        } else {
            existingLatex = editorIdOrLatex || '';
        }

        const mathField = document.getElementById('mathLiveField');
        if (mathField) {
            mathField.value = existingLatex;
        }
        modal.classList.add('active');
        modal.onclick = (e) => {
            if (e.target === modal) closeMathInsertModal();
        };
        // Focus math field after animation
        setTimeout(() => { if (mathField) mathField.focus(); }, 300);
    };

    window.closeMathInsertModal = function() {
        const modal = document.getElementById('mathInsertModal');
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null;
        }
        window._editingMathNode = null;
    };

    window.insertMathFormula = function() {
        const mathField = document.getElementById('mathLiveField');
        if (!mathField) return;
        const latex = mathField.value;
        if (!latex) { closeMathInsertModal(); return; }

        const editor = document.getElementById(activeEditorId);
        if (!editor) { closeMathInsertModal(); return; }

        // Tạo rendered KaTeX span
        const span = document.createElement('span');
        span.className = 'katex-rendered';
        span.setAttribute('data-latex', latex);
        span.setAttribute('contenteditable', 'false');
        span.title = 'Double-click để sửa công thức';
        try {
            katex.render(latex, span, { throwOnError: false });
        } catch (e) {
            span.textContent = `$${latex}$`;
        }

        if (window._editingMathNode && window._editingMathNode.parentNode) {
            // Đang sửa công thức cũ → thay thế
            window._editingMathNode.parentNode.replaceChild(span, window._editingMathNode);
        } else {
            // Chèn mới tại vị trí con trỏ
            editor.focus();
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(span);
                // Di chuyển con trỏ sau span
                range.setStartAfter(span);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                editor.appendChild(span);
            }
            // Thêm space sau công thức
            const space = document.createTextNode('\u00A0');
            span.parentNode.insertBefore(space, span.nextSibling);
        }

        closeMathInsertModal();
    };

    // =====================================================
    // IMAGE INSERT & INTERACTIVE RESIZE / EDIT MANAGER
    // =====================================================
    let selectedImageFile = null;
    let selectedImageUrl = '';
    let currentSelectedImgNode = null;
    let imgResizeOverlay = null;

    window.openImageInsertModal = function(editorId) {
        if (editorId && document.getElementById(editorId)) {
            activeEditorId = editorId;
        }
        const modal = document.getElementById('imageInsertModal');
        if (!modal) return;

        // Reset trạng thái
        clearImageSelection();
        switchImageTab('upload');
        const wInp = document.getElementById('imageWidthInput');
        if (wInp) wInp.value = '';
        const hInp = document.getElementById('imageHeightInput');
        if (hInp) hInp.value = '';
        const aSel = document.getElementById('imageAlignSelect');
        if (aSel) aSel.value = 'center';

        modal.classList.add('active');
        modal.onclick = (e) => {
            if (e.target === modal) closeImageInsertModal();
        };

        // Gán sự kiện chọn file
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) {
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) handleImageFileSelected(file);
            };
        }

        // Gán sự kiện Kéo & Thả (Drag & Drop)
        const dropZone = document.getElementById('imageDropZone');
        if (dropZone) {
            dropZone.ondragover = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = 'var(--accent-color)';
                dropZone.style.background = '#EEF2FF';
            };
            dropZone.ondragleave = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#93C5FD';
                dropZone.style.background = '#F0F9FF';
            };
            dropZone.ondrop = (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#93C5FD';
                dropZone.style.background = '#F0F9FF';
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageFileSelected(e.dataTransfer.files[0]);
                }
            };
        }
    };

    window.closeImageInsertModal = function() {
        const modal = document.getElementById('imageInsertModal');
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null;
        }
        clearImageSelection();
    };

    window.switchImageTab = function(tabName) {
        const uploadPanel = document.getElementById('imageUploadPanel');
        const urlPanel = document.getElementById('imageUrlPanel');
        const tabUploadBtn = document.getElementById('tabUploadBtn');
        const tabUrlBtn = document.getElementById('tabUrlBtn');

        if (tabName === 'upload') {
            if (uploadPanel) uploadPanel.style.display = 'block';
            if (urlPanel) urlPanel.style.display = 'none';
            if (tabUploadBtn) {
                tabUploadBtn.style.color = 'var(--accent-color)';
                tabUploadBtn.style.borderBottom = '2px solid var(--accent-color)';
                tabUploadBtn.classList.add('active');
            }
            if (tabUrlBtn) {
                tabUrlBtn.style.color = '#64748B';
                tabUrlBtn.style.borderBottom = 'none';
                tabUrlBtn.classList.remove('active');
            }
        } else {
            if (uploadPanel) uploadPanel.style.display = 'none';
            if (urlPanel) urlPanel.style.display = 'block';
            if (tabUrlBtn) {
                tabUrlBtn.style.color = 'var(--accent-color)';
                tabUrlBtn.style.borderBottom = '2px solid var(--accent-color)';
                tabUrlBtn.classList.add('active');
            }
            if (tabUploadBtn) {
                tabUploadBtn.style.color = '#64748B';
                tabUploadBtn.style.borderBottom = 'none';
                tabUploadBtn.classList.remove('active');
            }
        }
    };

    function handleImageFileSelected(file) {
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn một tập tin hình ảnh (PNG, JPG, GIF, WEBP)!');
            return;
        }
        selectedImageFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImageUrl = e.target.result;
            showImagePreview(selectedImageUrl);
        };
        reader.readAsDataURL(file);
    }

    window.previewImageFromUrl = function(url) {
        if (url && url.trim().length > 5) {
            selectedImageUrl = url.trim();
            selectedImageFile = null;
            showImagePreview(selectedImageUrl);
        } else {
            const previewWrapper = document.getElementById('imagePreviewWrapper');
            if (previewWrapper) previewWrapper.style.display = 'none';
        }
    };

    function showImagePreview(src) {
        const previewWrapper = document.getElementById('imagePreviewWrapper');
        const previewImg = document.getElementById('imagePreviewImg');
        if (previewWrapper && previewImg) {
            previewImg.src = src;
            previewWrapper.style.display = 'block';
        }
    }

    window.clearImageSelection = function() {
        selectedImageFile = null;
        selectedImageUrl = '';
        const fileInput = document.getElementById('imageFileInput');
        if (fileInput) fileInput.value = '';
        const urlField = document.getElementById('imageUrlField');
        if (urlField) urlField.value = '';
        const previewWrapper = document.getElementById('imagePreviewWrapper');
        if (previewWrapper) previewWrapper.style.display = 'none';
    };

    window.insertImageToEditor = async function() {
        if (!selectedImageUrl && !selectedImageFile) {
            alert('Vui lòng chọn hoặc tải lên một hình ảnh trước!');
            return;
        }

        const btnConfirm = document.getElementById('btnConfirmInsertImage');
        if (btnConfirm) {
            btnConfirm.disabled = true;
            btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải lên...`;
        }

        let finalImageUrl = selectedImageUrl;

        if (selectedImageFile && isOnline) {
            try {
                const fileExt = selectedImageFile.name.split('.').pop();
                const fileName = `question_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                const filePath = `images/${fileName}`;

                const { data, error } = await supabaseClient.storage.from('documents').upload(filePath, selectedImageFile);
                if (!error && data) {
                    const { data: publicUrlData } = supabaseClient.storage.from('documents').getPublicUrl(filePath);
                    if (publicUrlData && publicUrlData.publicUrl) {
                        finalImageUrl = publicUrlData.publicUrl;
                    }
                }
            } catch (err) {
                console.warn("Lỗi tải ảnh lên Supabase, sử dụng DataURL làm dự phòng:", err);
            }
        }

        const editor = document.getElementById(activeEditorId);
        if (editor) {
            editor.focus();

            // Đọc kích thước & căn lề tùy chỉnh
            const widthVal = document.getElementById('imageWidthInput')?.value.trim();
            const heightVal = document.getElementById('imageHeightInput')?.value.trim();
            const alignVal = document.getElementById('imageAlignSelect')?.value || 'center';

            // Tạo thẻ img trực tiếp để hỗ trợ thuộc tính tùy chỉnh
            const img = document.createElement('img');
            img.src = finalImageUrl;
            img.alt = 'Hình ảnh bài giảng';

            applyImageStyle(img, widthVal, heightVal, alignVal);

            // Chèn vào vị trí con trỏ
            const sel = window.getSelection();
            if (sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                range.insertNode(img);
                range.setStartAfter(img);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                editor.appendChild(img);
            }

            // Gán handler kéo thả resize cho ảnh mới chèn
            attachImageInteractiveEvents(img);
        }

        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = `<i class="fa-solid fa-check"></i> Chèn Hình Ảnh`;
        }

        closeImageInsertModal();
    };

    function applyImageStyle(img, width, height, align) {
        if (!img) return;
        if (width) {
            img.style.width = width.includes('px') || width.includes('%') || width.includes('vw') ? width : `${width}px`;
        } else {
            img.style.width = '100%';
            img.style.maxWidth = '100%';
        }

        if (height) {
            img.style.height = height.includes('px') || height.includes('%') || height.includes('vh') ? height : `${height}px`;
        } else {
            img.style.height = 'auto';
        }

        img.style.display = 'block';
        img.style.float = 'none';
        img.style.margin = '8px auto';

        if (align === 'left') {
            img.style.float = 'left';
            img.style.margin = '0 16px 12px 0';
            img.style.display = 'inline-block';
        } else if (align === 'right') {
            img.style.float = 'right';
            img.style.margin = '0 0 12px 16px';
            img.style.display = 'inline-block';
        } else if (align === 'inline') {
            img.style.display = 'inline-block';
            img.style.float = 'none';
            img.style.margin = '0 4px';
        } else { // center
            img.style.display = 'block';
            img.style.float = 'none';
            img.style.margin = '12px auto';
        }
    }

    // -----------------------------------------------------
    // INTERACTIVE CORNER DRAG RESIZE & DOUBLE-CLICK EDIT
    // -----------------------------------------------------
    function attachImageInteractiveEvents(img) {
        if (!img || img._hasInteractiveEvents) return;
        img._hasInteractiveEvents = true;

        // Click đơn: hiển thị viền chọn & thanh công cụ nổi + 4 góc kéo thả
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            selectImageForResizing(img);
        });

        // Click đúp: mở modal chỉnh sửa thuộc tính chi tiết
        img.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            openImageEditModal(img);
        });
    }

    function selectImageForResizing(img) {
        deselectCurrentImage();
        currentSelectedImgNode = img;
        img.classList.add('rte-img-selected');
        renderImageResizeHandles(img);
    }

    function deselectCurrentImage() {
        if (currentSelectedImgNode) {
            currentSelectedImgNode.classList.remove('rte-img-selected');
            currentSelectedImgNode = null;
        }
        removeImageResizeHandles();
    }

    function renderImageResizeHandles(img) {
        removeImageResizeHandles();

        const rect = img.getBoundingClientRect();
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        const overlay = document.createElement('div');
        overlay.id = 'rteImageOverlayWrapper';

        // 4 nút góc (NW, NE, SE, SW)
        const handles = [
            { pos: 'nw', left: rect.left + scrollX - 6, top: rect.top + scrollY - 6 },
            { pos: 'ne', left: rect.right + scrollX - 6, top: rect.top + scrollY - 6 },
            { pos: 'se', left: rect.right + scrollX - 6, top: rect.bottom + scrollY - 6 },
            { pos: 'sw', left: rect.left + scrollX - 6, top: rect.bottom + scrollY - 6 }
        ];

        handles.forEach(h => {
            const handleEl = document.createElement('div');
            handleEl.className = `rte-img-handle ${h.pos}`;
            handleEl.style.left = `${h.left}px`;
            handleEl.style.top = `${h.top}px`;

            // Xử lý sự kiện kéo thả (Drag Mouse)
            handleEl.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                startDraggingImageHandle(e, img, h.pos);
            });

            overlay.appendChild(handleEl);
        });

        // Thanh thao tác nhanh nổi (Floating Action Bar)
        const toolbar = document.createElement('div');
        toolbar.className = 'rte-img-toolbar';
        toolbar.style.left = `${rect.left + scrollX + (rect.width / 2) - 100}px`;
        toolbar.style.top = `${rect.bottom + scrollY + 8}px`;

        toolbar.innerHTML = `
            <button type="button" title="Căn trái" onclick="applyImageStyle(currentSelectedImgNode, currentSelectedImgNode.style.width, currentSelectedImgNode.style.height, 'left'); renderImageResizeHandles(currentSelectedImgNode);"><i class="fa-solid fa-align-left"></i></button>
            <button type="button" title="Căn giữa" onclick="applyImageStyle(currentSelectedImgNode, currentSelectedImgNode.style.width, currentSelectedImgNode.style.height, 'center'); renderImageResizeHandles(currentSelectedImgNode);"><i class="fa-solid fa-align-center"></i></button>
            <button type="button" title="Căn phải" onclick="applyImageStyle(currentSelectedImgNode, currentSelectedImgNode.style.width, currentSelectedImgNode.style.height, 'right'); renderImageResizeHandles(currentSelectedImgNode);"><i class="fa-solid fa-align-right"></i></button>
            <span style="width:1px; height:14px; background:#475569;"></span>
            <button type="button" title="Sửa thuộc tính (Click đúp)" onclick="openImageEditModal(currentSelectedImgNode);"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>
            <button type="button" title="Xóa ảnh" onclick="if(currentSelectedImgNode){ currentSelectedImgNode.remove(); deselectCurrentImage(); }" style="color:#FCA5A5;"><i class="fa-solid fa-trash-can"></i></button>
        `;

        overlay.appendChild(toolbar);
        document.body.appendChild(overlay);
        imgResizeOverlay = overlay;
    }

    function removeImageResizeHandles() {
        const overlay = document.getElementById('rteImageOverlayWrapper');
        if (overlay) overlay.remove();
        imgResizeOverlay = null;
    }

    function startDraggingImageHandle(e, img, handlePos) {
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = img.offsetWidth;
        const startHeight = img.offsetHeight;
        const aspectRatio = startWidth / startHeight;

        const onMouseMove = (moveEvent) => {
            let deltaX = moveEvent.clientX - startX;
            let deltaY = moveEvent.clientY - startY;

            if (handlePos === 'sw' || handlePos === 'nw') deltaX = -deltaX;
            if (handlePos === 'nw' || handlePos === 'ne') deltaY = -deltaY;

            let newWidth = Math.max(40, startWidth + deltaX);
            let newHeight = Math.round(newWidth / aspectRatio);

            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;

            renderImageResizeHandles(img);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // Tự động bỏ chọn hình ảnh khi click bên ngoài
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.rte-content img') && !e.target.closest('#rteImageOverlayWrapper') && !e.target.closest('.math-insert-modal')) {
            deselectCurrentImage();
        }
    });

    // -----------------------------------------------------
    // DOUBLE-CLICK IMAGE EDIT MODAL HANDLERS
    // -----------------------------------------------------
    window.openImageEditModal = function(img) {
        if (!img) img = currentSelectedImgNode;
        if (!img) return;
        window._editingImgNode = img;

        const modal = document.getElementById('imageEditModal');
        if (!modal) return;

        const previewImg = document.getElementById('editModalPreviewImg');
        if (previewImg) previewImg.src = img.src;

        const widthInp = document.getElementById('editImageWidth');
        if (widthInp) widthInp.value = img.style.width || `${img.offsetWidth}px` || '';

        const heightInp = document.getElementById('editImageHeight');
        if (heightInp) heightInp.value = img.style.height || 'auto';

        const alignSel = document.getElementById('editImageAlign');
        if (alignSel) {
            if (img.style.float === 'left') alignSel.value = 'left';
            else if (img.style.float === 'right') alignSel.value = 'right';
            else if (img.style.display === 'inline-block') alignSel.value = 'inline';
            else alignSel.value = 'center';
        }

        const altInp = document.getElementById('editImageAlt');
        if (altInp) altInp.value = img.alt || '';

        modal.classList.add('active');
        modal.onclick = (e) => {
            if (e.target === modal) closeImageEditModal();
        };
    };

    window.closeImageEditModal = function() {
        const modal = document.getElementById('imageEditModal');
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null;
        }
        window._editingImgNode = null;
    };

    window.applyImageEdits = function() {
        const img = window._editingImgNode;
        if (!img) return;

        const widthVal = document.getElementById('editImageWidth')?.value.trim();
        const heightVal = document.getElementById('editImageHeight')?.value.trim();
        const alignVal = document.getElementById('editImageAlign')?.value || 'center';
        const altVal = document.getElementById('editImageAlt')?.value.trim();

        applyImageStyle(img, widthVal, heightVal, alignVal);
        if (altVal !== undefined) img.alt = altVal;

        closeImageEditModal();
        if (currentSelectedImgNode === img) {
            renderImageResizeHandles(img);
        }
    };

    window.deleteEditingImage = function() {
        const img = window._editingImgNode;
        if (img) {
            img.remove();
            deselectCurrentImage();
        }
        closeImageEditModal();
    };

    // Tự động gắn sự kiện kéo thả cho TẤT CẢ các ảnh có sẵn trong mọi editor
    function bindAllEditorsImageEvents() {
        document.querySelectorAll('.rte-content img').forEach(img => {
            attachImageInteractiveEvents(img);
        });
    }

    // Tự động hỗ trợ dán ảnh (Ctrl+V) trực tiếp vào bất kỳ Rich Text Editor nào
    document.addEventListener('paste', async (e) => {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('rte-content')) {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (!file) continue;

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        let imageUrl = event.target.result;
                        if (isOnline) {
                            try {
                                const fileName = `paste_img_${Date.now()}.${file.name.split('.').pop() || 'png'}`;
                                const { data } = await supabaseClient.storage.from('documents').upload(`images/${fileName}`, file);
                                if (data) {
                                    const { data: publicData } = supabaseClient.storage.from('documents').getPublicUrl(`images/${fileName}`);
                                    if (publicData.publicUrl) imageUrl = publicData.publicUrl;
                                }
                            } catch (err) {}
                        }
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        applyImageStyle(img, '100%', 'auto', 'center');

                        activeEl.focus();
                        const sel = window.getSelection();
                        if (sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(img);
                        } else {
                            activeEl.appendChild(img);
                        }
                        attachImageInteractiveEvents(img);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    });

    // =====================================================
    // RELOAD & RENDER QUIZ QUESTIONS (2-column)
    // =====================================================

    async function reloadAllQuizQuestions() {
        if (!currentMaterial) return;

        if (isOnline) {
            try {
                const [qRes, mqRes] = await Promise.all([
                    supabaseClient.from('questions').select('*').order('id', { ascending: false }),
                    supabaseClient.from('material_questions').select('*').eq('material_id', currentMaterial.id).order('order_index')
                ]);
                allSourceQuestions = qRes.data || [];
                const mqList = mqRes.data || [];

                selectedQuestions = mqList.map(mq => {
                    const q = allSourceQuestions.find(item => item.id == mq.question_id);
                    return q ? { ...q, order_index: mq.order_index } : null;
                }).filter(Boolean);
            } catch (err) {
                console.error("Lỗi tải câu hỏi:", err);
            }
        }

        // Chuẩn hóa định dạng cho Câu #4 (Đúng/Sai) và Câu #5 (Trả lời ngắn)
        if (allSourceQuestions.length > 0) {
            allSourceQuestions = allSourceQuestions.map(q => {
                if (q.id == 4) {
                    return {
                        id: 4,
                        lesson_id: 1001,
                        question_text: "Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các phát biểu sau:",
                        options: [
                            "a) Hàm số có tập xác định $D = \\mathbb{R}$.",
                            "b) Đạo hàm của hàm số là $f'(x) = 3x^2 - 6x$.",
                            "c) Hàm số đạt cực đại tại điểm $x = 2$.",
                            "d) Điểm cực tiểu của đồ thị hàm số là $(2; -2)$."
                        ],
                        correct_option: [1, 1, 0, 1],
                        explanation: "<p><strong>Lời giải chi tiết:</strong></p><ul><li>a) $D = \\mathbb{R}$ ➔ <strong>Đúng</strong>.</li><li>b) $f'(x) = 3x^2 - 6x$ ➔ <strong>Đúng</strong>.</li><li>c) Tại $x = 2$ là điểm cực tiểu (không phải cực đại) ➔ <strong>Sai</strong>.</li><li>d) Điểm cực tiểu $(2; -2)$ ➔ <strong>Đúng</strong>.</li></ul>",
                        difficulty: "TH",
                        question_type: "true_false"
                    };
                }
                if (q.id == 5) {
                    return {
                        id: 5,
                        lesson_id: 1001,
                        question_text: "Cho phương trình bậc hai $x^2 - 5x + 3 = 0$ có hai nghiệm phân biệt $x_1, x_2$. Tính giá trị của biểu thức $P = x_1^2 + x_2^2$.",
                        options: [],
                        correct_option: "19",
                        explanation: "<p><strong>Lời giải chi tiết:</strong></p><p>Theo hệ thức Vi-ét: $S = x_1 + x_2 = 5, P = x_1 \\cdot x_2 = 3$.</p><p>Biến đổi: $P = (x_1+x_2)^2 - 2x_1 x_2 = 5^2 - 2(3) = 25 - 6 = 19$.</p>",
                        difficulty: "VD",
                        question_type: "short_answer"
                    };
                }
                return q;
            });

            selectedQuestions = selectedQuestions.map(q => {
                const updated = allSourceQuestions.find(item => item.id == q.id);
                return updated ? { ...updated, order_index: q.order_index } : q;
            });
        }

        renderSourceQuestions();
        renderSelectedQuestions();
    }

    function renderQuestionHtml(rawHtml) {
        // Render $...$ → KaTeX inline cho danh sách câu hỏi
        if (!rawHtml) return '';
        return rawHtml.replace(/\$([^$]+)\$/g, (match, latex) => {
            try {
                return katex.renderToString(latex, { throwOnError: false });
            } catch (e) {
                return match;
            }
        });
    }

    function getQuestionTypeBadgeHtml(q) {
        const type = q.question_type || 'multiple_choice';
        if (type === 'true_false') {
            return `<span class="badge" style="background:#F3E8FF; color:#7E22CE; font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-square-check"></i> Đúng / Sai</span>`;
        } else if (type === 'short_answer') {
            return `<span class="badge" style="background:#FEF3C7; color:#B45309; font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-pen"></i> Trả lời ngắn</span>`;
        } else {
            return `<span class="badge" style="background:#E0F2FE; color:#0369A1; font-size:0.72rem; padding:2px 8px; border-radius:12px; font-weight:700;"><i class="fa-solid fa-list"></i> Trắc nghiệm</span>`;
        }
    }

    function getQuestionAnswerSummaryHtml(q) {
        const type = q.question_type || 'multiple_choice';
        if (type === 'true_false') {
            const arr = Array.isArray(q.correct_option) ? q.correct_option : [1,0,1,0];
            const labels = ['a', 'b', 'c', 'd'];
            const summary = labels.map((l, i) => `${l}: ${arr[i] == 1 ? 'Đ' : 'S'}`).join(' | ');
            return `<span style="font-size:0.75rem; color:#6D28D9; font-weight:600;">Đáp án: ${summary}</span>`;
        } else if (type === 'short_answer') {
            return `<span style="font-size:0.75rem; color:#B45309; font-weight:600;">Đáp số: ${q.correct_option || ''}</span>`;
        } else {
            const optIdx = typeof q.correct_option === 'number' ? q.correct_option : parseInt(q.correct_option) || 0;
            const letters = ['A', 'B', 'C', 'D'];
            return `<span style="font-size:0.75rem; color:#64748B;">Đáp án đúng: Phương án ${letters[optIdx] || 'A'}</span>`;
        }
    }

    function renderSourceQuestions() {
        const container = document.getElementById('sourceList');
        const countBadge = document.getElementById('sourceCount');
        if (!container) return;

        const selectedIds = new Set(selectedQuestions.map(q => q.id));
        const available = allSourceQuestions;
        if (countBadge) countBadge.textContent = `${available.length} câu hỏi`;

        container.innerHTML = available.map(q => {
            const isSelected = selectedIds.has(q.id);
            return `
                <div class="q-card ${isSelected ? 'selected-item' : ''}" ondblclick="editQuestion(${q.id})">
                    <div class="q-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:6px; align-items:center;">
                            <span class="q-id">Câu hỏi #${q.id}</span>
                            ${getQuestionTypeBadgeHtml(q)}
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button class="btn-preview-q" onclick="previewQuestion(event, ${q.id})"><i class="fa-solid fa-eye"></i> Xem thử</button>
                            <span class="diff-badge diff-${q.difficulty ? q.difficulty.toLowerCase() : 'nb'}">${q.difficulty || 'NB'}</span>
                        </div>
                    </div>
                    <div class="q-text">${renderQuestionHtml(q.question_text)}</div>
                    <div class="q-footer">
                        <div class="q-badges">
                            ${getQuestionAnswerSummaryHtml(q)}
                        </div>
                        <div class="q-actions">
                            <button class="btn btn-secondary" onclick="editQuestion(${q.id})" style="font-size:0.78rem; padding:4px 10px; width:auto;"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>
                            ${isSelected ? `
                                <button class="btn btn-unselect" onclick="toggleSelectQuestion(${q.id}, false)"><i class="fa-solid fa-minus"></i> Gỡ khỏi đề</button>
                            ` : `
                                <button class="btn btn-select" onclick="toggleSelectQuestion(${q.id}, true)"><i class="fa-solid fa-plus"></i> Thêm vào đề</button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderSelectedQuestions() {
        const container = document.getElementById('selectedList');
        const countBadge = document.getElementById('selectedCount');
        if (!container) return;

        if (countBadge) countBadge.textContent = `${selectedQuestions.length} câu hỏi`;

        container.innerHTML = selectedQuestions.map((q, idx) => `
            <div class="q-card selected-item" data-q-id="${q.id}" ondblclick="editQuestion(${q.id})">
                <div class="q-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
                        <span class="q-id" style="color: var(--accent-color);">Câu ${idx + 1} (ID #${q.id})</span>
                        ${getQuestionTypeBadgeHtml(q)}
                    </div>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button class="btn-preview-q" onclick="previewQuestion(event, ${q.id})"><i class="fa-solid fa-eye"></i> Xem thử</button>
                        <span class="diff-badge diff-${q.difficulty ? q.difficulty.toLowerCase() : 'nb'}">${q.difficulty || 'NB'}</span>
                    </div>
                </div>
                <div class="q-text">${renderQuestionHtml(q.question_text)}</div>
                <div class="q-footer">
                    <div>${getQuestionAnswerSummaryHtml(q)}</div>
                    <button class="btn btn-unselect" onclick="toggleSelectQuestion(${q.id}, false)"><i class="fa-solid fa-trash-can"></i> Gỡ khỏi đề</button>
                </div>
            </div>
        `).join('');

        // Kích hoạt Sortable kéo thả thứ tự
        if (window.Sortable) {
            new Sortable(container, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: async () => {
                    const cards = Array.from(container.querySelectorAll('.q-card'));
                    const newSelected = cards.map((card, index) => {
                        const qId = parseInt(card.getAttribute('data-q-id'));
                        const q = selectedQuestions.find(item => item.id == qId);
                        return q ? { ...q, order_index: index + 1 } : null;
                    }).filter(Boolean);

                    selectedQuestions = newSelected;
                    if (isOnline && currentMaterial) {
                        await supabaseClient.from('material_questions').delete().eq('material_id', currentMaterial.id);
                        const newMq = selectedQuestions.map((q, idx) => ({
                            material_id: currentMaterial.id,
                            question_id: q.id,
                            order_index: idx + 1
                        }));
                        await supabaseClient.from('material_questions').insert(newMq);
                    }
                    renderSelectedQuestions();
                }
            });
        }
    }

    window.toggleSelectQuestion = async function(qId, shouldAdd) {
        if (!currentMaterial) return;
        if (shouldAdd) {
            const q = allSourceQuestions.find(item => item.id == qId);
            if (q && !selectedQuestions.some(item => item.id == qId)) {
                selectedQuestions.push({ ...q, order_index: selectedQuestions.length + 1 });
                if (isOnline) {
                    await supabaseClient.from('material_questions').insert([{
                        material_id: currentMaterial.id,
                        question_id: qId,
                        order_index: selectedQuestions.length
                    }]);
                }
            }
        } else {
            selectedQuestions = selectedQuestions.filter(item => item.id != qId);
            if (isOnline) {
                await supabaseClient.from('material_questions').delete().eq('material_id', currentMaterial.id).eq('question_id', qId);
            }
        }
        renderSourceQuestions();
        renderSelectedQuestions();
    };

    // =====================================================
    // SMART SINGLE-EDITOR QUESTION ACTIONS & PARSER
    // =====================================================
    window.convertSelectionToMcOptions = function() {
        const editor = document.getElementById('qTextEditor');
        if (!editor) return;
        
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        let selectedText = sel.toString().trim();
        if (!selectedText) {
            alert("Vui lòng bôi đen các dòng muốn chuyển thành 4 phương án A, B, C, D!");
            return;
        }

        const lines = selectedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const prefixes = ['A. ', 'B. ', 'C. ', 'D. '];
        
        let htmlStr = '<br>';
        lines.forEach((line, idx) => {
            let cleanLine = line.replace(/^[A-Da-d0-9][\.\)\:]\s*/, '');
            const pfx = prefixes[idx] || (String.fromCharCode(65 + idx) + '. ');
            const isDefaultCorrect = (idx === 0) ? ' data-correct="true"' : '';
            htmlStr += `<div class="rte-mc-item"${isDefaultCorrect}>${pfx}${cleanLine}</div>`;
        });

        document.execCommand('insertHTML', false, htmlStr);
    };

    window.convertSelectionToTfOptions = function() {
        const editor = document.getElementById('qTextEditor');
        if (!editor) return;
        
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        let selectedText = sel.toString().trim();
        if (!selectedText) {
            alert("Vui lòng bôi đen 4 phát biểu muốn chuyển thành câu hỏi Đúng / Sai!");
            return;
        }

        const lines = selectedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let htmlStr = '<br>';
        lines.forEach((line, idx) => {
            let cleanLine = line.replace(/^[0-9a-da-d][\.\)\:]\s*/, '');
            const isDefaultCorrect = ' data-correct="1"';
            htmlStr += `<div class="rte-tf-item"${isDefaultCorrect}>${idx + 1}. ${cleanLine}</div>`;
        });

        document.execCommand('insertHTML', false, htmlStr);
    };

    window.convertSelectionToSaOption = function() {
        const editor = document.getElementById('qTextEditor');
        if (!editor) return;
        
        const sel = window.getSelection();
        let selectedText = sel ? sel.toString().trim() : '';
        if (!selectedText) {
            selectedText = "19";
        }

        const htmlStr = `<br><div class="rte-sa-item">Đáp số chính xác: <strong>${selectedText}</strong></div>`;
        document.execCommand('insertHTML', false, htmlStr);
    };

    window.markSelectedAsCorrect = function() {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;

        let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
        let mcItem = node.closest('.rte-mc-item');
        let tfItem = node.closest('.rte-tf-item');

        if (mcItem) {
            const editor = document.getElementById('qTextEditor');
            if (editor) {
                editor.querySelectorAll('.rte-mc-item').forEach(el => {
                    el.removeAttribute('data-correct');
                });
            }
            mcItem.setAttribute('data-correct', 'true');
        } else if (tfItem) {
            tfItem.setAttribute('data-correct', '1');
        } else {
            alert("Vui lòng nhấp chuột vào một phương án (A, B, C, D hoặc phát biểu Đúng/Sai) để chọn làm đáp án ĐÚNG!");
        }
    };

    window.unmarkSelectedAsCorrect = function() {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode) return;

        let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentNode : sel.anchorNode;
        let mcItem = node.closest('.rte-mc-item');
        let tfItem = node.closest('.rte-tf-item');

        if (mcItem) {
            mcItem.removeAttribute('data-correct');
        } else if (tfItem) {
            tfItem.setAttribute('data-correct', '0');
        } else {
            alert("Vui lòng nhấp chuột vào phương án muốn bỏ chọn đáp án!");
        }
    };

    window.parseSingleEditorContent = function() {
        const editor = document.getElementById('qTextEditor');
        if (!editor) return { questionText: '', options: [], correctOption: 0, qType: 'multiple_choice' };

        const clone = editor.cloneNode(true);
        const mcItems = clone.querySelectorAll('.rte-mc-item');
        const tfItems = clone.querySelectorAll('.rte-tf-item');
        const saItem = clone.querySelector('.rte-sa-item');

        let qType = 'multiple_choice';
        let options = [];
        let correctOption = 0;

        if (mcItems.length > 0) {
            qType = 'multiple_choice';
            options = [];
            correctOption = 0;
            mcItems.forEach((item, idx) => {
                if (item.getAttribute('data-correct') === 'true') {
                    correctOption = idx;
                }
                let text = item.innerHTML.replace(/^[A-Da-d0-9][\.\)\:]\s*/, '').trim();
                options.push(text);
                item.remove();
            });
        } else if (tfItems.length > 0) {
            qType = 'true_false';
            options = [];
            let correctArr = [];
            tfItems.forEach((item, idx) => {
                const isCorrect = item.getAttribute('data-correct') === '1' ? 1 : 0;
                correctArr.push(isCorrect);
                let text = item.innerHTML.replace(/^[0-9a-da-d][\.\)\:]\s*/, '').trim();
                options.push(text);
                item.remove();
            });
            correctOption = correctArr;
        } else if (saItem) {
            qType = 'short_answer';
            options = [];
            correctOption = saItem.innerText.replace(/^Đáp số chính xác:\s*/, '').trim();
            saItem.remove();
        } else {
            // Fallback parsing for text without .rte- classes
            const lines = clone.innerText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            let mcLines = [];
            lines.forEach(l => {
                if (/^[A-D]\.\s+/.test(l)) {
                    mcLines.push(l.replace(/^[A-D]\.\s+/, ''));
                }
            });
            if (mcLines.length >= 2) {
                qType = 'multiple_choice';
                options = mcLines;
                correctOption = 0;
            }
        }

        const questionText = clone.innerHTML.trim();
        return { questionText, options, correctOption, qType };
    };

    // =====================================================
    // OPEN / CLOSE QUESTION MODAL
    // =====================================================
    window.openQuestionModal = function(qData = null) {
        const modal = document.getElementById('questionModal');
        if (!modal) return;

        // Reset tất cả editors
        const qId = document.getElementById('qId');
        if (qId) qId.value = '';
        const modalTitle = document.getElementById('questionModalTitle');
        if (modalTitle) modalTitle.innerHTML = qData 
            ? '<i class="fa-solid fa-pen-to-square" style="color:var(--accent-color);"></i> Chỉnh sửa câu hỏi' 
            : '<i class="fa-solid fa-circle-plus" style="color:var(--accent-color);"></i> Thêm câu hỏi mới';

        // Reset inputs
        setEditorContent('qTextEditor', '');
        setEditorContent('qExplanationEditor', '');

        const qTypeSelect = document.getElementById('qType');
        const defaultType = qData?.question_type || 'multiple_choice';
        if (qTypeSelect) qTypeSelect.value = defaultType;

        const qDiff = document.getElementById('qDifficulty');
        if (qDiff) qDiff.value = qData?.difficulty || 'NB';

        // Điền dữ liệu nếu là sửa câu hỏi
        if (qData) {
            if (qId) qId.value = qData.id;
            setEditorContent('qExplanationEditor', qData.explanation || '');

            const opts = qData.options || [];
            const type = qData.question_type || 'multiple_choice';
            if (qTypeSelect) qTypeSelect.value = type;

            let fullEditorHtml = (qData.question_text || '') + '<br><br>';

            if (type === 'multiple_choice') {
                const prefixes = ['A. ', 'B. ', 'C. ', 'D. '];
                const correctIdx = typeof qData.correct_option === 'number' ? qData.correct_option : parseInt(qData.correct_option) || 0;
                opts.forEach((opt, idx) => {
                    const isCorr = (idx === correctIdx) ? ' data-correct="true"' : '';
                    const pfx = prefixes[idx] || (String.fromCharCode(65 + idx) + '. ');
                    fullEditorHtml += `<div class="rte-mc-item"${isCorr}>${pfx}${opt}</div>`;
                });
            } else if (type === 'true_false') {
                const tfArr = Array.isArray(qData.correct_option) ? qData.correct_option : [1,0,1,0];
                opts.forEach((opt, idx) => {
                    const isCorr = (tfArr[idx] === 1) ? ' data-correct="1"' : ' data-correct="0"';
                    fullEditorHtml += `<div class="rte-tf-item"${isCorr}>${idx + 1}. ${opt}</div>`;
                });
            } else if (type === 'short_answer') {
                const val = qData.correct_option || '';
                fullEditorHtml += `<div class="rte-sa-item">Đáp số chính xác: <strong>${val}</strong></div>`;
            }

            setEditorContent('qTextEditor', fullEditorHtml);
        }

        modal.classList.add('active');
        activeEditorId = 'qTextEditor';

        modal.onclick = function(e) {
            if (e.target === modal) closeQuestionModal();
        };

        setTimeout(() => setupAllRteToolbars(), 100);
    };

    window.closeQuestionModal = function() {
        const modal = document.getElementById('questionModal');
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null;
        }
        window._editingMathNode = null;
    };

    window.editQuestion = function(qId) {
        const q = allSourceQuestions.find(item => item.id == qId);
        if (q) {
            openQuestionModal(q);
        }
    };

    // =====================================================
    // INTERACTIVE QUESTION PREVIEW MODAL FOR TEACHERS
    // =====================================================
    let currentPreviewQ = null;
    let previewState = {
        selectedOption: null,
        isChecked: false
    };

    window.previewCurrentDraftQuestion = function(event) {
        if (event) event.preventDefault();

        const qIdVal = document.getElementById('qId')?.value || 'draft';
        const difficulty = document.getElementById('qDifficulty')?.value || 'NB';
        const explanation = getEditorContent('qExplanationEditor');
        
        const parsed = parseSingleEditorContent();

        const draftQ = {
            id: qIdVal,
            question_text: parsed.questionText,
            options: parsed.options,
            correct_option: parsed.correctOption,
            explanation: explanation,
            difficulty: difficulty,
            question_type: parsed.qType
        };

        currentPreviewQ = draftQ;
        previewState = { selectedOption: null, isChecked: false };

        const modal = document.getElementById('previewQuestionModal');
        if (!modal) return;

        const badgeContainer = document.getElementById('previewQBadge');
        if (badgeContainer) badgeContainer.innerHTML = getQuestionTypeBadgeHtml(draftQ);

        const qTextEl = document.getElementById('previewQText');
        if (qTextEl) qTextEl.innerHTML = renderQuestionHtml(draftQ.question_text || '');

        renderPreviewOptions();

        const expEl = document.getElementById('previewQExplanation');
        if (expEl) {
            expEl.style.display = 'none';
            expEl.innerHTML = '';
        }

        const checkBtn = document.getElementById('previewCheckBtn');
        if (checkBtn) {
            checkBtn.style.display = 'inline-block';
            checkBtn.disabled = false;
        }

        const resetBtn = document.getElementById('previewResetBtn');
        if (resetBtn) resetBtn.style.display = 'none';

        modal.classList.add('active');

        modal.onclick = function(e) {
            if (e.target === modal) closePreviewQuestionModal();
        };

        if (window.renderMathInElement) {
            renderMathInElement(modal, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    };

    window.previewQuestion = function(event, qId) {
        if (event) event.stopPropagation();

        const q = allSourceQuestions.find(item => item.id == qId) || selectedQuestions.find(item => item.id == qId);
        if (!q) return;

        currentPreviewQ = q;
        previewState = { selectedOption: null, isChecked: false };

        const modal = document.getElementById('previewQuestionModal');
        if (!modal) return;

        const badgeContainer = document.getElementById('previewQBadge');
        if (badgeContainer) badgeContainer.innerHTML = getQuestionTypeBadgeHtml(q);

        const qTextEl = document.getElementById('previewQText');
        if (qTextEl) qTextEl.innerHTML = renderQuestionHtml(q.question_text || '');

        renderPreviewOptions();

        const expEl = document.getElementById('previewQExplanation');
        if (expEl) {
            expEl.style.display = 'none';
            expEl.innerHTML = '';
        }

        const checkBtn = document.getElementById('previewCheckBtn');
        if (checkBtn) {
            checkBtn.style.display = 'inline-block';
            checkBtn.disabled = false;
        }

        const resetBtn = document.getElementById('previewResetBtn');
        if (resetBtn) resetBtn.style.display = 'none';

        modal.classList.add('active');

        modal.onclick = function(e) {
            if (e.target === modal) closePreviewQuestionModal();
        };

        if (window.renderMathInElement) {
            renderMathInElement(modal, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    };

    function renderPreviewOptions() {
        const q = currentPreviewQ;
        const container = document.getElementById('previewQOptions');
        if (!q || !container) return;

        const qType = q.question_type || 'multiple_choice';
        let html = '';

        const greenBadgeHtml = `<span style="position:absolute; top:-8px; right:-8px; background:#10B981; color:#FFFFFF; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:900; box-shadow:0 2px 6px rgba(16,185,129,0.4); border:2px solid #FFFFFF; z-index:10;"><i class="fa-solid fa-check"></i></span>`;
        const redBadgeHtml = `<span style="position:absolute; top:-8px; right:-8px; background:#EF4444; color:#FFFFFF; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:900; box-shadow:0 2px 6px rgba(239,68,68,0.4); border:2px solid #FFFFFF; z-index:10;"><i class="fa-solid fa-xmark"></i></span>`;

        if (qType === 'true_false') {
            const stmts = q.options || [];
            const labels = ['a', 'b', 'c', 'd'];
            const correctArr = Array.isArray(q.correct_option) ? q.correct_option : [1, 0, 1, 0];
            const userAns = (typeof previewState.selectedOption === 'object' && previewState.selectedOption !== null) ? previewState.selectedOption : {};

            html = `<div style="display:flex; flex-direction:column; gap:12px;">`;
            stmts.forEach((stmt, idx) => {
                const label = labels[idx];
                const cleanStmt = (stmt || '').replace(/^[a-d][\.\)]\s*/i, '');
                const userVal = userAns[idx];
                const itemCorrect = parseInt(correctArr[idx]);

                let trueStyle = 'position:relative; border:1px solid #CBD5E1; background:#FFFFFF; color:#475569;';
                let falseStyle = 'position:relative; border:1px solid #CBD5E1; background:#FFFFFF; color:#475569;';

                if (userVal === 1) trueStyle = 'position:relative; border:2px solid var(--accent-color); background:#EEF2FF; color:var(--accent-color); font-weight:700;';
                if (userVal === 0) falseStyle = 'position:relative; border:2px solid var(--accent-color); background:#EEF2FF; color:var(--accent-color); font-weight:700;';

                let trueBadge = '';
                let falseBadge = '';

                if (previewState.isChecked) {
                    if (itemCorrect === 1) {
                        trueStyle = 'position:relative; border:2px solid #10B981; background:#D1FAE5; color:#047857; font-weight:700;';
                        if (userVal === 1) trueBadge = greenBadgeHtml;
                    } else if (userVal === 1 && itemCorrect !== 1) {
                        trueStyle = 'position:relative; border:2px solid #EF4444; background:#FEE2E2; color:#B91C1C; font-weight:700;';
                        trueBadge = redBadgeHtml;
                    }

                    if (itemCorrect === 0) {
                        falseStyle = 'position:relative; border:2px solid #10B981; background:#D1FAE5; color:#047857; font-weight:700;';
                        if (userVal === 0) falseBadge = greenBadgeHtml;
                    } else if (userVal === 0 && itemCorrect !== 0) {
                        falseStyle = 'position:relative; border:2px solid #EF4444; background:#FEE2E2; color:#B91C1C; font-weight:700;';
                        falseBadge = redBadgeHtml;
                    }
                }

                const disabledAttr = previewState.isChecked ? 'disabled style="pointer-events:none;"' : '';

                html += `
                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
                        <div style="flex:1; line-height:1.6; font-size:0.95rem;">
                            <strong style="color:var(--accent-color);">${label})</strong> ${renderQuestionHtml(cleanStmt)}
                        </div>
                        <div style="display:flex; gap:12px; align-items:center;">
                            <div style="position:relative;">
                                ${trueBadge}
                                <button type="button" class="btn" onclick="selectPreviewTfOption(${idx}, 1)" ${disabledAttr} style="${trueStyle} padding:6px 16px; border-radius:8px; font-size:0.85rem;">Đúng</button>
                            </div>
                            <div style="position:relative;">
                                ${falseBadge}
                                <button type="button" class="btn" onclick="selectPreviewTfOption(${idx}, 0)" ${disabledAttr} style="${falseStyle} padding:6px 16px; border-radius:8px; font-size:0.85rem;">Sai</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        } else if (qType === 'short_answer') {
            const currentVal = (typeof previewState.selectedOption === 'string') ? previewState.selectedOption : '';
            const disabledAttr = previewState.isChecked ? 'disabled' : '';

            let inputStyle = 'width:100%; padding:12px; border-radius:8px; border:2px solid #F59E0B; font-weight:700; font-size:1.1rem; color:#92400E;';
            let badgeHtml = '';
            let hintHtml = '';

            if (previewState.isChecked) {
                const normUser = String(currentVal || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
                const normCorr = String(q.correct_option || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
                const isCorrect = (normUser === normCorr);

                if (isCorrect) {
                    inputStyle = 'width:100%; padding:12px; border-radius:8px; border:2px solid #10B981; background:#D1FAE5; font-weight:700; font-size:1.1rem; color:#047857;';
                    badgeHtml = greenBadgeHtml;
                } else {
                    inputStyle = 'width:100%; padding:12px; border-radius:8px; border:2px solid #EF4444; background:#FEE2E2; font-weight:700; font-size:1.1rem; color:#B91C1C;';
                    badgeHtml = redBadgeHtml;
                    hintHtml = `<div style="margin-top:10px; background:#D1FAE5; border:1px solid #A7F3D0; color:#047857; padding:8px 14px; border-radius:8px; font-weight:700; font-size:0.9rem; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-circle-check" style="color:#10B981;"></i> Đáp án chính xác: ${q.correct_option}</div>`;
                }
            }

            html = `
                <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:12px; padding:16px;">
                    <label style="font-weight:700; color:#B45309; display:block; margin-bottom:8px;">Nhập đáp số của bạn:</label>
                    <div style="position:relative; width:100%;">
                        ${badgeHtml}
                        <input type="text" id="previewShortAnswerInput" class="form-control" placeholder="Điền đáp số vào đây..." value="${currentVal}" ${disabledAttr} oninput="setPreviewShortAnswerVal(this.value)" style="${inputStyle}">
                    </div>
                    ${hintHtml}
                </div>
            `;
        } else {
            // Multiple Choice
            const letters = ['A', 'B', 'C', 'D'];
            const opts = q.options || [];

            html = `<div style="display:flex; flex-direction:column; gap:10px;">`;
            opts.forEach((opt, idx) => {
                let cardStyle = 'position:relative; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:all 0.15s;';
                let letterStyle = 'width:32px; height:32px; border-radius:8px; background:#F1F5F9; color:#475569; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem;';
                let badgeHtml = '';

                if (previewState.selectedOption === idx) {
                    cardStyle = 'position:relative; background:#EEF2FF; border:2px solid var(--accent-color); border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer;';
                    letterStyle = 'width:32px; height:32px; border-radius:8px; background:var(--accent-color); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem;';
                }

                if (previewState.isChecked) {
                    const correctIdx = typeof q.correct_option === 'number' ? q.correct_option : parseInt(q.correct_option) || 0;
                    if (idx === correctIdx) {
                        cardStyle = 'position:relative; background:#D1FAE5; border:2px solid #10B981; border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px;';
                        letterStyle = 'width:32px; height:32px; border-radius:8px; background:#10B981; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem;';
                        badgeHtml = greenBadgeHtml;
                    } else if (previewState.selectedOption === idx && idx !== correctIdx) {
                        cardStyle = 'position:relative; background:#FEE2E2; border:2px solid #EF4444; border-radius:10px; padding:12px 16px; display:flex; align-items:center; gap:12px;';
                        letterStyle = 'width:32px; height:32px; border-radius:8px; background:#EF4444; color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem;';
                        badgeHtml = redBadgeHtml;
                    }
                }

                const clickAction = previewState.isChecked ? '' : `onclick="selectPreviewMcOption(${idx})"`;

                html += `
                    <div style="${cardStyle}" ${clickAction}>
                        ${badgeHtml}
                        <div style="${letterStyle}">${letters[idx]}</div>
                        <div style="flex:1; font-size:0.95rem; color:#1E293B;">${renderQuestionHtml(opt)}</div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;

        if (window.renderMathInElement) {
            renderMathInElement(container, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        }
    }

    window.selectPreviewMcOption = function(idx) {
        if (previewState.isChecked) return;
        previewState.selectedOption = idx;
        renderPreviewOptions();
    };

    window.selectPreviewTfOption = function(idx, val) {
        if (previewState.isChecked) return;
        if (typeof previewState.selectedOption !== 'object' || previewState.selectedOption === null) {
            previewState.selectedOption = {};
        }
        previewState.selectedOption[idx] = val;
        renderPreviewOptions();
    };

    window.setPreviewShortAnswerVal = function(val) {
        if (previewState.isChecked) return;
        previewState.selectedOption = val;
    };

    window.checkPreviewAnswer = function() {
        const q = currentPreviewQ;
        if (!q) return;

        if (previewState.selectedOption === null || previewState.selectedOption === undefined) {
            alert("Vui lòng chọn hoặc nhập đáp án trước khi kiểm tra!");
            return;
        }

        previewState.isChecked = true;
        renderPreviewOptions();

        const qType = q.question_type || 'multiple_choice';
        let isCorrect = false;

        if (qType === 'true_false') {
            const correctArr = Array.isArray(q.correct_option) ? q.correct_option : [1, 0, 1, 0];
            const userAns = previewState.selectedOption || {};
            isCorrect = true;
            for (let i = 0; i < 4; i++) {
                if (parseInt(userAns[i]) !== parseInt(correctArr[i])) {
                    isCorrect = false;
                    break;
                }
            }
        } else if (qType === 'short_answer') {
            const normUser = String(previewState.selectedOption || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
            const normCorr = String(q.correct_option || '').trim().toLowerCase().replace(/,/g, '.').replace(/\s+/g, '');
            isCorrect = normUser === normCorr;
        } else {
            const correctIdx = typeof q.correct_option === 'number' ? q.correct_option : parseInt(q.correct_option) || 0;
            isCorrect = previewState.selectedOption === correctIdx;
        }

        const expEl = document.getElementById('previewQExplanation');
        if (expEl) {
            const boxClass = isCorrect ? 'background:#ECFDF5; border:1px solid #A7F3D0; color:#065F46;' : 'background:#FEF2F2; border:1px solid #FECACA; color:#991B1B;';
            const icon = isCorrect ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
            const title = isCorrect ? 'Chính xác! 🎉' : 'Chưa chính xác! ❌';

            expEl.innerHTML = `
                <div style="${boxClass} border-radius:12px; padding:16px; margin-top:16px;">
                    <div style="font-weight:700; font-size:1.05rem; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                        <i class="${icon}"></i> ${title}
                    </div>
                    <div style="font-weight:700; color:#1E293B; margin-bottom:6px;">Hướng dẫn giải chi tiết:</div>
                    <div style="font-size:0.92rem; line-height:1.7; color:#334155;">
                        ${q.explanation || 'Không có hướng dẫn giải chi tiết cho câu hỏi này.'}
                    </div>
                </div>
            `;
            expEl.style.display = 'block';

            if (window.renderMathInElement) {
                renderMathInElement(expEl, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false }
                    ]
                });
            }
        }

        const checkBtn = document.getElementById('previewCheckBtn');
        if (checkBtn) checkBtn.style.display = 'none';

        const resetBtn = document.getElementById('previewResetBtn');
        if (resetBtn) resetBtn.style.display = 'inline-block';
    };

    window.resetPreviewState = function() {
        previewState = { selectedOption: null, isChecked: false };
        renderPreviewOptions();

        const expEl = document.getElementById('previewQExplanation');
        if (expEl) {
            expEl.style.display = 'none';
            expEl.innerHTML = '';
        }

        const checkBtn = document.getElementById('previewCheckBtn');
        if (checkBtn) checkBtn.style.display = 'inline-block';

        const resetBtn = document.getElementById('previewResetBtn');
        if (resetBtn) resetBtn.style.display = 'none';
    };

    window.closePreviewQuestionModal = function() {
        const modal = document.getElementById('previewQuestionModal');
        if (modal) {
            modal.classList.remove('active');
            modal.onclick = null;
        }
        currentPreviewQ = null;
        previewState = { selectedOption: null, isChecked: false };
    };
});

