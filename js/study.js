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

    // 4. Vẽ Sidebar cây phân cấp điều hướng
    function renderSidebarTree() {
        if (!treeContainer) return;
        treeContainer.innerHTML = '';

        if (chapters.length === 0) {
            treeContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Chưa có chương học nào được tạo.</div>`;
            return;
        }

        chapters.forEach(ch => {
            const chDiv = document.createElement('div');
            chDiv.className = 'study-chapter';
            
            const chTitle = document.createElement('div');
            chTitle.className = 'study-chapter-title';
            chTitle.textContent = ch.title;
            chDiv.appendChild(chTitle);

            const lessonsList = document.createElement('ul');
            lessonsList.className = 'study-lessons-list';

            const lessons = lessonsMap[ch.id] || [];
            lessons.forEach(l => {
                const lLi = document.createElement('li');
                
                const lTitle = document.createElement('div');
                lTitle.className = 'study-lesson-title';
                lTitle.textContent = l.title;
                lLi.appendChild(lTitle);

                const materialsList = document.createElement('ul');
                materialsList.className = 'study-materials-list';

                const materials = materialsMap[l.id] || [];
                materials.forEach(m => {
                    const mLi = document.createElement('li');
                    mLi.className = `study-material-item ${m.id == currentMaterialId ? 'active' : ''}`;

                    const isLocked = !m.is_preview && !isUserLoggedIn;
                    if (isLocked) mLi.classList.add('locked');

                    let iconHTML = '🎥';
                    if (m.type === 'pdf') iconHTML = '📄';
                    else if (m.type === 'text') iconHTML = '✍️';
                    else if (m.type === 'quiz') iconHTML = '📝';

                    const link = document.createElement('a');
                    link.href = '#';
                    link.innerHTML = `<span>${iconHTML}</span> <span style="flex-grow: 1;">${m.title}</span> ${isLocked ? '<i class="fa-solid fa-lock" style="font-size: 0.75rem; color: #EF4444;"></i>' : ''}`;
                    
                    link.onclick = (e) => {
                        e.preventDefault();
                        if (isLocked) {
                            alert("Vui lòng đăng ký tài khoản và đăng nhập để xem nội dung học liệu này!");
                            sessionStorage.setItem('redirectAfterLogin', `${window.location.origin}/study.html?id=${courseId}&lesson_id=${l.id}&material_id=${m.id}`);
                            window.location.href = 'login.html';
                        } else {
                            currentMaterialId = m.id;
                            currentLessonId = l.id;
                            activeMaterialIndex = flatMaterials.findIndex(item => item.id == m.id);
                            
                            // Cập nhật lại class active
                            document.querySelectorAll('.study-material-item').forEach(item => item.classList.remove('active'));
                            mLi.classList.add('active');

                            // Thay đổi URL không tải lại trang
                            const newUrl = `${window.location.pathname}?id=${courseId}&lesson_id=${l.id}&material_id=${m.id}`;
                            window.history.pushState({ path: newUrl }, '', newUrl);

                            loadActiveMaterial();
                        }
                    };

                    mLi.appendChild(link);
                    materialsList.appendChild(mLi);
                });

                lLi.appendChild(materialsList);
                lessonsList.appendChild(lLi);
            });

            chDiv.appendChild(lessonsList);
            treeContainer.appendChild(chDiv);
        });
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
        contentTitle.textContent = material.title;
        contentViewer.innerHTML = '';

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
            contentViewer.innerHTML = `
                <div style="display: flex; flex-direction: column; flex-grow: 1; height: 100%;">
                    <div class="pdf-frame-wrapper" style="flex-grow: 1; min-height: 500px;">
                        <iframe src="${material.url}"></iframe>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${material.url}" download class="btn btn-primary" style="width: auto; display: inline-flex; align-items: center; gap: 8px;"><i class="fa-solid fa-download"></i> Tải tài liệu này về máy (PDF)</a>
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
            // Chế độ hiển thị trắc nghiệm tạm thời
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

    // Chuyển link YouTube thường thành link nhúng Embed
    function getYoutubeEmbedUrl(url) {
        if (!url) return "https://www.youtube.com/embed/zH0QG_uPez8";
        
        let videoId = "";
        if (url.includes("embed/")) {
            return url;
        }
        else if (url.includes("watch?v=")) {
            const parts = url.split("v=");
            if (parts.length > 1) videoId = parts[1].split("&")[0];
        } 
        else if (url.includes("youtu.be/")) {
            const parts = url.split("youtu.be/");
            if (parts.length > 1) videoId = parts[1].split("?")[0];
        }

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
});
