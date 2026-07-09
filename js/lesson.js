// Toán Smart Website - Lesson Dashboard Controller (Lists Lesson Materials)

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

    // Data buffers
    let currentCourse = null;
    let currentLesson = null;
    let currentChapter = null;
    let materials = [];

    // Trạng thái đăng nhập
    let isUserLoggedIn = false;
    let isAdminLoggedIn = false;
    let loggedInUser = null;

    // 1. Cấu hình breadcrumb
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

    // 3. Tải dữ liệu bài học & học liệu
    await loadLessonData();

    async function loadLessonData() {
        if (isOnline) {
            try {
                // Tải khóa học
                const { data: cData } = await supabaseClient.from('courses').select('*').eq('id', courseId).single();
                currentCourse = cData;

                // Tải bài học
                const { data: lData } = await supabaseClient.from('lessons').select('*').eq('id', lessonId).single();
                currentLesson = lData;

                if (currentLesson) {
                    // Tải chương của bài học
                    const { data: chData } = await supabaseClient.from('chapters').select('*').eq('id', currentLesson.chapter_id).single();
                    currentChapter = chData;

                    // Tải học liệu con
                    const { data: mData } = await supabaseClient
                        .from('materials')
                        .select('*')
                        .eq('lesson_id', lessonId)
                        .order('order_index', { ascending: true });
                    materials = mData || [];
                }
            } catch (err) {
                console.error("Lỗi Supabase, tải offline:", err);
                loadOfflineLessonData();
            }
        } else {
            loadOfflineLessonData();
        }

        // Render dữ liệu
        renderPageContent();
    }

    function loadOfflineLessonData() {
        const dbCourses = JSON.parse(localStorage.getItem('db_courses')) || [];
        const dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
        const dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
        const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];

        currentCourse = dbCourses.find(c => c.id == courseId);
        currentLesson = dbLessons.find(l => l.id == lessonId);

        if (currentLesson) {
            currentChapter = dbChapters.find(ch => ch.id == currentLesson.chapter_id);
            materials = dbMaterials.filter(m => m.lesson_id == lessonId).sort((a,b) => a.order_index - b.order_index);
        }
    }

    function renderPageContent() {
        if (!currentLesson) {
            lessonPageTitle.textContent = "Không tìm thấy bài học";
            materialsGrid.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Bài học không tồn tại hoặc đã bị xóa.</div>`;
            return;
        }

        // Render Breadcrumb & Title
        if (breadcrumbCourseLink && currentCourse) {
            breadcrumbCourseLink.textContent = currentCourse.title;
        }
        if (breadcrumbLessonTitle) {
            breadcrumbLessonTitle.textContent = currentLesson.title;
        }
        if (lessonPageTitle) {
            lessonPageTitle.textContent = currentLesson.title;
        }

        // Render Materials list
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

            card.innerHTML = `
                <div class="material-card-left">
                    <div class="material-card-icon ${iconTypeClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <span class="material-card-title">${m.title}</span>
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

            materialsGrid.appendChild(card);
        });
    }
});
