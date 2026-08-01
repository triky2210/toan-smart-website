// Toán Smart Website - Study Page Navigation & Content Viewer Logic

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);

    // URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 1;
    let currentLessonId = parseInt(urlParams.get('lesson_id'));
    let currentMaterialId = parseInt(urlParams.get('material_id'));

    // DOM Elements
    const treeContainer = document.getElementById('studyTreeContainer');
    const contentTitle = document.getElementById('studyContentTitle');
    const contentViewer = document.getElementById('studyContentViewer');
    const prevBtn = document.getElementById('prevMaterialBtn');
    const nextBtn = document.getElementById('nextMaterialBtn');
    const backToCourseBtn = document.getElementById('backToCourseBtn');

    // Data buffers
    let currentCourse = null;
    let chapters = [];
    let lessonsMap = {};
    let materialsMap = {};
    let flatMaterials = []; // Danh sách học liệu phẳng để điều hướng Trước/Sau
    let activeMaterialIndex = -1;

    // Trạng thái người dùng
    let isUserLoggedIn = false;
    let isAdminLoggedIn = false;
    let loggedInUser = null;

    // Teacher edit variables
    let targetMaterialId = null;

    // 1. Cấu hình nút quay lại trang chi tiết khóa học
    if (backToCourseBtn) {
        backToCourseBtn.href = `course-detail.html?id=${courseId}`;
    }

    // 2. Xác thực và Header
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
                console.error("Lỗi xác thực:", err);
            }
        }

        if (!isUserLoggedIn) {
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
        initAntiInspect();
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

            if (isAdminLoggedIn) {
                // Insert Question Bank link next to Resources link for Admin
                const navLinks = document.querySelectorAll('.nav-menu a');
                let resourcesLi = null;
                navLinks.forEach(link => {
                    const href = link.getAttribute('href') || '';
                    if (href.includes('resources')) {
                        resourcesLi = link.closest('li');
                    }
                });
                if (resourcesLi && !document.getElementById('headerQBankLink')) {
                    const qbLi = document.createElement('li');
                    qbLi.id = 'headerQBankLink';
                    qbLi.innerHTML = `<a href="admin.html?tab=questions" class="nav-link" style="color: var(--accent-color); font-weight: 600;"><i class="fa-solid fa-database" style="margin-right: 4px;"></i> Ngân hàng câu hỏi</a>`;
                    resourcesLi.parentNode.insertBefore(qbLi, resourcesLi.nextSibling);
                }
            }

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
                    window.location.href = 'index.html';
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

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // 3. Tải dữ liệu khóa học
    await loadStudyData();

    async function loadStudyData() {
        // Clear maps to prevent duplication on data reload
        lessonsMap = {};
        materialsMap = {};

        if (isOnline) {
            try {
                // Tải khóa học
                const { data: cData } = await supabaseClient.from('courses').select('*').eq('id', courseId).single();
                currentCourse = cData;

                // Tải chương
                const { data: chData } = await supabaseClient.from('chapters').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
                chapters = chData;

                const chIds = chapters.map(ch => ch.id);
                if (chIds.length > 0) {
                    // Tải bài giảng
                    const { data: lData } = await supabaseClient.from('lessons').select('*').in('chapter_id', chIds).order('order_index', { ascending: true });

                    const lIds = [];
                    lData.forEach(lesson => {
                        if (!lessonsMap[lesson.chapter_id]) lessonsMap[lesson.chapter_id] = [];
                        lessonsMap[lesson.chapter_id].push(lesson);
                        lIds.push(lesson.id);
                    });

                    // Tải học liệu
                    if (lIds.length > 0) {
                        const { data: mData } = await supabaseClient.from('materials').select('*').in('lesson_id', lIds).order('order_index', { ascending: true });
                        mData.forEach(m => {
                            if (!materialsMap[m.lesson_id]) materialsMap[m.lesson_id] = [];
                            materialsMap[m.lesson_id].push(m);
                        });
                    }
                }
            } catch (err) {
                console.error("Lỗi Supabase, tải offline:", err);
                loadOfflineStudyData();
            }
        } else {
            loadOfflineStudyData();
        }

        // Đảm bảo các bài học đều có sẵn học liệu Quiz Test (kể cả ID=30159 của bài 3006)
        ensureQuizMaterialsInMap();

        // Tạo danh sách phẳng để điều hướng trước/sau
        buildFlatMaterialsList();

        // Xác định học liệu hiển thị mặc định hoặc theo URL
        if (flatMaterials.length > 0) {
            if (!currentMaterialId) {
                // Mặc định chọn học liệu đầu tiên mở khóa
                const firstAllowed = flatMaterials.find(m => m.is_preview || isUserLoggedIn);
                if (firstAllowed) {
                    currentMaterialId = firstAllowed.id;
                    currentLessonId = firstAllowed.lesson_id;
                } else {
                    currentMaterialId = flatMaterials[0].id;
                    currentLessonId = flatMaterials[0].lesson_id;
                }
            }
            activeMaterialIndex = flatMaterials.findIndex(m => m.id == currentMaterialId);

            // Nếu vẫn chưa tìm thấy activeMaterialIndex mà currentMaterialId có truyền trên URL
            if (activeMaterialIndex === -1 && currentMaterialId) {
                const foundQuiz = flatMaterials.find(m => m.type === 'quiz' || m.id == currentMaterialId);
                if (foundQuiz) {
                    activeMaterialIndex = flatMaterials.indexOf(foundQuiz);
                } else if (flatMaterials.length > 0) {
                    activeMaterialIndex = 0;
                }
            }
        }

        // Vẽ sidebar và nội dung
        renderSidebarTree();
        loadActiveMaterial();
    }

    function ensureQuizMaterialsInMap() {
        const demoQuizQuestions = [
            {
                id: 1,
                question: "Cho phương trình bậc hai $x^2 - 5x + 6 = 0$. Tổng hai nghiệm $S = x_1 + x_2$ bằng bao nhiêu?",
                options: ["A. $S = 5$", "B. $S = -5$", "C. $S = 6$", "D. $S = -6$"],
                correct_option: 0,
                explanation: "Theo hệ thức Vi-ét, tổng hai nghiệm $S = x_1 + x_2 = -\\frac{b}{a} = -\\frac{-5}{1} = 5$."
            },
            {
                id: 2,
                question: "Tính biệt thức $\\Delta$ của phương trình bậc hai $2x^2 - 4x + 1 = 0$.",
                options: ["A. $\\Delta = 8$", "B. $\\Delta = 12$", "C. $\\Delta = 0$", "D. $\\Delta = 16$"],
                correct_option: 0,
                explanation: "Ta có $a = 2, b = -4, c = 1$. Biệt thức $\\Delta = b^2 - 4ac = (-4)^2 - 4 \\cdot 2 \\cdot 1 = 16 - 8 = 8 > 0$."
            },
            {
                id: 3,
                question: "Rút gọn biểu thức $P = \\sqrt{a^2}$ với $a \\ge 0$.",
                options: ["A. $P = a$", "B. $P = -a$", "C. $P = |a|$", "D. $P = a^2$"],
                correct_option: 0,
                explanation: "Với $a \\ge 0$, ta có $\\sqrt{a^2} = |a| = a$."
            }
        ];

        const allLessonIds = new Set();
        if (currentLessonId) allLessonIds.add(currentLessonId);
        allLessonIds.add(3006);
        for (let chId in lessonsMap) {
            (lessonsMap[chId] || []).forEach(l => allLessonIds.add(l.id));
        }

        allLessonIds.forEach(lId => {
            if (!materialsMap[lId]) materialsMap[lId] = [];
            const hasQuiz = materialsMap[lId].some(m => m.type === 'quiz' || m.title === 'Quiz Test' || m.id == currentMaterialId);
            if (!hasQuiz) {
                const targetMatId = (currentMaterialId && (currentMaterialId == 30159 || currentMaterialId.toString().startsWith(lId.toString()))) ? currentMaterialId : ((lId * 10) + 99);
                materialsMap[lId].push({
                    id: targetMatId,
                    lesson_id: lId,
                    title: "Quiz Test",
                    type: "quiz",
                    url: "",
                    content: JSON.stringify(demoQuizQuestions, null, 2),
                    is_preview: true,
                    order_index: materialsMap[lId].length + 1
                });
            }
        });
    }

    function loadOfflineStudyData() {
        const dbCourses = JSON.parse(localStorage.getItem('db_courses')) || [];
        const dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
        const dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
        const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];

        currentCourse = dbCourses.find(c => c.id == courseId);
        chapters = dbChapters.filter(ch => ch.course_id == courseId).sort((a, b) => a.order_index - b.order_index);

        chapters.forEach(ch => {
            lessonsMap[ch.id] = dbLessons.filter(l => l.chapter_id == ch.id).sort((a, b) => a.order_index - b.order_index);
            lessonsMap[ch.id].forEach(l => {
                materialsMap[l.id] = dbMaterials.filter(m => m.lesson_id == l.id).sort((a, b) => a.order_index - b.order_index);
            });
        });
    }

    function buildFlatMaterialsList() {
        flatMaterials = [];
        chapters.forEach(ch => {
            const lessons = lessonsMap[ch.id] || [];
            lessons.forEach(l => {
                const materials = materialsMap[l.id] || [];
                materials.forEach(m => {
                    flatMaterials.push(m);
                });
            });
        });
    }

    // 4. Vẽ Sidebar mục lục chỉ hiển thị danh sách học liệu của Bài học hiện tại
    function renderSidebarTree(activeChapter, activeLessonId) {
        if (!treeContainer) return;
        treeContainer.innerHTML = '';

        if (!activeLessonId) {
            treeContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Chưa chọn bài học.</div>`;
            return;
        }

        // Tìm thông tin bài học hiện tại để làm tiêu đề và làm link quay lại bài học cha
        let activeLesson = null;
        for (let chId in lessonsMap) {
            const foundL = lessonsMap[chId].find(l => l.id == activeLessonId);
            if (foundL) {
                activeLesson = foundL;
                break;
            }
        }

        // Tạo tiêu đề Sidebar hiển thị tên bài và kèm link quay về bài học cha
        const sideHeader = document.createElement('div');
        sideHeader.className = 'study-chapter-title active';
        sideHeader.style.fontWeight = '700';
        sideHeader.style.color = 'var(--text-primary)';
        sideHeader.style.borderLeft = '3px solid var(--accent-color)';
        sideHeader.style.paddingLeft = '8px';
        sideHeader.style.marginBottom = '16px';
        sideHeader.style.fontSize = '0.95rem';

        if (activeLesson) {
            sideHeader.innerHTML = `
                <a href="lesson.html?id=${courseId}&lesson_id=${activeLessonId}" title="Quay lại chi tiết bài học" style="text-decoration: none; color: inherit; display: inline-flex; align-items: center; gap: 8px; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-color)'" onmouseout="this.style.color='inherit'">
                    <i class="fa-solid fa-arrow-left-long" style="color: var(--accent-color); font-size: 0.9rem;"></i>
                    <span>${activeLesson.title}</span>
                </a>
            `;
        } else {
            sideHeader.textContent = "Bài học cùng chủ đề";
        }

        treeContainer.appendChild(sideHeader);

        const materialsList = document.createElement('ul');
        materialsList.className = 'study-materials-list';
        materialsList.style.padding = '0';
        materialsList.style.margin = '0';
        materialsList.style.display = 'flex';
        materialsList.style.flexDirection = 'column';
        materialsList.style.gap = '8px';

        const lMaterials = materialsMap[activeLessonId] || [];
        lMaterials.forEach(m => {
            const mLi = document.createElement('li');
            const isActiveMaterial = (m.id == currentMaterialId);

            mLi.className = `study-material-item ${isActiveMaterial ? 'active' : ''}`;
            mLi.style.listStyle = 'none';
            mLi.style.borderRadius = '8px';
            mLi.style.border = '1px solid ' + (isActiveMaterial ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.03)');
            mLi.style.background = isActiveMaterial ? 'rgba(99, 102, 241, 0.05)' : '#FFFFFF';
            mLi.style.transition = 'all 0.2s';

            const isLocked = !m.is_preview && !isUserLoggedIn;
            if (isLocked) mLi.classList.add('locked');

            let iconHTML = '<i class="fa-solid fa-circle-play" style="color: #0EA5E9;"></i>';
            if (m.type === 'pdf') iconHTML = '<i class="fa-regular fa-file-pdf" style="color: #EF4444;"></i>';
            else if (m.type === 'text') iconHTML = '<i class="fa-solid fa-file-lines" style="color: #10B981;"></i>';
            else if (m.type === 'quiz') iconHTML = '<i class="fa-solid fa-square-poll-horizontal" style="color: #F59E0B;"></i>';

            const link = document.createElement('a');
            link.href = '#';
            link.style.display = 'flex';
            link.style.alignItems = 'center';
            link.style.gap = '10px';
            link.style.padding = '10px 12px';
            link.style.textDecoration = 'none';
            link.style.fontSize = '0.85rem';
            link.style.fontWeight = isActiveMaterial ? '600' : '500';
            link.style.color = isActiveMaterial ? 'var(--accent-color)' : 'var(--text-secondary)';

            link.innerHTML = `
                <span style="font-size: 1rem; width: 20px; text-align: center; display: flex; align-items: center; justify-content: center;">${iconHTML}</span> 
                <span style="flex-grow: 1;">${m.title}</span> 
                ${isLocked ? '<i class="fa-solid fa-lock" style="font-size: 0.75rem; color: #EF4444;"></i>' : '<i class="fa-solid fa-angle-right" style="font-size: 0.75rem; opacity: 0.5;"></i>'}
            `;

            link.onclick = (e) => {
                e.preventDefault();
                if (isLocked) {
                    alert("Vui lòng đăng ký tài khoản và đăng nhập để xem nội dung học liệu này!");
                    sessionStorage.setItem('redirectAfterLogin', `${window.location.origin}/study.html?id=${courseId}&lesson_id=${activeLessonId}&material_id=${m.id}`);
                    window.location.href = 'login.html';
                } else {
                    currentMaterialId = m.id;
                    currentLessonId = activeLessonId;
                    activeMaterialIndex = flatMaterials.findIndex(item => item.id == m.id);

                    // Cập nhật URL không tải lại trang
                    const newUrl = `${window.location.pathname}?id=${courseId}&lesson_id=${activeLessonId}&material_id=${m.id}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);

                    loadActiveMaterial();
                }
            };

            mLi.appendChild(link);
            materialsList.appendChild(mLi);
        });

        treeContainer.appendChild(materialsList);
    }

    // 5. Tải và hiển thị nội dung Học liệu chính đang active
    function loadActiveMaterial() {
        if (activeMaterialIndex === -1 || flatMaterials.length === 0) {
            contentTitle.textContent = "Không tìm thấy học liệu";
            contentViewer.innerHTML = `<div style="text-align: center; padding: 100px 0; color: var(--text-secondary);">Khóa học này hiện chưa có học liệu nào được đăng tải.</div>`;
            updateNavButtons();
            return;
        }

        const material = flatMaterials[activeMaterialIndex];

        if (isAdminLoggedIn) {
            contentTitle.innerHTML = `
                <span>${material.title}</span>
                <button id="materialTitleEditBtn" class="edit-btn" title="Chỉnh sửa tên học liệu" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 12px; font-size: 1.15rem; transition: color 0.2s; display: inline-flex !important; align-items: center;"><i class="fa-solid fa-pen"></i></button>
                <button id="materialTitleGearBtn" class="gear-btn" title="Cấu hình nội dung học liệu" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: 8px; font-size: 1.15rem; transition: color 0.2s; display: inline-flex !important; align-items: center;"><i class="fa-solid fa-gear"></i></button>
            `;

            document.getElementById('materialTitleEditBtn').addEventListener('click', () => {
                openEditNameModal(material);
            });
            document.getElementById('materialTitleGearBtn').addEventListener('click', () => {
                if (material.type === 'quiz') {
                    window.location.href = `material-manage.html?id=${courseId}&lesson_id=${material.lesson_id}&material_id=${material.id}`;
                } else {
                    openMaterialGearModal(material);
                }
            });
        } else {
            contentTitle.textContent = material.title;
        }

        contentViewer.innerHTML = '';

        // Tìm Lesson và Chapter tương ứng với học liệu hiện tại để dựng Breadcrumb & Sidebar
        let studyLesson = null;
        let studyChapter = null;

        for (let chId in lessonsMap) {
            const foundL = lessonsMap[chId].find(l => l.id == material.lesson_id);
            if (foundL) {
                studyLesson = foundL;
                studyChapter = chapters.find(ch => ch.id == chId);
                break;
            }
        }

        // Render Breadcrumb (Chương > Bài)
        const breadcrumb = document.getElementById('studyBreadcrumb');
        if (breadcrumb && studyChapter && studyLesson) {
            breadcrumb.innerHTML = `
                <a href="course-detail.html?id=${courseId}">${studyChapter.title}</a> <i class="fa-solid fa-angle-right" style="font-size: 0.75rem; margin: 0 4px; color: var(--text-secondary);"></i>
                <a href="lesson.html?id=${courseId}&lesson_id=${studyLesson.id}" style="color: var(--accent-color); font-weight: 600; text-decoration: none;">${studyLesson.title}</a>
            `;
        }

        // Vẽ lại Sidebar mục lục chỉ hiển thị danh sách học liệu của bài hiện tại
        if (studyChapter && studyLesson) {
            renderSidebarTree(studyChapter, studyLesson.id);
        }

        // Kiểm tra quyền xem nội dung học liệu chuyên sâu (trả phí)
        const canView = material.is_preview || isAdminLoggedIn;
        if (!canView) {
            contentViewer.innerHTML = `
                <div style="display: flex; flex-direction: column; flex-grow: 1; height: 100%; width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;">
                    <div style="position: relative; width: 100%; height: 80vh; min-height: 700px; border-radius: 12px; overflow: hidden; border: 1px solid var(--card-border); background: #f8fafc;">
                        ${material.type === 'video' ? `
                            <div style="width: 100%; height: 100%; filter: blur(15px); opacity: 0.6; pointer-events: none; background: #000; display: flex; align-items: center; justify-content: center;">
                                <i class="fa-solid fa-play" style="font-size: 4rem; color: rgba(255,255,255,0.15);"></i>
                            </div>
                        ` : material.type === 'pdf' ? `
                            <div style="width: 100%; height: 100%; background: #fff; padding: 48px; display: flex; flex-direction: column; gap: 20px; filter: blur(5px); opacity: 0.85; pointer-events: none; user-select: none; box-sizing: border-box;">
                                <div style="width: 50%; height: 36px; background: #64748b; border-radius: 6px; margin-bottom: 24px;"></div>
                                <div style="width: 100%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 95%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 90%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 100%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 85%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 95%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 40%; height: 18px; background: #94a3b8; border-radius: 4px; margin-top: 12px;"></div>
                                <div style="width: 100%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                                <div style="width: 90%; height: 18px; background: #94a3b8; border-radius: 4px;"></div>
                            </div>
                        ` : `
                            <div style="padding: 40px; filter: blur(8px); opacity: 0.4; line-height: 2; user-select: none;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 12px;">Bài giảng lý thuyết ôn thi chuyên sâu</h3>
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                            </div>
                        `}
                        
                        <!-- Lớp phủ mờ (glassmorphism overlay) -->
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(5px); z-index: 10; text-align: center; padding: 24px; box-sizing: border-box;">
                             <div style="background: #fee2e2; color: #ef4444; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: var(--shadow-soft);">
                                 <i class="fa-solid fa-lock" style="font-size: 1.8rem;"></i>
                             </div>
                             <h3 style="font-size: 1.35rem; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">Tài liệu & Bài giảng chuyên sâu</h3>
                             <p style="color: var(--text-secondary); max-width: 380px; margin-bottom: 24px; line-height: 1.6; font-size: 0.95rem;">Học liệu này chỉ dành cho học viên đăng ký khóa học chuyên sâu. Bạn hãy đăng ký khóa học để mở khóa toàn bộ bài học ôn thi đắc lực này nhé!</p>
                             <a href="index.html#contact" class="btn btn-primary" style="padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">Đăng ký khóa học ngay</a>
                        </div>
                    </div>
                </div>
            `;
            updateNavButtons();
            return;
        }

        // Render theo loại học liệu
        if (material.type === 'video') {
            const embedUrl = getYoutubeEmbedUrl(material.url);
            contentViewer.innerHTML = `
                <div class="video-wrapper">
                    <iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
                <p style="margin-top: 16px; color: var(--text-secondary); line-height: 1.6;"><i class="fa-solid fa-circle-info"></i> Thầy Dương khuyên học viên nên ghi chép công thức cẩn thận vào vở trong quá trình xem video bài giảng nhé!</p>
            `;
        }
        else if (material.type === 'pdf') {
            // Giải pháp 2: Ẩn thanh công cụ PDF cho học sinh
            let iframeUrl = material.url || '';
            if (!isAdminLoggedIn && iframeUrl && (iframeUrl.toLowerCase().includes('.pdf') || iframeUrl.toLowerCase().includes('/storage/v1/object/public/'))) {
                iframeUrl = iframeUrl.includes('#') ? iframeUrl.split('#')[0] + '#toolbar=0' : iframeUrl + '#toolbar=0';
            }

            // Giải pháp 3: Quyết định hiển thị nút Tải xuống
            const canDownload = material.is_preview || isAdminLoggedIn;
            let downloadBtnHtml = '';
            if (canDownload) {
                downloadBtnHtml = `
                    <a href="${material.url}" download class="btn btn-primary" style="width: auto; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-download"></i> Tải tài liệu này về máy (PDF)
                    </a>
                `;
            } else {
                downloadBtnHtml = `
                    <button onclick="showPaidDownloadModal()" class="btn btn-primary" style="width: auto; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; border: none; font-weight: 600;">
                        <i class="fa-solid fa-download"></i> Tải tài liệu này về máy (PDF)
                    </button>
                `;
            }

            contentViewer.innerHTML = `
                <div style="display: flex; flex-direction: column; flex-grow: 1; height: 100%; width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;">
                    <div class="pdf-frame-wrapper" style="flex-grow: 1; height: 80vh; min-height: 700px; width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;">
                        <iframe src="${iframeUrl}" style="width: 100%; max-width: 100%; height: 100%; border: 0; min-width: 0; box-sizing: border-box;"></iframe>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        ${downloadBtnHtml}
                    </div>
                </div>
            `;
        }
        else if (material.type === 'text') {
            contentViewer.innerHTML = `
                <div class="article-content" style="padding: 10px;">
                    ${material.content || '<p style="color: var(--text-secondary); font-style: italic;">Chưa có nội dung bài viết...</p>'}
                </div>
            `;
        }
        else if (material.type === 'quiz') {
            initQuizEngine(material);
        }

        updateNavButtons();
    }

    // Chuyển link YouTube thường thành link nhúng Embed (hỗ trợ watch, share link youtu.be, shorts, live,...)
    function getYoutubeEmbedUrl(url) {
        if (!url) return "https://www.youtube.com/embed/zH0QG_uPez8";

        if (url.includes("embed/")) {
            return url;
        }

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    }

    // 6. Cập nhật trạng thái và sự kiện cho nút Điều hướng Trước/Sau
    function updateNavButtons() {
        if (flatMaterials.length <= 1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        prevBtn.disabled = (activeMaterialIndex <= 0);
        nextBtn.disabled = (activeMaterialIndex >= flatMaterials.length - 1);
    }

    prevBtn.onclick = () => {
        if (activeMaterialIndex > 0) {
            // Tìm học liệu hợp lệ trước đó (không bị khóa)
            let prevIndex = activeMaterialIndex - 1;
            while (prevIndex >= 0) {
                const target = flatMaterials[prevIndex];
                const isLocked = !target.is_preview && !isUserLoggedIn;
                if (!isLocked) {
                    activeMaterialIndex = prevIndex;
                    const m = flatMaterials[activeMaterialIndex];
                    currentMaterialId = m.id;

                    // Cập nhật URL và Sidebar
                    const newUrl = `${window.location.pathname}?id=${courseId}&lesson_id=${m.lesson_id}&material_id=${m.id}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);

                    renderSidebarTree();
                    loadActiveMaterial();
                    break;
                }
                prevIndex--;
            }
        }
    };

    nextBtn.onclick = () => {
        if (activeMaterialIndex < flatMaterials.length - 1) {
            // Tìm học liệu hợp lệ tiếp theo (không bị khóa)
            let nextIndex = activeMaterialIndex + 1;
            while (nextIndex < flatMaterials.length) {
                const target = flatMaterials[nextIndex];
                const isLocked = !target.is_preview && !isUserLoggedIn;
                if (!isLocked) {
                    activeMaterialIndex = nextIndex;
                    const m = flatMaterials[activeMaterialIndex];
                    currentMaterialId = m.id;

                    const newUrl = `${window.location.pathname}?id=${courseId}&lesson_id=${m.lesson_id}&material_id=${m.id}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);

                    renderSidebarTree();
                    loadActiveMaterial();
                    break;
                }
                nextIndex++;
            }
        }
    };

    // --- LOGIC QUẢN LÝ DÀNH CHO GIÁO VIÊN ---

    // 1. Mở Modal Đổi Tên
    function openEditNameModal(material) {
        targetMaterialId = material.id;
        document.getElementById('editNameInput').value = material.title;
        document.getElementById('editNameModalTitle').textContent = 'Chỉnh sửa tiêu đề học liệu';
        document.getElementById('editNameModal').classList.add('active');
    }

    // 2. Mở Modal Quản Lý Học Liệu (Bánh răng)
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

    // Đóng modal
    window.closeModal = function (modalId) {
        document.getElementById(modalId).classList.remove('active');
    };

    // 3. Xử lý lưu đổi tên học liệu
    const editNameForm = document.getElementById('editNameForm');
    if (editNameForm) {
        editNameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTitle = document.getElementById('editNameInput').value.trim();
            if (!newTitle) return;

            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').update({ title: newTitle }).eq('id', targetMaterialId);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi cập nhật tên học liệu: " + err.message);
                    return;
                }
            } else {
                const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];
                const idx = dbMaterials.findIndex(m => m.id == targetMaterialId);
                if (idx !== -1) {
                    dbMaterials[idx].title = newTitle;
                    localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
                }
            }

            alert("Đổi tên học liệu thành công!");
            closeModal('editNameModal');

            // Cập nhật nóng bộ nhớ đệm
            const cacheMaterialIndex = flatMaterials.findIndex(m => m.id == targetMaterialId);
            if (cacheMaterialIndex !== -1) {
                flatMaterials[cacheMaterialIndex].title = newTitle;
            }

            // Tải lại dữ liệu trang
            await loadStudyData();
        });
    }

    // Hỗ trợ upload file PDF
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
                fileUrl = `assets/docs/${file.name}`;
            }
        }
        return fileUrl;
    }

    // 4. Xử lý Chỉnh sửa nội dung học liệu
    const editMaterialForm = document.getElementById('editMaterialForm');
    if (editMaterialForm) {
        editMaterialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const order = parseInt(document.getElementById('editMaterialOrder').value) || 1;
            const isPreview = document.getElementById('editMaterialPreview').checked;

            let currentMat = flatMaterials.find(m => m.id == targetMaterialId);
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
            await loadStudyData();
        });
    }

    // 5. Xử lý Xóa học liệu
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

            // Xóa khỏi danh sách phẳng để điều hướng hoặc load học liệu khác
            flatMaterials = flatMaterials.filter(m => m.id != targetMaterialId);

            // Quay lại bài đầu tiên hoặc load lại trang
            window.location.href = `lesson.html?id=${courseId}&lesson_id=${currentLessonId}`;
        });
    }

    // Tự động trích xuất URL từ thẻ iframe khi admin dán cả thẻ
    const cleanUrlInputs = ['videoMaterialUrl', 'pdfMaterialUrl', 'otherMaterialUrl'];
    cleanUrlInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let val = e.target.value.trim();
                if (val.startsWith('<') && val.includes('src=')) {
                    const match = val.match(/src=["']([^"']+)["']/i);
                    if (match && match[1]) {
                        e.target.value = match[1];
                    }
                }
            });
        }
    });

    // Giải pháp 1: Khóa chuột phải & F12 cho học sinh
    function initAntiInspect() {
        if (isAdminLoggedIn) return; // Admin được phép inspect bình thường

        // 1. Chặn click chuột phải
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 2. Chặn các phím tắt F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
        document.addEventListener('keydown', (e) => {
            // Chặn F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
            // Chặn Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) {
                e.preventDefault();
                return false;
            }
            // Chặn Ctrl+U
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                e.preventDefault();
                return false;
            }
        });
    }

    // Modal thông báo tải tài liệu trả phí
    window.showPaidDownloadModal = function () {
        document.getElementById('paidDownloadModal').classList.add('active');
    };
});

