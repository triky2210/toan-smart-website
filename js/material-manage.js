// ==========================================================
// TOÁN SMART - QUẢN LÝ NỘI DUNG HỌC LIỆU ĐA NĂNG (v1.3.0)
// ==========================================================

document.addEventListener('DOMContentLoaded', async () => {
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

        // Đổ dữ liệu vào các select lọc
        populateFilterDropdowns();

        // Xác định học liệu đang được quản lý
        if (currentMaterialId) {
            currentMaterial = cachedMaterials.find(m => m.id == currentMaterialId);
            if (currentMaterial) {
                document.getElementById('qbFilterMaterial').value = currentMaterial.id;
                currentLessonId = currentMaterial.lesson_id;
                const foundLesson = cachedLessons.find(l => l.id == currentLessonId);
                if (foundLesson) {
                    document.getElementById('qbFilterLesson').value = foundLesson.id;
                    document.getElementById('qbFilterChapter').value = foundLesson.chapter_id;
                    const foundChapter = cachedChapters.find(ch => ch.id == foundLesson.chapter_id);
                    if (foundChapter) {
                        currentCourseId = foundChapter.course_id;
                        document.getElementById('qbFilterCourse').value = foundChapter.course_id;
                    }
                }
            }
        }

        // Vẽ breadcrumb & hiển thị giao diện theo loại học liệu
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
                cachedCourses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
        if (qbFilterChapter) {
            qbFilterChapter.innerHTML = `<option value="">Tất cả chương</option>` + 
                cachedChapters.map(ch => `<option value="${ch.id}">${ch.title}</option>`).join('');
        }
        if (qbFilterLesson) {
            qbFilterLesson.innerHTML = `<option value="">Tất cả bài học</option>` + 
                cachedLessons.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
        }
        if (qbFilterMaterial) {
            qbFilterMaterial.innerHTML = `<option value="">Tất cả học liệu</option>` + 
                cachedMaterials.map(m => `<option value="${m.id}">${m.title} (${m.type.toUpperCase()})</option>`).join('');
        }

        // Sự kiện đổi học liệu trên bộ lọc
        if (qbFilterMaterial) {
            qbFilterMaterial.addEventListener('change', (e) => {
                currentMaterialId = parseInt(e.target.value);
                currentMaterial = cachedMaterials.find(m => m.id == currentMaterialId);
                renderHeaderAndSections();
            });
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
        videoSection.style.display = 'none';
        pdfSection.style.display = 'none';
        quizSection.style.display = 'none';
        textSection.style.display = 'none';

        if (!currentMaterial) {
            manageTitle.innerHTML = `<i class="fa-solid fa-layer-group" style="color: var(--accent-color);"></i> Quản Lý Nội Dung Học Liệu`;
            manageBreadcrumb.innerHTML = `Vui lòng chọn học liệu để cấu hình nội dung chi tiết.`;
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

        const type = currentMaterial.type || 'video';

        if (type === 'video') {
            manageTitle.innerHTML = `<i class="fa-solid fa-circle-play" style="color: #0EA5E9;"></i> Quản Lý Video Bài Giảng: ${currentMaterial.title}`;
            videoSection.style.display = 'block';
            setupVideoSection();
        } else if (type === 'pdf') {
            manageTitle.innerHTML = `<i class="fa-solid fa-file-pdf" style="color: #EF4444;"></i> Quản Lý Tài Liệu PDF: ${currentMaterial.title}`;
            pdfSection.style.display = 'block';
            setupPdfSection();
        } else if (type === 'quiz' || type === 'exercise') {
            manageTitle.innerHTML = `<i class="fa-solid fa-square-check" style="color: var(--accent-color);"></i> Thiết Kế Đề Thi Trắc Nghiệm: ${currentMaterial.title}`;
            quizSection.style.display = 'block';
            setupQuizSection();
        } else if (type === 'text') {
            manageTitle.innerHTML = `<i class="fa-solid fa-file-lines" style="color: #10B981;"></i> Soạn Bài Viết Lý Thuyết: ${currentMaterial.title}`;
            textSection.style.display = 'block';
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
        const videoPreviewContainer = document.getElementById('videoPreviewContainer');

        videoUrlInput.value = currentMaterial.url || '';
        videoDurationInput.value = currentMaterial.duration || '';
        videoNotesInput.value = currentMaterial.content || '';

        // Tự động rút gọn link nếu dán cả thẻ <iframe>
        videoUrlInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val.startsWith('<') && val.includes('src=')) {
                const match = val.match(/src=["']([^"']+)["']/i);
                if (match && match[1]) {
                    e.target.value = match[1];
                }
            }
            updateVideoLivePreview(e.target.value);
        });

        // Tải file trực tiếp
        videoFileInput.addEventListener('change', async (e) => {
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
        });

        updateVideoLivePreview(videoUrlInput.value);

        // Form Submit
        const form = document.getElementById('videoMaterialForm');
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

    function updateVideoLivePreview(rawUrl) {
        const videoPreviewContainer = document.getElementById('videoPreviewContainer');
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
        const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');

        pdfUrlInput.value = currentMaterial.url || '';

        pdfUrlInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val.startsWith('<') && val.includes('src=')) {
                const match = val.match(/src=["']([^"']+)["']/i);
                if (match && match[1]) {
                    e.target.value = match[1];
                }
            }
            updatePdfLivePreview(e.target.value);
        });

        pdfFileInput.addEventListener('change', async (e) => {
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
        });

        updatePdfLivePreview(pdfUrlInput.value);

        const form = document.getElementById('pdfMaterialForm');
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

    function updatePdfLivePreview(rawUrl) {
        const pdfPreviewContainer = document.getElementById('pdfPreviewContainer');
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
        const textContentInput = document.getElementById('textContentInput');
        const textMathField = document.getElementById('textMathField');
        const textLivePreview = document.getElementById('textLivePreview');

        textContentInput.value = currentMaterial.content || '';

        // Tích hợp MathLive chèn công thức
        if (textMathField) {
            textMathField.addEventListener('input', (e) => {
                const latex = e.target.value;
                if (latex) {
                    // Chèn công thức dạng $...$ vào văn bản
                }
            });
        }

        const updateTextPreview = () => {
            textLivePreview.innerHTML = textContentInput.value || `<p style="color:#94A3B8;">Xem trước nội dung văn bản...</p>`;
            if (window.renderMathInElement) {
                renderMathInElement(textLivePreview, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ],
                    throwOnError: false
                });
            }
        };

        textContentInput.addEventListener('input', updateTextPreview);
        updateTextPreview();

        const form = document.getElementById('textMaterialForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const content = textContentInput.value.trim();
            if (isOnline) {
                const { error } = await supabaseClient.from('materials').update({ content }).eq('id', currentMaterial.id);
                if (error) { alert("Lỗi lưu bài viết: " + error.message); return; }
            }
            currentMaterial.content = content;
            alert("Lưu bài viết lý thuyết thành công!");
        };
    }

    // ----------------------------------------------------------
    // D. SETUP QUIZ SECTION & QUESTION BANK MANAGEMENT
    // ----------------------------------------------------------
    async function setupQuizSection() {
        await reloadAllQuizQuestions();

        const addQuestionBtn = document.getElementById('addQuestionBtn');
        if (addQuestionBtn) addQuestionBtn.onclick = () => openQuestionModal();

        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.onclick = async () => {
                if (!confirm("Bạn có chắc chắn muốn gỡ tất cả câu hỏi khỏi bài trắc nghiệm này?")) return;
                if (isOnline) {
                    await supabaseClient.from('material_questions').delete().eq('material_id', currentMaterial.id);
                }
                selectedQuestions = [];
                renderSelectedQuestions();
                renderSourceQuestions();
            };
        }

        // Tích hợp MathLive chèn công thức vào modal câu hỏi
        const modalMathField = document.getElementById('modalMathField');
        const insertMathToTextBtn = document.getElementById('insertMathToTextBtn');
        const qText = document.getElementById('qText');

        if (insertMathToTextBtn && modalMathField && qText) {
            insertMathToTextBtn.onclick = () => {
                const latex = modalMathField.value;
                if (latex) {
                    const mathTag = `$${latex}$`;
                    qText.value += ` ${mathTag} `;
                    qText.dispatchEvent(new Event('input'));
                }
            };
        }
    }

    async function reloadAllQuizQuestions() {
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
        renderSourceQuestions();
        renderSelectedQuestions();
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
            const opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
            return `
                <div class="q-card ${isSelected ? 'selected-item' : ''}">
                    <div class="q-header">
                        <span class="q-id">Câu hỏi #${q.id}</span>
                        <span class="diff-badge diff-${q.difficulty ? q.difficulty.toLowerCase() : 'nb'}">${q.difficulty || 'NB'}</span>
                    </div>
                    <div class="q-text">${q.question_text}</div>
                    <div class="q-footer">
                        <div class="q-badges">
                            <span style="font-size:0.75rem; color:#64748B;">Đáp án đúng: Option ${parseInt(q.correct_option) + 1}</span>
                        </div>
                        <div class="q-actions">
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

        if (window.renderMathInElement) {
            renderMathInElement(container, { delimiters: [{left: '$', right: '$', display: false}] });
        }
    }

    function renderSelectedQuestions() {
        const container = document.getElementById('selectedList');
        const countBadge = document.getElementById('selectedCount');
        if (!container) return;

        if (countBadge) countBadge.textContent = `${selectedQuestions.length} câu hỏi`;

        container.innerHTML = selectedQuestions.map((q, idx) => `
            <div class="q-card selected-item" data-q-id="${q.id}">
                <div class="q-header">
                    <span class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></span>
                    <span class="q-id" style="color: var(--accent-color);">Câu ${idx + 1} (ID #${q.id})</span>
                    <span class="diff-badge diff-${q.difficulty ? q.difficulty.toLowerCase() : 'nb'}">${q.difficulty || 'NB'}</span>
                </div>
                <div class="q-text">${q.question_text}</div>
                <div class="q-footer">
                    <button class="btn btn-unselect" onclick="toggleSelectQuestion(${q.id}, false)"><i class="fa-solid fa-trash-can"></i> Gỡ khỏi đề</button>
                </div>
            </div>
        `).join('');

        if (window.renderMathInElement) {
            renderMathInElement(container, { delimiters: [{left: '$', right: '$', display: false}] });
        }

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
                    if (isOnline) {
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

    window.openQuestionModal = function(qData = null) {
        document.getElementById('questionModal').classList.add('active');
    };

    window.closeQuestionModal = function() {
        document.getElementById('questionModal').classList.remove('active');
    };
});
