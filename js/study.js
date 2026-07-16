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

        // Tạo danh sách phẳng để điều hướng trước/sau
        buildFlatMaterialsList();

        // Xác định học liệu hiển thị mặc định nếu URL rỗng
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
        }

        // Vẽ sidebar và nội dung
        renderSidebarTree();
        loadActiveMaterial();
    }

    function loadOfflineStudyData() {
        const dbCourses = JSON.parse(localStorage.getItem('db_courses')) || [];
        const dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || [];
        const dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [];
        const dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];

        currentCourse = dbCourses.find(c => c.id == courseId);
        chapters = dbChapters.filter(ch => ch.course_id == courseId).sort((a,b) => a.order_index - b.order_index);

        chapters.forEach(ch => {
            lessonsMap[ch.id] = dbLessons.filter(l => l.chapter_id == ch.id).sort((a,b) => a.order_index - b.order_index);
            lessonsMap[ch.id].forEach(l => {
                materialsMap[l.id] = dbMaterials.filter(m => m.lesson_id == l.id).sort((a,b) => a.order_index - b.order_index);
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
                openMaterialGearModal(material);
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
            contentViewer.innerHTML = `
                <div style="padding: 40px; text-align: center; background: #F8FAFC; border: 1px dashed var(--card-border); border-radius: 16px; margin: auto;">
                    <i class="fa-solid fa-square-check" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 16px;"></i>
                    <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary);">Bài trắc nghiệm tự luyện</h3>
                    <p style="margin-top: 10px; color: var(--text-secondary); max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                        Hệ thống đề trắc nghiệm chấm điểm tự động đang được thiết lập. Thầy Dương sẽ tải câu hỏi bài tập tự luyện lên sớm nhất cho các học viên ôn luyện!
                    </p>
                </div>
            `;
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
    window.closeModal = function(modalId) {
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
    window.showPaidDownloadModal = function() {
        document.getElementById('paidDownloadModal').classList.add('active');
    };
});