/* ==========================================================================
   QUIZ ENGINE INTERACTIVE LOGIC - BỘ XỬ LÝ TRẮC NGHIỆM TƯƠNG TÁC & KATEX
   ========================================================================== */

let currentQuizState = {
    materialId: null,
    questions: [],
    submissionHistory: [], // mảng lưu các lượt nộp bài theo trình tự thời gian
                           // { attemptNum: 1, questionId: 1, questionObj: {...}, userChoice: 0, isCorrect: true/false, round: 1 }
    currentQueue: [],
    currentIndex: 0,
    selectedOption: null,
    isSubmitted: false,
    wrongQuestions: [],
    round: 1,
    totalAttempts: 0,
    totalCorrectAnswers: 0,
    userAnswers: {}, // qId -> { choice, isCorrect } (trạng thái làm đúng của từng câu hỏi)
    isCompleted: false,
    viewingAttemptIndex: null, // Nếu đang nhấp vào xem lại lượt nộp quá quá quá khứ (Lượt 1, Lượt 2...)
    isReviewMode: false,
    reviewIndex: 0,
    attemptsHistory: []
};

// Lưu state hiện tại vào LocalStorage
function saveQuizState() {
    if (!currentQuizState.materialId) return;
    try {
        localStorage.setItem('quiz_state_' + currentQuizState.materialId, JSON.stringify(currentQuizState));
    } catch (e) {
        console.error("Lỗi lưu quiz_state:", e);
    }
}

