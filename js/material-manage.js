// js/material-manage.js - Controller for dedicated visual quiz management page (2 columns)

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 1;
    const lessonId = parseInt(urlParams.get('lesson_id'));
    const currentMaterialId = parseInt(urlParams.get('material_id'));

    if (!lessonId || !currentMaterialId) {
        alert("Lỗi: Thiếu thông tin học liệu trắc nghiệm!");
        window.location.href = "admin.html";
        return;
    }

    // DOM Elements
    const manageBreadcrumb = document.getElementById('manageBreadcrumb');
    const backBtn = document.getElementById('backBtn');
    const qbFilterCourse = document.getElementById('qbFilterCourse');
    const qbFilterChapter = document.getElementById('qbFilterChapter');
    const qbFilterLesson = document.getElementById('qbFilterLesson');
    const qbFilterMaterial = document.getElementById('qbFilterMaterial');
    const qbFilterChdc = document.getElementById('qbFilterChdc');
    const sourceList = document.getElementById('sourceList');
    const selectedList = document.getElementById('selectedList');
    const sourceCount = document.getElementById('sourceCount');
    const selectedCount = document.getElementById('selectedCount');
    const addQuestionBtn = document.getElementById('addQuestionBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const questionModal = document.getElementById('questionModal');
    const questionForm = document.getElementById('questionForm');
    const questionModalTitle = document.getElementById('questionModalTitle');

    // Data buffers
    let cachedCourses = [];
    let cachedChapters = [];
    let cachedLessons = [];
    let cachedMaterials = [];
    let allQuestions = []; // Ngân hàng câu hỏi tổng hợp
    let selectedQuestions = []; // Câu hỏi đã chọn cho quiz hiện tại
    let editingQuestionId = null;

    // 1. Kiểm tra quyền Admin
    await checkAdminAuth();

    async function checkAdminAuth() {
        let isAdmin = false;
        if (isOnline) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    if (session.user.email === 'admin@toansmart.edu.vn' || session.user.email === 'trungtamtoansmart@gmail.com') {
                        isAdmin = true;
                    }
                }
            } catch (err) {
                console.error("Lỗi Auth Supabase:", err);
            }
        }
        
        if (!isAdmin) {
            const demoAdmin = localStorage.getItem('demo_admin_user');
            if (demoAdmin) isAdmin = true;
        }

        if (!isAdmin) {
            alert("Vui lòng đăng nhập tài khoản Quản trị viên để truy cập trang này!");
            window.location.href = "login.html";
        }
    }

    // 2. Cấu hình nút quay lại và Breadcrumb
    backBtn.href = `study.html?id=${courseId}&lesson_id=${lessonId}&material_id=${currentMaterialId}`;

    // 3. Tải toàn bộ dữ liệu cấu trúc và câu hỏi
    await loadInitialData();

    async function loadInitialData() {
        if (!supabaseClient) return;

        // Tải các khóa, chương, bài, học liệu để xây dựng bộ lọc và breadcrumb
        const [coursesRes, chaptersRes, lessonsRes, materialsRes] = await Promise.all([
            supabaseClient.from('courses').select('id, title').order('id'),
            supabaseClient.from('chapters').select('id, course_id, title').order('order_index'),
            supabaseClient.from('lessons').select('id, chapter_id, title').order('order_index'),
            supabaseClient.from('materials').select('id, lesson_id, title, type').order('order_index')
        ]);

        cachedCourses = coursesRes.data || [];
        cachedChapters = chaptersRes.data || [];
        cachedLessons = lessonsRes.data || [];
        cachedMaterials = materialsRes.data || [];

        // Vẽ Breadcrumb
        renderBreadcrumbs();

        // Khởi tạo bộ lọc cascade phía trên
        populateFilterDropdowns();

        // Tải câu hỏi từ ngân hàng & danh sách đã chọn
        await reloadAll();

        // Lắng nghe sự kiện bộ lọc
        qbFilterCourse.addEventListener('change', () => {
            updateChapterFilter(qbFilterCourse.value);
            loadSourceQuestions();
        });
        qbFilterChapter.addEventListener('change', () => {
            updateLessonFilter(qbFilterChapter.value);
            loadSourceQuestions();
        });
        qbFilterLesson.addEventListener('change', () => {
            updateMaterialFilter(qbFilterLesson.value);
            loadSourceQuestions();
        });
        qbFilterMaterial.addEventListener('change', () => {
            loadSourceQuestions();
        });
        qbFilterChdc.addEventListener('change', () => {
            loadSourceQuestions();
        });

        // Nút Tạo câu hỏi mới
        addQuestionBtn.onclick = () => openQuestionModal();

        // Nút Xóa tất cả câu hỏi đã chọn
        clearAllBtn.onclick = async () => {
            if (selectedQuestions.length === 0) return alert("Bộ đề thi hiện đang trống!");
            if (!confirm(`Bạn có chắc chắn muốn gỡ toàn bộ ${selectedQuestions.length} câu hỏi ra khỏi học liệu trắc nghiệm này? Các câu hỏi vẫn được lưu trữ tại Ngân hàng câu hỏi.`)) return;

            const { error } = await supabaseClient.from('material_questions').delete().eq('material_id', currentMaterialId);
            if (error) return alert("Lỗi khi gỡ câu hỏi: " + error.message);
            await reloadSelectedQuestions();
        };

        // Kích hoạt tính năng kéo thả sắp xếp cho cột phải
        initDragAndDrop();
    }

    function renderBreadcrumbs() {
        const course = cachedCourses.find(c => c.id == courseId);
        const lesson = cachedLessons.find(l => l.id == lessonId);
        const chapter = lesson ? cachedChapters.find(ch => ch.id == lesson.chapter_id) : null;
        const currentMaterial = cachedMaterials.find(m => m.id == currentMaterialId);

        if (course && lesson && chapter) {
            manageBreadcrumb.innerHTML = `
                ${course.title} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
                ${chapter.title} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
                ${lesson.title} <i class="fa-solid fa-angle-right" style="font-size:0.75rem; margin:0 4px;"></i> 
                Học liệu: <span>${currentMaterial ? currentMaterial.title : 'Chưa chọn học liệu'}</span>
            `;
        }
    }

    function populateFilterDropdowns() {
        qbFilterCourse.innerHTML = '<option value="">Tất cả khóa học</option>';
        cachedCourses.forEach(c => {
            qbFilterCourse.innerHTML += `<option value="${c.id}">${c.title}</option>`;
        });

        // Đặt giá trị mặc định cho bộ lọc ban đầu chính là khóa học, chương và bài học hiện hành
        const lesson = cachedLessons.find(l => l.id == lessonId);
        const chapter = lesson ? cachedChapters.find(ch => ch.id == lesson.chapter_id) : null;

        if (chapter) {
            qbFilterCourse.value = courseId;
            updateChapterFilter(courseId);
            qbFilterChapter.value = chapter.id;
            updateLessonFilter(chapter.id);
            qbFilterLesson.value = lessonId;
            updateMaterialFilter(lessonId);
            qbFilterMaterial.value = currentMaterialId;
        }
    }

    function updateChapterFilter(cId) {
        qbFilterChapter.innerHTML = '<option value="">Tất cả chương</option>';
        const filtered = cId ? cachedChapters.filter(ch => ch.course_id == cId) : cachedChapters;
        filtered.forEach(ch => {
            qbFilterChapter.innerHTML += `<option value="${ch.id}">${ch.title}</option>`;
        });
        qbFilterLesson.innerHTML = '<option value="">Tất cả bài học</option>';
        qbFilterMaterial.innerHTML = '<option value="">Tất cả học liệu</option>';
    }

    function updateLessonFilter(chId) {
        qbFilterLesson.innerHTML = '<option value="">Tất cả bài học</option>';
        const filtered = chId ? cachedLessons.filter(l => l.chapter_id == chId) : cachedLessons;
        filtered.forEach(l => {
            qbFilterLesson.innerHTML += `<option value="${l.id}">${l.title}</option>`;
        });
        qbFilterMaterial.innerHTML = '<option value="">Tất cả học liệu</option>';
    }

    function updateMaterialFilter(lId) {
        qbFilterMaterial.innerHTML = '<option value="">Tất cả học liệu</option>';
        const filtered = lId ? cachedMaterials.filter(m => m.lesson_id == lId && m.type === 'quiz') : cachedMaterials.filter(m => m.type === 'quiz');
        filtered.forEach(m => {
            qbFilterMaterial.innerHTML += `<option value="${m.id}">${m.title}</option>`;
        });
    }

    async function reloadAll() {
        await Promise.all([
            loadSourceQuestions(),
            reloadSelectedQuestions()
        ]);
    }

    async function reloadSelectedQuestions() {
        if (!supabaseClient) return;

        // Tải các câu hỏi đã chọn cho học liệu hiện tại
        const { data, error } = await supabaseClient
            .from('material_questions')
            .select('order_index, question_id, questions(*)')
            .eq('material_id', currentMaterialId)
            .order('order_index');

        if (error) {
            console.error("Lỗi tải câu hỏi được chọn:", error);
            return;
        }

        selectedQuestions = (data || []).map(mq => {
            if (mq.questions) {
                return {
                    ...mq.questions,
                    order_index: mq.order_index
                };
            }
            return null;
        }).filter(q => q !== null);

        renderSelectedList();
        renderSourceList(); // Vẽ lại cột nguồn để vô hiệu hóa (disabled) nút "Chọn" đối với các câu đã có ở cột phải
    }

    async function loadSourceQuestions() {
        if (!supabaseClient) return;

        const cId = qbFilterCourse.value;
        const chId = qbFilterChapter.value;
        const lId = qbFilterLesson.value;
        const mId = qbFilterMaterial.value;

        if (qbFilterChdc.checked) {
            // Có tích chọn: Lấy theo CHDC (Câu Hỏi Được Chọn) - các câu hỏi được hiển thị cho học sinh làm bài
            let mqQuery = supabaseClient.from('material_questions').select('questions(*)');
            
            if (mId) {
                mqQuery = mqQuery.eq('material_id', mId);
            } else if (lId) {
                const lessonMats = cachedMaterials.filter(m => m.lesson_id == lId && m.type === 'quiz').map(m => m.id);
                if (lessonMats.length > 0) {
                    mqQuery = mqQuery.in('material_id', lessonMats);
                } else {
                    allQuestions = [];
                    renderSourceList();
                    return;
                }
            } else {
                // Nếu không chọn học liệu/bài học cụ thể nào thì fallback về toàn bộ câu hỏi liên kết
            }

            const { data, error } = await mqQuery;
            if (error) {
                console.error("Lỗi tải câu hỏi được chọn của bộ lọc:", error);
                return;
            }

            const qList = (data || []).map(d => d.questions).filter(q => q !== null);
            const uniqueIds = new Set();
            allQuestions = [];
            qList.forEach(q => {
                if (!uniqueIds.has(q.id)) {
                    uniqueIds.add(q.id);
                    allQuestions.push(q);
                }
            });
        } else {
            // Mặc định (Không tích chọn): Lấy các câu hỏi gốc/nguồn được tạo trực tiếp trong học liệu đó
            let qQuery = supabaseClient.from('questions').select('*').order('id', { ascending: false });
            
            if (cId) qQuery = qQuery.eq('course_id', cId);
            if (chId) qQuery = qQuery.eq('chapter_id', chId);
            if (lId) qQuery = qQuery.eq('lesson_id', lId);
            if (mId) qQuery = qQuery.eq('material_id', mId);

            const { data, error } = await qQuery;
            if (error) {
                console.error("Lỗi tải câu hỏi nguồn:", error);
                return;
            }

            allQuestions = data || [];
        }

        renderSourceList();
    }

    // Rendering Cột Trái (Ngân hàng nguồn)
    function renderSourceList() {
        sourceCount.textContent = `${allQuestions.length} câu hỏi`;
        if (allQuestions.length === 0) {
            sourceList.innerHTML = `<div style="text-align:center; color:#94A3B8; padding:40px 0; font-style:italic; font-size:0.9rem;"><i class="fa-solid fa-folder-open" style="font-size:2rem; display:block; margin-bottom:8px;"></i>Ngân hàng câu hỏi trống.</div>`;
            return;
        }

        sourceList.innerHTML = allQuestions.map(q => {
            const isAlreadySelected = selectedQuestions.some(sq => sq.id === q.id);
            const difficultyBadge = getDiffBadgeHTML(q.difficulty);
            
            return `
                <div class="q-card ${isAlreadySelected ? 'selected-item' : ''}" id="source-q-${q.id}">
                    <div class="q-header">
                        <span class="q-id">ID câu hỏi: #${q.id}</span>
                    </div>
                    <div class="q-text math-render">${q.question_text}</div>
                    
                    <!-- Dynamic rendering preview panel -->
                    <div id="expanded-preview-${q.id}" style="display:none;" class="q-preview-expanded-panel">
                        <div style="font-weight:700; margin-bottom:6px; color:#475569;">Các phương án lựa chọn:</div>
                        <ul style="list-style-type:none; padding-left:0; margin:0;">
                            ${(q.options || []).map((o, idx) => `<li style="margin-bottom:4px; font-weight: ${idx === q.correct_option ? '700; color:#059669;' : '500;'}">${o} ${idx === q.correct_option ? '✓' : ''}</li>`).join('')}
                        </ul>
                        ${q.explanation ? `<div style="margin-top:10px; border-top:1px dashed #CBD5E1; padding-top:8px; font-style:italic;"><span style="font-weight:700; color:#475569;">Lời giải:</span> ${q.explanation}</div>` : ''}
                    </div>

                    <div class="q-footer">
                        <div class="q-badges">
                            ${difficultyBadge}
                        </div>
                        <div class="q-actions">
                            <button class="btn btn-secondary" onclick="togglePreviewExpand(${q.id})" style="font-size:0.72rem; padding:4px 8px;"><i class="fa-solid fa-eye"></i> Xem thử</button>
                            <button class="btn btn-secondary" onclick="editQuestion(${q.id})" style="font-size:0.72rem; padding:4px 8px; color:var(--accent-color);"><i class="fa-solid fa-pen"></i> Sửa</button>
                            <button class="btn btn-secondary" onclick="deleteQuestion(${q.id})" style="font-size:0.72rem; padding:4px 8px; color:#EF4444;"><i class="fa-solid fa-trash"></i> Xóa</button>
                            ${isAlreadySelected ? 
                                `<button class="btn btn-secondary" disabled style="background:#E2E8F0; color:#94A3B8; font-size:0.72rem; padding:4px 8px;">Đã chọn</button>` : 
                                `<button class="btn btn-primary btn-select" onclick="selectQuestion(${q.id})" style="font-size:0.72rem; padding:4px 8px;"><i class="fa-solid fa-circle-check"></i> Chọn</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Tự động vẽ lại KaTeX cho nội dung toán học mới
        renderMathInElement(sourceList, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
            ]
        });
    }

    // Rendering Cột Phải (Câu hỏi được chọn)
    function renderSelectedList() {
        selectedCount.textContent = `${selectedQuestions.length} câu hỏi`;
        if (selectedQuestions.length === 0) {
            selectedList.innerHTML = `<div style="text-align:center; color:#94A3B8; padding:40px 0; font-style:italic; font-size:0.9rem;"><i class="fa-solid fa-circle-question" style="font-size:2rem; display:block; margin-bottom:8px;"></i>Hãy chọn câu hỏi từ Cột nguồn để đưa vào đề thi.</div>`;
            return;
        }

        selectedList.innerHTML = selectedQuestions.map((q, index) => {
            const difficultyBadge = getDiffBadgeHTML(q.difficulty);

            return `
                <div class="q-card" data-qid="${q.id}">
                    <div style="display:flex; align-items:flex-start;">
                        <div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div>
                        <div style="flex-grow:1;">
                            <div class="q-header">
                                <span class="q-id" style="color: #047857;">Câu ${index + 1} (ID: #${q.id})</span>
                            </div>
                            <div class="q-text math-render">${q.question_text}</div>
                            
                            <!-- Dynamic preview for selected list -->
                            <div id="expanded-preview-sel-${q.id}" style="display:none;" class="q-preview-expanded-panel">
                                <div style="font-weight:700; margin-bottom:6px; color:#475569;">Các phương án lựa chọn:</div>
                                <ul style="list-style-type:none; padding-left:0; margin:0;">
                                    ${(q.options || []).map((o, idx) => `<li style="margin-bottom:4px; font-weight: ${idx === q.correct_option ? '700; color:#059669;' : '500;'}">${o} ${idx === q.correct_option ? '✓' : ''}</li>`).join('')}
                                </ul>
                                ${q.explanation ? `<div style="margin-top:10px; border-top:1px dashed #CBD5E1; padding-top:8px; font-style:italic;"><span style="font-weight:700; color:#475569;">Lời giải:</span> ${q.explanation}</div>` : ''}
                            </div>

                            <div class="q-footer">
                                <div class="q-badges">
                                    ${difficultyBadge}
                                </div>
                                <div class="q-actions">
                                    <button class="btn btn-secondary" onclick="toggleSelectedPreviewExpand(${q.id})" style="font-size:0.72rem; padding:4px 8px;"><i class="fa-solid fa-eye"></i> Xem thử</button>
                                    <button class="btn btn-unselect" onclick="unselectQuestion(${q.id})" style="font-size:0.72rem; padding:4px 8px;"><i class="fa-solid fa-trash-arrow-up"></i> Gỡ bỏ</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        renderMathInElement(selectedList, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
            ]
        });
    }

    function getDiffBadgeHTML(difficulty) {
        const map = {
            'NB': '<span class="diff-badge diff-nb">NB</span>',
            'TH': '<span class="diff-badge diff-th">TH</span>',
            'VD': '<span class="diff-badge diff-vd">VD</span>',
            'VDC': '<span class="diff-badge diff-vdc">VDC</span>'
        };
        return map[difficulty] || '<span class="diff-badge">--</span>';
    }

    // Toggle preview KaTeX
    window.togglePreviewExpand = function(qId) {
        const panel = document.getElementById(`expanded-preview-${qId}`);
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.toggleSelectedPreviewExpand = function(qId) {
        const panel = document.getElementById(`expanded-preview-sel-${qId}`);
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    };

    // Chọn câu hỏi chuyển sang cột phải
    window.selectQuestion = async function(qId) {
        if (!supabaseClient) return;

        const newOrderIndex = selectedQuestions.length + 1;
        const { error } = await supabaseClient.from('material_questions').insert({
            material_id: currentMaterialId,
            question_id: qId,
            order_index: newOrderIndex
        });

        if (error) {
            alert("Lỗi khi thêm liên kết câu hỏi: " + error.message);
            return;
        }

        await reloadSelectedQuestions();
    };

    // Gỡ câu hỏi ra khỏi đề thi
    window.unselectQuestion = async function(qId) {
        if (!supabaseClient) return;

        const { error } = await supabaseClient.from('material_questions').delete()
            .eq('material_id', currentMaterialId)
            .eq('question_id', qId);

        if (error) {
            alert("Lỗi khi gỡ liên kết câu hỏi: " + error.message);
            return;
        }

        await reloadSelectedQuestions();
    };

    // Xóa vĩnh viễn câu hỏi khỏi ngân hàng
    window.deleteQuestion = async function(qId) {
        if (!confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN câu hỏi #${qId} khỏi ngân hàng câu hỏi? Thao tác này sẽ tự động gỡ câu hỏi khỏi tất cả học liệu trắc nghiệm.`)) return;

        const { error } = await supabaseClient.from('questions').delete().eq('id', qId);
        if (error) {
            alert("Lỗi khi xóa câu hỏi: " + error.message);
            return;
        }

        await reloadAll();
    };

    // Drag Drop Sorting
    function initDragAndDrop() {
        if (typeof Sortable === 'undefined') return;

        Sortable.create(selectedList, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: async function () {
                const items = selectedList.querySelectorAll('.q-card');
                if (items.length === 0) return;

                const promises = Array.from(items).map((item, index) => {
                    const qId = parseInt(item.getAttribute('data-qid'));
                    return supabaseClient.from('material_questions')
                        .update({ order_index: index + 1 })
                        .eq('material_id', currentMaterialId)
                        .eq('question_id', qId);
                });

                try {
                    await Promise.all(promises);
                    console.log("Đã lưu thứ tự câu hỏi mới.");
                } catch (e) {
                    console.error("Lỗi lưu thứ tự kéo thả:", e);
                }

                // Tải lại danh sách để đồng bộ thứ tự chỉ số index
                await reloadSelectedQuestions();
            }
        });
    }

    // Modal CRUD Question logic
    window.openQuestionModal = function(qId = null) {
        editingQuestionId = qId;
        questionForm.reset();

        if (qId) {
            questionModalTitle.textContent = "Chỉnh sửa câu hỏi";
            const q = allQuestions.find(item => item.id === qId);
            if (q) {
                // Set difficulty
                const diffRadio = document.querySelector(`input[name="qfDifficulty"][value="${q.difficulty}"]`);
                if (diffRadio) diffRadio.checked = true;

                // Set question text
                document.getElementById('qfQuestionText').value = q.question_text || '';

                // Set options
                const options = q.options || [];
                document.getElementById('qfOptionA').value = options[0] || '';
                document.getElementById('qfOptionB').value = options[1] || '';
                document.getElementById('qfOptionC').value = options[2] || '';
                document.getElementById('qfOptionD').value = options[3] || '';

                // Set correct option
                const correctRadio = document.querySelector(`input[name="qfCorrect"][value="${q.correct_option}"]`);
                if (correctRadio) correctRadio.checked = true;

                // Set explanation
                document.getElementById('qfExplanation').value = q.explanation || '';
            }
        } else {
            questionModalTitle.textContent = "Tạo câu hỏi mới";
        }

        updateQuestionPreview();
        questionModal.classList.add('active');
    };

    window.closeQuestionModal = function() {
        questionModal.classList.remove('active');
        editingQuestionId = null;
    };

    // Sửa câu hỏi
    window.editQuestion = function(qId) {
        openQuestionModal(qId);
    };

    // Live Preview KaTeX
    window.updateQuestionPreview = function() {
        const previewEl = document.getElementById('qbPreviewContent');
        if (!previewEl) return;

        const qText = document.getElementById('qfQuestionText').value.trim();
        const optA = document.getElementById('qfOptionA').value.trim();
        const optB = document.getElementById('qfOptionB').value.trim();
        const optC = document.getElementById('qfOptionC').value.trim();
        const optD = document.getElementById('qfOptionD').value.trim();
        const correctRadio = document.querySelector('input[name="qfCorrect"]:checked');
        const correctIdx = correctRadio ? parseInt(correctRadio.value) : 0;
        const explanation = document.getElementById('qfExplanation').value.trim();

        if (!qText && !optA && !optB && !optC && !optD) {
            previewEl.innerHTML = `<p style="color:#94A3B8; font-style:italic; margin:0;">Nhập nội dung câu hỏi để bắt đầu xem trước...</p>`;
            return;
        }

        previewEl.innerHTML = `
            <div style="font-weight:700; margin-bottom:8px; color:var(--text-main);">${qText || '(Chưa nhập nội dung câu hỏi)'}</div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:8px;">
                <div style="padding:6px 12px; border-radius:6px; background:${correctIdx === 0 ? '#D1FAE5; font-weight:700; border:1px solid #10B981;' : '#F1F5F9;'}">A. ${optA || ''}</div>
                <div style="padding:6px 12px; border-radius:6px; background:${correctIdx === 1 ? '#D1FAE5; font-weight:700; border:1px solid #10B981;' : '#F1F5F9;'}">B. ${optB || ''}</div>
                <div style="padding:6px 12px; border-radius:6px; background:${correctIdx === 2 ? '#D1FAE5; font-weight:700; border:1px solid #10B981;' : '#F1F5F9;'}">C. ${optC || ''}</div>
                <div style="padding:6px 12px; border-radius:6px; background:${correctIdx === 3 ? '#D1FAE5; font-weight:700; border:1px solid #10B981;' : '#F1F5F9;'}">D. ${optD || ''}</div>
            </div>
            ${explanation ? `
                <div class="q-preview-explanation">
                    <span style="font-weight:700; color:#475569;"><i class="fa-solid fa-lightbulb"></i> Lời giải chi tiết:</span><br>
                    ${explanation}
                </div>
            ` : ''}
        `;

        // Render KaTeX
        renderMathInElement(previewEl, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
            ]
        });
    };

    // Save Question (insert/update)
    window.saveQuestion = async function(event) {
        event.preventDefault();
        if (!supabaseClient) return;

        const difficulty = document.querySelector('input[name="qfDifficulty"]:checked').value;
        const questionText = document.getElementById('qfQuestionText').value.trim();
        const optionA = document.getElementById('qfOptionA').value.trim();
        const optionB = document.getElementById('qfOptionB').value.trim();
        const optionC = document.getElementById('qfOptionC').value.trim();
        const optionD = document.getElementById('qfOptionD').value.trim();
        const correctOption = parseInt(document.querySelector('input[name="qfCorrect"]:checked').value);
        const explanation = document.getElementById('qfExplanation').value.trim();

        if (!questionText) return alert('Vui lòng nhập nội dung câu hỏi!');
        if (!optionA || !optionB || !optionC || !optionD) return alert('Vui lòng nhập đầy đủ 4 đáp án!');

        // Lấy thông tin bài học của học liệu hiện hành
        const lesson = cachedLessons.find(l => l.id == lessonId);
        const chapter = lesson ? cachedChapters.find(ch => ch.id == lesson.chapter_id) : null;

        const questionData = {
            course_id: courseId,
            chapter_id: chapter ? chapter.id : null,
            lesson_id: lessonId,
            material_id: currentMaterialId,
            question_type: 'multiple_choice',
            difficulty: difficulty,
            question_text: questionText,
            options: [optionA, optionB, optionC, optionD],
            correct_option: correctOption,
            explanation: explanation || null,
            updated_at: new Date().toISOString()
        };

        let result;
        if (editingQuestionId) {
            result = await supabaseClient.from('questions').update(questionData).eq('id', editingQuestionId).select();
        } else {
            result = await supabaseClient.from('questions').insert(questionData).select();
        }

        if (result.error) {
            alert('Lỗi lưu câu hỏi: ' + result.error.message);
            return;
        }

        const savedQuestion = result.data && result.data[0];
        if (savedQuestion) {
            // Khi tạo mới hoặc sửa: tự động tạo/cập nhật liên kết trong material_questions của học liệu hiện tại
            await supabaseClient.from('material_questions').delete().eq('question_id', savedQuestion.id);
            
            const newOrderIndex = selectedQuestions.length + 1;
            await supabaseClient.from('material_questions').insert({
                material_id: currentMaterialId,
                question_id: savedQuestion.id,
                order_index: newOrderIndex
            });
        }

        closeQuestionModal();
        await reloadAll();
    };

    // =============================================
    // ĐỒNG BỘ CHÈN NHANH CÔNG THỨC TOÁN (MATH TOOLBAR)
    // =============================================
    let lastActiveInput = document.getElementById('qfQuestionText');
    const inputIds = ['qfQuestionText', 'qfOptionA', 'qfOptionB', 'qfOptionC', 'qfOptionD', 'qfExplanation'];
    
    inputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('focus', () => {
                lastActiveInput = input;
            });
        }
    });

    const mathBtns = document.querySelectorAll('.math-btn');
    mathBtns.forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Tránh làm mất focus hiện tại
            const latex = btn.getAttribute('data-latex');
            if (lastActiveInput && latex) {
                insertTextAtCursor(lastActiveInput, latex);
            }
        });
        
        // CSS hover style cho nút chèn nhanh
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#F1F5F9';
            btn.style.borderColor = 'var(--accent-color)';
            btn.style.color = 'var(--accent-color)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#FFFFFF';
            btn.style.borderColor = '#CBD5E1';
            btn.style.color = 'inherit';
        });
    });

    function insertTextAtCursor(el, text) {
        const startPos = el.selectionStart;
        const endPos = el.selectionEnd;
        const val = el.value;
        
        el.value = val.substring(0, startPos) + text + val.substring(endPos, val.length);
        
        // Di chuyển con trỏ vào giữa dấu ngoặc {} nếu có
        let newCursorPos = startPos + text.length;
        
        // Nếu là bọc dấu $ $
        if (text === '$$') {
            newCursorPos = startPos + 1;
        } else {
            const braceIdx = text.indexOf('{');
            if (braceIdx !== -1) {
                newCursorPos = startPos + braceIdx + 1;
            }
        }
        
        el.focus();
        el.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger live preview
        updateQuestionPreview();
    }

});
