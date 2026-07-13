// Toán Smart Website - Lesson Dashboard Controller (Lists Lesson Materials with Sidebar)

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 1;
    const lessonId = parseInt(urlParams.get('lesson_id'));

    if (!lessonId) {
        window.location.href = `course-detail.html?id=${courseId}`;
        return;
    }

    // DOM Elements
    const breadcrumbCourseLink = document.getElementById('breadcrumbCourseLink');
    const breadcrumbLessonTitle = document.getElementById('breadcrumbLessonTitle');
    const lessonPageTitle = document.getElementById('lessonPageTitle');
    const materialsGrid = document.getElementById('materialsGrid');
    const treeContainer = document.getElementById('studyTreeContainer');
    const backToCourseBtn = document.getElementById('backToCourseBtn');

    // Data buffers
    let currentCourse = null;
    let currentLesson = null;
    let currentChapter = null;
    let chapters = [];
    let lessonsMap = {};
    let materialsMap = {};
    let materials = []; // Học liệu của bài học hiện tại

    // Trạng thái đăng nhập
    let isUserLoggedIn = false;
    let isAdminLoggedIn = false;
    let loggedInUser = null;

    // Teacher edit variables
    let editingNameType = '';
    let editingNameId = null;
    let targetLessonId = null;
    let targetMaterialId = null;

    // 1. Cấu hình nút quay lại
    if (backToCourseBtn) {
        backToCourseBtn.href = `course-detail.html?id=${courseId}`;
    }
    if (breadcrumbCourseLink) {
        breadcrumbCourseLink.href = `course-detail.html?id=${courseId}`;
    }

    // 2. Xác thực
    await checkAuth();

    async function checkAuth() {
        if (isOnline) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    isUserLoggedIn = true;
                    loggedInUser = {
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        email: session.user.email
                    };
                    if (session.user.email === 'admin@toansmart.edu.vn' || session.user.email === 'trungtamtoansmart@gmail.com') {
                        isAdminLoggedIn = true;
                    }
                }
            } catch (err) {
                console.error("Lỗi Auth:", err);
            }
        } else {
            const demoAdmin = localStorage.getItem('demo_admin_user');
            const demoStudent = localStorage.getItem('demo_student_user');
            if (demoAdmin) {
                isUserLoggedIn = true;
                isAdminLoggedIn = true;
                const data = JSON.parse(demoAdmin);
                loggedInUser = { name: data.name, email: data.email };
            } else if (demoStudent) {
                isUserLoggedIn = true;
                const data = JSON.parse(demoStudent);
                loggedInUser = { name: data.name, email: data.email };
            }
        }
        initHeaderAuth();
    }

    function initHeaderAuth() {
        const authContainer = document.getElementById('headerAuthContainer');
        if (!authContainer) return;

        if (isUserLoggedIn && loggedInUser) {
            const avatarChar = loggedInUser.name.charAt(0).toUpperCase();
            authContainer.innerHTML = `
                <div class="user-profile-menu">
                    <div class="profile-trigger" id="profileTrigger">
                        <div class="user-avatar">${avatarChar}</div>
                        <span class="user-name-span" style="font-weight: 600;">${loggedInUser.name}</span>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 4px;"></i>
                    </div>
                    <div class="profile-dropdown-menu" id="profileDropdown">
                        <div class="profile-dropdown-header">
                            <span class="user-name">${loggedInUser.name}</span>
                            <span class="user-email">${loggedInUser.email}</span>
                        </div>
                        <ul class="profile-dropdown-list">
                            ${isAdminLoggedIn ? `
                                <li class="profile-dropdown-item"><a href="admin.html"><i class="fa-solid fa-gauge"></i> Trang Dashboard</a></li>
                            ` : ''}
                            <li class="profile-dropdown-item logout-btn"><button id="headerLogoutBtn" style="border: none; background: none; width: 100%; text-align: left; padding: 10px 12px; cursor: pointer;"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</button></li>
                        </ul>
                    </div>
                </div>
            `;

            const trigger = document.getElementById('profileTrigger');
            const dropdown = document.getElementById('profileDropdown');

            if (trigger && dropdown) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('active');
                });
                document.addEventListener('click', (e) => {
                    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
                        dropdown.classList.remove('active');
                    }
                });
            }

            const logoutBtn = document.getElementById('headerLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    if (isOnline) {
                        await supabaseClient.auth.signOut();
                    } else {
                        localStorage.removeItem('demo_admin_user');
                        localStorage.removeItem('demo_student_user');
                    }
                    alert("Đã đăng xuất!");
                    window.location.reload();
                });
            }
        } else {
            authContainer.innerHTML = `
                <a href="login.html" class="btn btn-primary" id="headerLoginBtn" style="padding: 8px 20px;"><i class="fa-solid fa-user-lock" style="margin-right: 6px;"></i> Đăng nhập</a>
            `;
            const loginBtn = document.getElementById('headerLoginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    sessionStorage.setItem('redirectAfterLogin', window.location.href);
                });
            }
        }
    }

    // 3. Tải toàn bộ dữ liệu lộ trình của khóa học để dựng mục lục
    await loadLessonData();

    async function loadLessonData() {
        // Clear maps to prevent duplication on data reload
        lessonsMap = {};
        materialsMap = {};
        if (isOnline) {
            try {
                // Tải khóa học
                const { data: cData } = await supabaseClient.from('courses').select('*').eq('id', courseId).single();
                currentCourse = cData;

                // Tải toàn bộ chương của khóa học
                const { data: chData } = await supabaseClient.from('chapters').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
                chapters = chData || [];

                const chIds = chapters.map(ch => ch.id);
                if (chIds.length > 0) {
                    // Tải toàn bộ bài giảng của khóa học
                    const { data: lData } = await supabaseClient.from('lessons').select('*').in('chapter_id', chIds).order('order_index', { ascending: true });
                    
                    const lIds = [];
                    lData.forEach(lesson => {
                        if (!lessonsMap[lesson.chapter_id]) lessonsMap[lesson.chapter_id] = [];
                        lessonsMap[lesson.chapter_id].push(lesson);
                        lIds.push(lesson.id);
                        
                        if (lesson.id === lessonId) {
                            currentLesson = lesson;
                        }
                    });

                    // Tải toàn bộ học liệu của khóa học
                    if (lIds.length > 0) {
                        const { data: mData } = await supabaseClient.from('materials').select('*').in('lesson_id', lIds).order('order_index', { ascending: true });
                        mData.forEach(m => {
                            if (!materialsMap[m.lesson_id]) materialsMap[m.lesson_id] = [];
                            materialsMap[m.lesson_id].push(m);
                        });
                    }
                }

                if (currentLesson) {
                    currentChapter = chapters.find(ch => ch.id === currentLesson.chapter_id);
                    materials = materialsMap[lessonId] || [];
                }
            } catch (err) {
                console.error("Lỗi Supabase, tải offline:", err);
                loadOfflineLessonData();
            }
        } else {
            loadOfflineLessonData();
        }

        // Render dữ liệu
        renderSidebarTree();
        renderPageContent();
    }

    function loadOfflineLessonData() {
        const dbCourses = JSON.parse(localStorage.getItem('db_courses')) || [];
        const dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
        const dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
        const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];

        currentCourse = dbCourses.find(c => c.id == courseId);
        chapters = dbChapters.filter(ch => ch.course_id == courseId).sort((a,b) => a.order_index - b.order_index);

        chapters.forEach(ch => {
            lessonsMap[ch.id] = dbLessons.filter(l => l.chapter_id == ch.id).sort((a,b) => a.order_index - b.order_index);
            lessonsMap[ch.id].forEach(l => {
                materialsMap[l.id] = dbMaterials.filter(m => m.lesson_id == l.id).sort((a,b) => a.order_index - b.order_index);
            });
        });

        currentLesson = dbLessons.find(l => l.id == lessonId);
        if (currentLesson) {
            currentChapter = chapters.find(ch => ch.id == currentLesson.chapter_id);
            materials = materialsMap[lessonId] || [];
        }
    }
    // 4. Render Sidebar mục lục chỉ hiển thị Chương hiện tại đang xem
    function renderSidebarTree() {
        if (!treeContainer) return;
        treeContainer.innerHTML = '';

        if (!currentChapter) {
            treeContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Chưa có chương học nào.</div>`;
            return;
        }

        const chDiv = document.createElement('div');
        chDiv.className = 'study-chapter';
        
        const chTitle = document.createElement('div');
        chTitle.className = 'study-chapter-title active';
        chTitle.style.fontWeight = '700';
        chTitle.style.color = 'var(--text-primary)';
        chTitle.style.borderLeft = '3px solid var(--accent-color)';
        chTitle.style.paddingLeft = '8px';
        chTitle.style.cursor = 'pointer';
        chTitle.textContent = currentChapter.title;
        
        // Click vào tiêu đề Chương dẫn về trang Lộ trình khóa học chính (nơi chứa tất cả các bài)
        chTitle.onclick = () => {
            window.location.href = `course-detail.html?id=${courseId}`;
        };
        chDiv.appendChild(chTitle);

        const lessonsList = document.createElement('ul');
        lessonsList.className = 'study-lessons-list';
        lessonsList.style.paddingLeft = '8px';
        lessonsList.style.marginTop = '12px';

        const lessons = lessonsMap[currentChapter.id] || [];
        lessons.forEach(l => {
            const lLi = document.createElement('li');
            lLi.style.listStyle = 'none';
            lLi.style.marginBottom = '8px';
            
            const isCurrentLesson = (l.id === lessonId);

            const lTitle = document.createElement('div');
            lTitle.className = `study-lesson-title ${isCurrentLesson ? 'active' : ''}`;
            lTitle.style.cursor = 'pointer';
            lTitle.style.padding = '8px 12px';
            lTitle.style.borderRadius = '6px';
            lTitle.style.fontWeight = isCurrentLesson ? '600' : '400';
            lTitle.style.fontSize = '0.9rem';
            lTitle.textContent = l.title;
            
            lTitle.onclick = () => {
                window.location.href = `lesson.html?id=${courseId}&lesson_id=${l.id}`;
            };

            lLi.appendChild(lTitle);
            lessonsList.appendChild(lLi);
        });

        chDiv.appendChild(lessonsList);
        treeContainer.appendChild(chDiv);
    }    // 5. Render nội dung thẻ học liệu chính ở cột phải
    function renderPageContent() {
        if (!currentLesson) {
            lessonPageTitle.textContent = "Không tìm thấy bài học";
            materialsGrid.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Bài học không tồn tại hoặc đã bị xóa.</div>`;
            return;
        }

        // Cập nhật Breadcrumb
        const breadcrumb = document.getElementById('lessonBreadcrumb');
        if (breadcrumb && currentChapter) {
            breadcrumb.innerHTML = `
                <a href="course-detail.html?id=${courseId}">${currentChapter.title}</a>
            `;
        }
        if (lessonPageTitle) {
            if (isAdminLoggedIn) {
                lessonPageTitle.innerHTML = `
                    <span class="lesson-title-text">${currentLesson.title}</span>
                    <button id="lessonEditBtn" class="edit-btn" title="Chỉnh sửa tên bài học" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 12px; font-size: 1.15rem; transition: color 0.2s; display: inline-flex !important; align-items: center;"><i class="fa-solid fa-pen"></i></button>
                    <button id="lessonGearBtn" class="gear-btn" title="Quản lý bài học" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 8px; font-size: 1.15rem; transition: color 0.2s; display: inline-flex !important; align-items: center;"><i class="fa-solid fa-gear"></i></button>
                `;
                
                document.getElementById('lessonEditBtn').addEventListener('click', () => {
                    openEditNameModal('lesson', currentLesson.id, currentLesson.title);
                });
                document.getElementById('lessonGearBtn').addEventListener('click', () => {
                    openLessonGearModal(currentLesson);
                });
            } else {
                lessonPageTitle.textContent = currentLesson.title;
            }
        }

        // Render danh sách học liệu con
        materialsGrid.innerHTML = '';
        if (materials.length === 0) {
            materialsGrid.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-secondary); font-style: italic;">Bài học này hiện chưa được thầy tải lên học liệu nào.</div>`;
            return;
        }

        materials.forEach(m => {
            const card = document.createElement('a');
            card.href = '#';

            const isLocked = !m.is_preview && !isUserLoggedIn;
            card.className = `material-card ${isLocked ? 'locked' : ''}`;

            let iconClass = 'fa-solid fa-circle-play'; // video
            let iconTypeClass = 'video';
            if (m.type === 'pdf') {
                iconClass = 'fa-regular fa-file-pdf';
                iconTypeClass = 'pdf';
            } else if (m.type === 'text') {
                iconClass = 'fa-solid fa-file-lines';
                iconTypeClass = 'text';
            } else if (m.type === 'quiz') {
                iconClass = 'fa-solid fa-square-poll-horizontal';
                iconTypeClass = 'quiz';
            }

            let editButtonsHTML = '';
            if (isAdminLoggedIn) {
                editButtonsHTML = `
                    <button class="material-edit-btn" title="Chỉnh sửa tên học liệu" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 12px; font-size: 0.95rem; transition: color 0.2s; display: inline-flex; align-items: center;"><i class="fa-solid fa-pen"></i></button>
                    <button class="material-gear-btn" title="Cấu hình học liệu" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 8px; font-size: 0.95rem; transition: color 0.2s; display: inline-flex; align-items: center;"><i class="fa-solid fa-gear"></i></button>
                `;
            }

            card.innerHTML = `
                <div class="material-card-left" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div class="material-card-icon ${iconTypeClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <span class="material-card-title">${m.title}</span>
                    ${editButtonsHTML}
                </div>
                <div class="material-card-right">
                    ${isLocked 
                        ? `<span style="color: #EF4444; font-weight: 500; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-lock"></i> Đăng nhập để mở</span>`
                        : `<i class="fa-solid fa-angle-right"></i>`
                    }
                </div>
            `;

            card.onclick = (e) => {
                e.preventDefault();
                if (isLocked) {
                    alert("Vui lòng đăng ký tài khoản và đăng nhập để xem nội dung học liệu này!");
                    sessionStorage.setItem('redirectAfterLogin', `${window.location.origin}/study.html?id=${courseId}&lesson_id=${lessonId}&material_id=${m.id}`);
                    window.location.href = 'login.html';
                } else {
                    window.location.href = `study.html?id=${courseId}&lesson_id=${lessonId}&material_id=${m.id}`;
                }
            };

            if (isAdminLoggedIn) {
                const penBtn = card.querySelector('.material-edit-btn');
                const gearBtn = card.querySelector('.material-gear-btn');
                
                if (penBtn) {
                    penBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditNameModal('material', m.id, m.title);
                    });
                }
                if (gearBtn) {
                    gearBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openMaterialGearModal(m);
                    });
                }
            }

            materialsGrid.appendChild(card);
        });
    }

    // --- LOGIC QUẢN LÝ DÀNH CHO GIÁO VIÊN ---
    
    // 1. Mở Modal Đổi Tên
    function openEditNameModal(type, id, currentTitle) {
        editingNameType = type;
        editingNameId = id;
        document.getElementById('editNameInput').value = currentTitle;
        document.getElementById('editNameModalTitle').textContent = type === 'lesson' ? 'Chỉnh sửa tiêu đề bài học' : 'Chỉnh sửa tiêu đề học liệu';
        document.getElementById('editNameModal').classList.add('active');
    }

    // 2. Mở Modal Quản Lý Bài Học (Bánh răng)
    function openLessonGearModal(lesson) {
        targetLessonId = lesson.id;
        document.getElementById('newMaterialTitle').value = '';
        document.getElementById('newMaterialType').value = 'video';
        
        // Tự động tính thứ tự hiển thị tiếp theo
        const nextOrder = materials.length > 0 ? Math.max(...materials.map(m => m.order_index)) + 1 : 1;
        document.getElementById('newMaterialOrder').value = nextOrder;
        
        document.getElementById('newMaterialUrl').value = '';
        document.getElementById('newMaterialFileInput').value = '';
        document.getElementById('newMaterialPreview').checked = false;
        
        // Reset trường hiển thị
        document.getElementById('newMaterialUrlGroup').style.display = 'block';
        document.getElementById('newMaterialUploadGroup').style.display = 'none';
        document.getElementById('newMaterialUrlLabel').textContent = 'Link YouTube (Nhúng)';
        document.getElementById('newMaterialUrl').placeholder = 'https://www.youtube.com/embed/...';
        
        document.getElementById('lessonGearModalTitle').textContent = `Quản lý bài học: ${lesson.title}`;
        document.getElementById('lessonGearModal').classList.add('active');
    }

    // 3. Mở Modal Quản Lý Học Liệu (Bánh răng)
    function openMaterialGearModal(material) {
        targetMaterialId = material.id;
        document.getElementById('editMaterialOrder').value = material.order_index;
        document.getElementById('editMaterialPreview').checked = material.is_preview;

        // Reset hiển thị động theo loại
        document.getElementById('videoMaterialFields').style.display = 'none';
        document.getElementById('pdfMaterialFields').style.display = 'none';
        document.getElementById('otherMaterialFields').style.display = 'none';

        if (material.type === 'video') {
            document.getElementById('videoMaterialFields').style.display = 'block';
            document.getElementById('videoMaterialUrl').value = material.url || '';
        } else if (material.type === 'pdf') {
            document.getElementById('pdfMaterialFields').style.display = 'block';
            document.getElementById('pdfMaterialUrl').value = material.url || '';
            document.getElementById('pdfMaterialFileInput').value = '';
        } else {
            document.getElementById('otherMaterialFields').style.display = 'block';
            document.getElementById('otherMaterialUrl').value = material.url || '';
            document.getElementById('editMaterialContent').value = material.content || '';
        }

        document.getElementById('materialGearModalTitle').textContent = `Quản lý học liệu: ${material.title}`;
        document.getElementById('materialGearModal').classList.add('active');
    }

    // Hiển thị động các trường khi chọn loại học liệu mới
    const newMaterialTypeSelect = document.getElementById('newMaterialType');
    if (newMaterialTypeSelect) {
        newMaterialTypeSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            const urlGroup = document.getElementById('newMaterialUrlGroup');
            const uploadGroup = document.getElementById('newMaterialUploadGroup');
            const urlLabel = document.getElementById('newMaterialUrlLabel');
            const urlInput = document.getElementById('newMaterialUrl');

            if (val === 'video') {
                urlGroup.style.display = 'block';
                uploadGroup.style.display = 'none';
                urlLabel.textContent = 'Link YouTube (Nhúng)';
                urlInput.placeholder = 'https://www.youtube.com/embed/...';
            } else if (val === 'pdf') {
                urlGroup.style.display = 'block';
                uploadGroup.style.display = 'block';
                urlLabel.textContent = 'Hoặc nhập Link URL tài liệu PDF';
                urlInput.placeholder = 'assets/docs/... hoặc link online';
            } else {
                urlGroup.style.display = 'block';
                uploadGroup.style.display = 'none';
                urlLabel.textContent = 'Link URL học liệu';
                urlInput.placeholder = 'Đường dẫn liên kết...';
            }
        });
    }

    // Hỗ trợ hàm đóng tất cả modals
    window.closeModal = function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    };

    // 4. Xử lý lưu đổi tên (Lesson / Material)
    const editNameForm = document.getElementById('editNameForm');
    if (editNameForm) {
        editNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTitle = document.getElementById('editNameInput').value.trim();
            if (!newTitle) return;

            if (editingNameType === 'lesson') {
                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('lessons').update({ title: newTitle }).eq('id', editingNameId);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi cập nhật tên bài học: " + err.message);
                        return;
                    }
                } else {
                    const dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
                    const idx = dbLessons.findIndex(l => l.id == editingNameId);
                    if (idx !== -1) {
                        dbLessons[idx].title = newTitle;
                        localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
                    }
                }
            } else if (editingNameType === 'material') {
                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('materials').update({ title: newTitle }).eq('id', editingNameId);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi cập nhật tên học liệu: " + err.message);
                        return;
                    }
                } else {
                    const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                    const idx = dbMaterials.findIndex(m => m.id == editingNameId);
                    if (idx !== -1) {
                        dbMaterials[idx].title = newTitle;
                        localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
                    }
                }
            }

            alert("Đổi tên thành công!");
            closeModal('editNameModal');
            await loadLessonData(); // Tải lại dữ liệu trang
        });
    }

    // Hàm phụ hỗ trợ tải file lên Supabase Storage (hoặc giả lập khi offline)
    async function handlePdfUpload(fileInputEl, manualUrlEl) {
        const file = fileInputEl.files[0];
        let fileUrl = manualUrlEl ? manualUrlEl.value.trim() : '';

        if (file) {
            if (isOnline) {
                try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                    const filePath = `pdf/${fileName}`;
                    
                    const { data, error } = await supabaseClient.storage
                        .from('materials')
                        .upload(filePath, file);
                        
                    if (error) {
                        // Thử tạo bucket nếu lỗi chưa có bucket
                        console.error("Lỗi upload storage:", error.message);
                        alert("Không thể tự động tải file lên Supabase Storage (Có thể chưa tạo bucket 'materials' công khai). Sẽ sử dụng đường dẫn file local giả lập.");
                        fileUrl = `assets/docs/${file.name}`;
                    } else {
                        const { data: urlData } = supabaseClient.storage
                            .from('materials')
                            .getPublicUrl(filePath);
                        fileUrl = urlData.publicUrl;
                    }
                } catch (err) {
                    console.error("Lỗi upload:", err);
                    fileUrl = `assets/docs/${file.name}`;
                }
            } else {
                // Ngoại tuyến: Giả lập lưu vào assets/docs/
                fileUrl = `assets/docs/${file.name}`;
            }
        }
        return fileUrl;
    }

    // 5. Xử lý Thêm học liệu mới
    const addMaterialForm = document.getElementById('addMaterialForm');
    if (addMaterialForm) {
        addMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('newMaterialTitle').value.trim();
            const type = document.getElementById('newMaterialType').value;
            const order = parseInt(document.getElementById('newMaterialOrder').value) || 1;
            const isPreview = document.getElementById('newMaterialPreview').checked;

            // Xử lý upload file PDF hoặc lấy URL nhập tay
            let url = '';
            if (type === 'pdf') {
                const fileInput = document.getElementById('newMaterialFileInput');
                const urlInput = document.getElementById('newMaterialUrl');
                url = await handlePdfUpload(fileInput, urlInput);
            } else {
                url = document.getElementById('newMaterialUrl').value.trim();
            }

            const materialData = {
                lesson_id: targetLessonId,
                title,
                type,
                url,
                content: '',
                is_preview: isPreview,
                order_index: order
            };

            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').insert([materialData]);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi thêm học liệu: " + err.message);
                    return;
                }
            } else {
                const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                const newId = dbMaterials.length > 0 ? Math.max(...dbMaterials.map(m => m.id)) + 1 : 10001;
                dbMaterials.push({ id: newId, ...materialData });
                localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
            }

            alert("Thêm học liệu thành công!");
            closeModal('lessonGearModal');
            await loadLessonData();
        });
    }

    // 6. Xử lý Chỉnh sửa nội dung học liệu
    const editMaterialForm = document.getElementById('editMaterialForm');
    if (editMaterialForm) {
        editMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const order = parseInt(document.getElementById('editMaterialOrder').value) || 1;
            const isPreview = document.getElementById('editMaterialPreview').checked;

            // Tìm học liệu hiện tại trong bộ nhớ đệm
            let currentMat = materials.find(m => m.id == targetMaterialId);
            if (!currentMat) return;

            let url = '';
            let content = '';

            if (currentMat.type === 'video') {
                url = document.getElementById('videoMaterialUrl').value.trim();
            } else if (currentMat.type === 'pdf') {
                const fileInput = document.getElementById('pdfMaterialFileInput');
                const urlInput = document.getElementById('pdfMaterialUrl');
                url = await handlePdfUpload(fileInput, urlInput);
            } else {
                url = document.getElementById('otherMaterialUrl').value.trim();
                content = document.getElementById('editMaterialContent').value.trim();
            }

            const updatedData = {
                order_index: order,
                is_preview: isPreview,
                url,
                content
            };

            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').update(updatedData).eq('id', targetMaterialId);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi cập nhật học liệu: " + err.message);
                    return;
                }
            } else {
                const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                const idx = dbMaterials.findIndex(m => m.id == targetMaterialId);
                if (idx !== -1) {
                    dbMaterials[idx] = { ...dbMaterials[idx], ...updatedData };
                    localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
                }
            }

            alert("Cập nhật học liệu thành công!");
            closeModal('materialGearModal');
            await loadLessonData();
        });
    }

    // 7. Xử lý Xóa bài học
    const deleteLessonBtn = document.getElementById('deleteLessonBtn');
    if (deleteLessonBtn) {
        deleteLessonBtn.addEventListener('click', async () => {
            if (!confirm("Bạn có chắc chắn muốn xóa bài học này? Toàn bộ học liệu liên quan sẽ bị xóa!")) return;

            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('lessons').delete().eq('id', targetLessonId);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi xóa bài học: " + err.message);
                    return;
                }
            } else {
                // Xóa bài học
                let dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
                dbLessons = dbLessons.filter(l => l.id != targetLessonId);
                localStorage.setItem('db_lessons', JSON.stringify(dbLessons));

                // Xóa học liệu con
                let dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                dbMaterials = dbMaterials.filter(m => m.lesson_id != targetLessonId);
                localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
            }

            alert("Xóa bài học thành công!");
            closeModal('lessonGearModal');
            // Quay lại trang chi tiết khóa học vì bài này đã bị xóa
            window.location.href = `course-detail.html?id=${courseId}`;
        });
    }

    // 8. Xử lý Xóa học liệu
    const deleteMaterialBtn = document.getElementById('deleteMaterialBtn');
    if (deleteMaterialBtn) {
        deleteMaterialBtn.addEventListener('click', async () => {
            if (!confirm("Bạn có chắc chắn muốn xóa học liệu này?")) return;

            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').delete().eq('id', targetMaterialId);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi xóa học liệu: " + err.message);
                    return;
                }
            } else {
                let dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                dbMaterials = dbMaterials.filter(m => m.id != targetMaterialId);
                localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
            }

            alert("Xóa học liệu thành công!");
            closeModal('materialGearModal');
            await loadLessonData();
        });
    }
});