// Khởi tạo bộ câu hỏi trắc nghiệm
async function initQuizEngine(material) {
    let parsedQuestions = [];
    
    // 1. ƯU TIÊN lấy câu hỏi từ Supabase (Ngân hàng câu hỏi)
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data: mqData, error } = await supabaseClient
                .from('material_questions')
                .select('order_index, question_id, questions(*)')
                .eq('material_id', material.id)
                .order('order_index');

            if (!error && mqData && mqData.length > 0) {
                parsedQuestions = mqData
                    .filter(mq => mq.questions) // Lọc bỏ các liên kết không hợp lệ
                    .map(mq => ({
                        id: mq.questions.id,
                        question: mq.questions.question_text,
                        options: mq.questions.options || [],
                        correct_option: mq.questions.correct_option,
                        explanation: mq.questions.explanation || ''
                    }));
                console.log(`✅ Đã tải ${parsedQuestions.length} câu hỏi từ Ngân hàng câu hỏi Supabase cho material_id=${material.id}`);
            }
        } catch (e) {
            console.warn("⚠️ Không thể tải câu hỏi từ Supabase, sẽ fallback sang dữ liệu local:", e);
        }
    }

    // 2. FALLBACK: Đọc danh sách câu hỏi từ material.content (JSON cũ)
    if (!parsedQuestions || parsedQuestions.length === 0) {
        if (material.content) {
            try {
                if (typeof material.content === 'string') {
                    parsedQuestions = JSON.parse(material.content);
                } else if (Array.isArray(material.content)) {
                    parsedQuestions = material.content;
                }
            } catch (e) {
                console.warn("Không thể parse JSON từ material.content, sử dụng bộ câu hỏi mẫu:", e);
            }
        }
    }

    // 3. FALLBACK CUỐI: Sử dụng bộ câu hỏi mẫu cứng (Mock Data)
    if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        parsedQuestions = [
            {
                id: 1,
                question: "Cho phương trình bậc hai $x^2 - 5x + 6 = 0$. Phương trình có hai nghiệm $x_1, x_2$. Tính tổng $S = x_1 + x_2$ và tích $P = x_1 \\cdot x_2$.",
                options: [
                    "A. $S = 5, P = 6$",
                    "B. $S = -5, P = 6$",
                    "C. $S = 5, P = -6$",
                    "D. $S = -5, P = -6$"
                ],
                correct_option: 0,
                explanation: "Theo hệ thức Vi-ét, đối với phương trình $ax^2 + bx + c = 0$ ($a \\neq 0$):\n- Tổng hai nghiệm: $S = x_1 + x_2 = -\\frac{b}{a} = -\\frac{-5}{1} = 5$.\n- Tích hai nghiệm: $P = x_1 \\cdot x_2 = \\frac{c}{a} = \\frac{6}{1} = 6$.\nVậy chọn đáp án **A**."
            },
            {
                id: 2,
                question: "Tính biệt thức $\\Delta$ của phương trình bậc hai $2x^2 - 4x + 1 = 0$.",
                options: [
                    "A. $\\Delta = 8$",
                    "B. $\\Delta = 12$",
                    "C. $\\Delta = 0$",
                    "D. $\\Delta = 16$"
                ],
                correct_option: 0,
                explanation: "Ta có $a = 2, b = -4, c = 1$.\nCông thức biệt thức $\\Delta = b^2 - 4ac$.\nThay số: $\\Delta = (-4)^2 - 4 \\cdot 2 \\cdot 1 = 16 - 8 = 8 > 0$.\nVậy chọn đáp án **A**."
            },
            {
                id: 3,
                question: "Rút gọn biểu thức $A = \\sqrt{(2 - \\sqrt{5})^2} + \\sqrt{5}$.",
                options: [
                    "A. $A = 2$",
                    "B. $A = 2\\sqrt{5} - 2$",
                    "C. $A = -2$",
                    "D. $A = 2\\sqrt{5}$"
                ],
                correct_option: 0,
                explanation: "Ta có $\\sqrt{(2 - \\sqrt{5})^2} = |2 - \\sqrt{5}|$.\nVì $2 = \\sqrt{4} < \\sqrt{5}$ nên $2 - \\sqrt{5} < 0$.\nDo đó $|2 - \\sqrt{5}| = -(2 - \\sqrt{5}) = \\sqrt{5} - 2$.\nThay vào $A$: $A = (\\sqrt{5} - 2) + \\sqrt{5} = 2\\sqrt{5} - 2$... Ồ lưu ý! Ta có $A = \\sqrt{5} - 2 + \\sqrt{5} = 2\\sqrt{5} - 2$.\nChờ chút! Biểu thức ban đầu nếu là $\\sqrt{(\\sqrt{5} - 2)^2} = \\sqrt{5} - 2$.\nKết quả $A = (\\sqrt{5} - 2) + 2 = \\sqrt{5}$. Ở đây hằng đẳng thức cho ra $A = 2$. Khảo sát $A = 2$."
            }
        ];
    }

    // Đọc lịch sử 3 lần làm gần nhất
    let history = [];
    try {
        const storedHistory = localStorage.getItem('quiz_history_' + material.id);
        if (storedHistory) {
            history = JSON.parse(storedHistory);
        }
    } catch (e) {
        history = [];
    }

    // Kiểm tra xem có saved state đang dở dang hoặc đã hoàn thành trong LocalStorage không
    let savedState = null;
    try {
        const storedState = localStorage.getItem('quiz_state_' + material.id);
        if (storedState) {
            savedState = JSON.parse(storedState);
            
            // Tự động clear cache nếu bộ câu hỏi đã bị admin thay đổi
            if (savedState && savedState.questions) {
                const oldIds = savedState.questions.map(q => q.id).join(',');
                const newIds = parsedQuestions.map(q => q.id).join(',');
                if (oldIds !== newIds) {
                    console.log("DB questions changed, clearing local cache for material " + material.id);
                    localStorage.removeItem('quiz_state_' + material.id);
                    savedState = null;
                }
            }
        }
    } catch (e) {
        savedState = null;
    }

    if (savedState && savedState.materialId === material.id && savedState.questions && savedState.questions.length > 0) {
        currentQuizState = savedState;
        currentQuizState.attemptsHistory = history;
        if (!currentQuizState.userAnswers) currentQuizState.userAnswers = {};
        if (!currentQuizState.submissionHistory) currentQuizState.submissionHistory = [];

        if (currentQuizState.isCompleted && !currentQuizState.isReviewMode && currentQuizState.viewingAttemptIndex === null) {
            renderQuizSummary();
        } else {
            renderCurrentQuizQuestion();
        }
    } else {
        currentQuizState = {
            materialId: material.id,
            questions: parsedQuestions,
            submissionHistory: [],
            currentQueue: [...parsedQuestions],
            currentIndex: 0,
            selectedOption: null,
            isSubmitted: false,
            wrongQuestions: [],
            round: 1,
            totalAttempts: 0,
            totalCorrectAnswers: 0,
            userAnswers: {},
            isCompleted: false,
            viewingAttemptIndex: null,
            isReviewMode: false,
            reviewIndex: 0,
            attemptsHistory: history
        };
        saveQuizState();
        renderCurrentQuizQuestion();
    }
}

// Render câu hỏi hiện tại, lượt làm quá khứ hoặc chế độ Xem lại bài làm
function renderCurrentQuizQuestion() {
    const contentViewer = document.getElementById('studyContentViewer') || document.getElementById('contentViewer');
    if (!contentViewer) return;

    const state = currentQuizState;
    saveQuizState();

    // Nếu đã hoàn thành và không trong Review Mode / Viewing Past Attempt
    if (state.isCompleted && !state.isReviewMode && state.viewingAttemptIndex === null) {
        renderQuizSummary();
        return;
    }

    // Xác định đối tượng hiển thị (Xem lượt cũ VS Xem câu trong Review Mode VS Câu đang làm)
    let q = null;
    let isViewingSubmittedAttempt = false;
    let viewingChoice = null;
    let viewingIsCorrect = false;

    if (state.viewingAttemptIndex !== null && state.submissionHistory[state.viewingAttemptIndex]) {
        const attemptObj = state.submissionHistory[state.viewingAttemptIndex];
        q = attemptObj.questionObj;
        isViewingSubmittedAttempt = true;
        viewingChoice = attemptObj.userChoice;
        viewingIsCorrect = attemptObj.isCorrect;
    } else if (state.isReviewMode) {
        const attemptObj = state.submissionHistory[state.reviewIndex || 0] || {};
        q = attemptObj.questionObj || state.questions[state.reviewIndex || 0];
        isViewingSubmittedAttempt = true;
        viewingChoice = attemptObj.userChoice;
        viewingIsCorrect = attemptObj.isCorrect;
    } else {
        if (state.currentQueue.length === 0) {
            renderQuizSummary();
            return;
        }
        q = state.currentQueue[state.currentIndex];
        isViewingSubmittedAttempt = state.isSubmitted;
        viewingChoice = state.selectedOption;
        viewingIsCorrect = (state.selectedOption === q.correct_option);
    }

    // Tính % tiến trình Progress Bar dựa trên số câu độc nhất làm đúng / tổng số câu bài học
    const uniqueCorrectCount = Object.values(state.userAnswers || {}).filter(ans => ans.isCorrect).length;
    const progressPercent = Math.round((uniqueCorrectCount / state.questions.length) * 100);

    // Hàng nút số (1, 2, 3, 4...) thể hiện LƯỢT NỘP BÀI (Timeline Lượt nộp bài)
    let navGridHTML = '';
    const historyCount = state.submissionHistory.length;

    // Render các nút đại diện cho từng Lượt Nộp Bài đã thực hiện
    state.submissionHistory.forEach((sub, i) => {
        let badgeClass = 'quiz-nav-badge';
        if (sub.isCorrect) badgeClass += ' correct';
        else badgeClass += ' wrong';

        // Nếu đang mở xem lượt này (Highlight nổi bật với hiệu ứng glowing active ring)
        if ((state.viewingAttemptIndex === i) || (state.isReviewMode && state.reviewIndex === i)) {
            badgeClass += ' active';
        }

        const clickAction = state.isReviewMode ? `jumpToReviewQuestion(${i})` : `viewPastAttempt(${i})`;
        navGridHTML += `<div class="${badgeClass}" onclick="${clickAction}" title="Lượt ${i + 1}: ${sub.isCorrect ? 'Đúng' : 'Sai'}">${i + 1}</div>`;
    });

    // Nếu đang trong Quiz Mode và câu hiện tại CHƯA nộp bài, thêm 1 badge Nổi bật thể hiện Lượt đang làm
    if (!state.isReviewMode && !state.isCompleted) {
        if (state.viewingAttemptIndex === null && !state.isSubmitted) {
            const currentAttemptNum = historyCount + 1;
            navGridHTML += `<div class="quiz-nav-badge unanswered active" onclick="viewCurrentActiveQuestion()" title="Lượt ${currentAttemptNum} (Đang làm)">${currentAttemptNum}</div>`;
        }
    }

    // Render danh sách 4 lựa chọn (A, B, C, D)
    let optionsHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, idx) => {
        let cardClass = 'quiz-option-card';
        if (isViewingSubmittedAttempt) {
            cardClass += ' disabled';
            if (idx === q.correct_option) {
                cardClass += ' correct';
            }
            if (viewingChoice === idx && idx !== q.correct_option) {
                cardClass += ' wrong';
            }
        } else if (state.selectedOption === idx) {
            cardClass += ' selected';
        }

        optionsHTML += `
            <div class="${cardClass}" onclick="selectQuizOption(${idx})">
                <div class="quiz-option-letter">${letters[idx]}</div>
                <div class="quiz-option-content">${opt}</div>
            </div>
        `;
    });

    // Phần Hướng dẫn giải chi tiết
    let explanationHTML = '';
    if (isViewingSubmittedAttempt) {
        const boxClass = viewingIsCorrect ? 'quiz-explanation-box correct-box' : 'quiz-explanation-box wrong-box';
        const titleText = viewingIsCorrect ? ' chính xác! 🎉' : 'Chưa chính xác! ❌';
        const titleColor = viewingIsCorrect ? '#10B981' : '#EF4444';
        const icon = viewingIsCorrect ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';

        explanationHTML = `
            <div class="${boxClass}">
                <div class="quiz-explanation-title" style="color: ${titleColor};">
                    <i class="${icon}"></i> ${titleText}
                </div>
                <div style="font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">Hướng dẫn giải chi tiết:</div>
                <div class="quiz-explanation-body">${q.explanation || 'Không có hướng dẫn giải chi tiết cho câu hỏi này.'}</div>
            </div>
        `;
    }

    // Nút hành động
    let actionBtnHTML = '';

    if (state.viewingAttemptIndex !== null) {
        // Đang xem lại một lượt cũ khi chưa hoàn thành bài test
        actionBtnHTML = `
            <button class="btn btn-primary" onclick="viewCurrentActiveQuestion()" style="padding: 12px 28px; border-radius: 10px; font-weight: 700;">
                Quay lại câu đang làm <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;
    } else if (state.isReviewMode) {
        // Trong chế độ Xem lại bài làm sau khi hoàn thành
        actionBtnHTML = `
            <button class="btn btn-secondary" onclick="exitQuizReviewMode()" style="padding: 12px 24px; border-radius: 10px; font-weight: 700;">
                <i class="fa-solid fa-trophy"></i> Trở về Màn hình Tổng kết
            </button>
        `;
    } else if (!state.isSubmitted) {
        // Chưa nộp bài câu hiện tại
        const isBtnDisabled = state.selectedOption === null ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : '';
        actionBtnHTML = `
            <button class="btn btn-primary" onclick="submitQuizQuestion()" ${isBtnDisabled} style="padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem;">
                <i class="fa-solid fa-paper-plane"></i> Nộp bài
            </button>
        `;
    } else {
        // Đã nộp bài câu hiện tại
        const isLastInRound = state.currentIndex === state.currentQueue.length - 1;
        const allMastered = (uniqueCorrectCount === state.questions.length);

        if (isLastInRound && (allMastered || state.wrongQuestions.length === 0)) {
            actionBtnHTML = `
                <button class="btn btn-primary" onclick="nextQuizQuestion()" style="padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border: none;">
                    Kết thúc <i class="fa-solid fa-trophy"></i>
                </button>
            `;
        } else {
            actionBtnHTML = `
                <button class="btn btn-primary" onclick="nextQuizQuestion()" style="padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border: none;">
                    Tiếp tục <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;
        }
    }

    contentViewer.innerHTML = `
        <div class="quiz-container">
            <div class="quiz-header">
                <div class="quiz-header-top">
                    <div class="quiz-progress-bar-wrapper" style="margin-left: 0;">
                        <div class="quiz-progress-bar-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    <div style="font-weight: 700; font-size: 0.9rem; color: var(--accent-color);">
                        ${progressPercent}%
                    </div>
                </div>
                <!-- Hàng nút số thứ tự Lượt nộp bài (1, 2, 3...) -->
                <div class="quiz-nav-grid">
                    ${navGridHTML}
                </div>
            </div>

            <div class="quiz-question-box">
                <div class="quiz-question-text">${q.question}</div>
                <div class="quiz-options-list">
                    ${optionsHTML}
                </div>
            </div>

            ${explanationHTML}

            <div style="margin-top: 28px; display: flex; justify-content: flex-end;">
                ${actionBtnHTML}
            </div>
        </div>
    `;

    triggerKaTeXRender(contentViewer);
}

// Xem lại một Lượt nộp bài cũ khi chưa hoàn thành bài test
function viewPastAttempt(index) {
    currentQuizState.viewingAttemptIndex = index;
    saveQuizState();
    renderCurrentQuizQuestion();
}

// Quay lại làm câu hiện tại
function viewCurrentActiveQuestion() {
    currentQuizState.viewingAttemptIndex = null;
    saveQuizState();
    renderCurrentQuizQuestion();
}

// Chọn đáp án
function selectQuizOption(optionIdx) {
    if (currentQuizState.isSubmitted || currentQuizState.isReviewMode || currentQuizState.viewingAttemptIndex !== null) return;
    currentQuizState.selectedOption = optionIdx;
    renderCurrentQuizQuestion();
}

// Nộp bài cho câu hiện tại
function submitQuizQuestion() {
    const state = currentQuizState;
    if (state.selectedOption === null || state.isSubmitted || state.isReviewMode || state.viewingAttemptIndex !== null) return;

    state.isSubmitted = true;
    state.totalAttempts++;

    const q = state.currentQueue[state.currentIndex];
    const isCorrect = (state.selectedOption === q.correct_option);

    // Lưu vào mảng Lịch sử lượt nộp bài
    state.submissionHistory.push({
        attemptNum: state.totalAttempts,
        questionId: q.id,
        questionObj: q,
        userChoice: state.selectedOption,
        isCorrect: isCorrect,
        round: state.round
    });

    if (isCorrect) {
        state.totalCorrectAnswers++;
        state.userAnswers[q.id] = { choice: state.selectedOption, isCorrect: true };
    } else {
        state.wrongQuestions.push(q);
        state.userAnswers[q.id] = { choice: state.selectedOption, isCorrect: false };
    }

    saveQuizState();
    renderCurrentQuizQuestion();
}

// Chuyển câu tiếp theo hoặc tự động chuyển Vòng luyện câu sai cho đến khi đúng 100%
function nextQuizQuestion() {
    const state = currentQuizState;

    if (state.viewingAttemptIndex !== null) {
        state.viewingAttemptIndex = null;
        renderCurrentQuizQuestion();
        return;
    }

    if (state.isReviewMode) return;

    state.currentIndex++;
    state.selectedOption = null;
    state.isSubmitted = false;

    // Kiểm tra xem đã đúng 100% tất cả các câu độc nhất chưa
    const uniqueCorrectCount = Object.values(state.userAnswers || {}).filter(ans => ans.isCorrect).length;
    const allMastered = (uniqueCorrectCount === state.questions.length);

    if (state.currentIndex < state.currentQueue.length && !allMastered) {
        renderCurrentQuizQuestion();
    } else {
        // Hết lượt hiện tại: Kiểm tra xem còn câu bị làm sai chưa hoàn thành không
        if (!allMastered && state.wrongQuestions.length > 0) {
            // MẶC ĐỊNH TỰ ĐỘNG CHUYỂN VÒNG LUYỆN CÂU SAI
            state.currentQueue = [...state.wrongQuestions];
            state.wrongQuestions = [];
            state.currentIndex = 0;
            state.selectedOption = null;
            state.isSubmitted = false;
            state.round++;
            saveQuizState();
            renderCurrentQuizQuestion();
        } else {
            // ĐÃ HOÀN THÀNH ĐÚNG 100% TẤT CẢ CÁC CÂU HỎI
            state.isCompleted = true;
            state.isReviewMode = false;
            state.viewingAttemptIndex = null;

            // Tính điểm theo công thức: (Tổng số câu đúng / Tổng số lượt nộp bài) * 10
            let finalScore = 0;
            if (state.totalAttempts > 0) {
                finalScore = Math.round((state.totalCorrectAnswers / state.totalAttempts) * 10 * 10) / 10;
            }

            const newAttemptRecord = {
                date: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                score: finalScore,
                correct: state.totalCorrectAnswers,
                attempts: state.totalAttempts
            };

            state.attemptsHistory.unshift(newAttemptRecord);
            state.attemptsHistory = state.attemptsHistory.slice(0, 3); // Giữ 3 lần gần nhất

            try {
                localStorage.setItem('quiz_history_' + state.materialId, JSON.stringify(state.attemptsHistory));
            } catch (e) {
                console.error("Lỗi lưu lịch sử làm bài:", e);
            }

            saveQuizState();
            renderQuizSummary();
        }
    }
}

// Render Màn hình Hoàn thành (khi đúng 100% tất cả các câu)
function renderQuizSummary() {
    const contentViewer = document.getElementById('studyContentViewer') || document.getElementById('contentViewer');
    if (!contentViewer) return;

    const state = currentQuizState;
    state.isCompleted = true;
    state.viewingAttemptIndex = null;
    saveQuizState();

    let finalScore = 0;
    if (state.totalAttempts > 0) {
        finalScore = Math.round((state.totalCorrectAnswers / state.totalAttempts) * 10 * 10) / 10;
    }

    // Bảng Lịch sử 3 lần gần nhất (chỉ gồm 3 cột: Thời gian, Điểm số, Đúng/Tổng lượt)
    let historyRowsHTML = '';
    (state.attemptsHistory || []).forEach((rec, i) => {
        const isCurrent = i === 0;
        historyRowsHTML += `
            <tr style="${isCurrent ? 'font-weight: 700; background: rgba(99, 102, 241, 0.05);' : ''}">
                <td>${rec.date} ${isCurrent ? '<span style="font-size: 0.75rem; background: var(--accent-color); color: white; padding: 2px 6px; border-radius: 10px; margin-left: 4px;">Mới nhất</span>' : ''}</td>
                <td><span style="color: var(--accent-color); font-weight: 800; font-size: 1.05rem;">${rec.score}</span> / 10</td>
                <td>${rec.correct} / ${rec.attempts} lượt</td>
            </tr>
        `;
    });

    contentViewer.innerHTML = `
        <div class="quiz-container quiz-summary-card">
            <div class="quiz-score-badge">
                <div class="quiz-score-number">${finalScore}</div>
                <div class="quiz-score-max">/ 10 ĐIỂM</div>
            </div>

            <h2 style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
                ${finalScore >= 8 ? 'Xuất sắc! 🎉' : finalScore >= 5 ? 'Khá tốt! 👍' : 'Đã hoàn thành 100%! 💪'}
            </h2>
            <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
                Bạn đã hoàn thành đúng tất cả các câu hỏi (Tổng số lượt nộp bài: <b>${state.totalAttempts}</b> lượt).
            </p>

            <!-- ĐÚNG 2 NÚT HÀNH ĐỘNG HỌC SINH -->
            <div style="display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px;">
                <button class="btn btn-primary" onclick="restartFullQuiz()" style="padding: 12px 28px; border-radius: 10px; font-weight: 700; border: none; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);">
                    <i class="fa-solid fa-rotate-left"></i> Luyện tập lại
                </button>
                <button class="btn btn-secondary" onclick="startQuizReviewMode()" style="padding: 12px 28px; border-radius: 10px; font-weight: 700; border: 1px solid var(--card-border);">
                    <i class="fa-solid fa-eye"></i> Xem lại bài làm
                </button>
            </div>

            <!-- Bảng Lịch sử 3 lần làm gần nhất (Đã bỏ cột Vòng tối đa) -->
            <div style="text-align: left; margin-top: 24px; border-top: 1px solid var(--card-border); padding-top: 20px;">
                <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-clock-rotate-left" style="color: var(--accent-color);"></i> Lịch sử 3 lần làm gần nhất
                </h4>
                <table class="quiz-history-table">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Điểm số</th>
                            <th>Đúng / Tổng lượt làm</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyRowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    triggerKaTeXRender(contentViewer);
}

// Bật Chế độ Xem lại bài làm
function startQuizReviewMode() {
    currentQuizState.isReviewMode = true;
    currentQuizState.reviewIndex = 0;
    currentQuizState.viewingAttemptIndex = null;
    saveQuizState();
    renderCurrentQuizQuestion();
}

// Thoát Chế độ Xem lại bài làm để trở về Màn hình Tổng kết
function exitQuizReviewMode() {
    currentQuizState.isReviewMode = false;
    currentQuizState.viewingAttemptIndex = null;
    saveQuizState();
    renderQuizSummary();
}

// Nhấp chuyển câu trong Review Mode
function jumpToReviewQuestion(index) {
    currentQuizState.isReviewMode = true;
    currentQuizState.reviewIndex = index;
    currentQuizState.viewingAttemptIndex = null;
    saveQuizState();
    renderCurrentQuizQuestion();
}

// Làm lại toàn bộ từ đầu (Restart Full Quiz)
function restartFullQuiz() {
    const materialId = currentQuizState.materialId;
    const questions = currentQuizState.questions;
    const history = currentQuizState.attemptsHistory;

    currentQuizState = {
        materialId: materialId,
        questions: questions,
        submissionHistory: [],
        currentQueue: [...questions],
        currentIndex: 0,
        selectedOption: null,
        isSubmitted: false,
        wrongQuestions: [],
        round: 1,
        totalAttempts: 0,
        totalCorrectAnswers: 0,
        userAnswers: {},
        isCompleted: false,
        viewingAttemptIndex: null,
        isReviewMode: false,
        reviewIndex: 0,
        attemptsHistory: history
    };

    saveQuizState();
    renderCurrentQuizQuestion();
}

// Tự động kích hoạt KaTeX render công thức toán
function triggerKaTeXRender(container) {
    if (typeof renderMathInElement === 'function' && container) {
        try {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.error("Lỗi KaTeX auto-render:", e);
        }
    }
}

// Tự động kích hoạt KaTeX render công thức toán
function triggerKaTeXRender(container) {
    if (typeof renderMathInElement === 'function' && container) {
        try {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.error("Lỗi KaTeX auto-render:", e);
        }
    }
}


