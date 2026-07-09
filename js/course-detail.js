// Toán Smart Website - Dynamic Course Details Page Loader & Inline Editor (3-Level System)

// Mock Data dự phòng khi chạy offline (Không kết nối Supabase)
let dbCourses = JSON.parse(localStorage.getItem('db_courses')) || [
    {
        id: 1,
        title: "Luyện Thi Vào Lớp 10 Toán Mục Tiêu 9+",
        tag: "grade10",
        tag_label: "Lớp 9 lên 10",
        price: 1500000,
        description: "Bứt phá điểm số hình học học kỳ 2, đại số chuyên đề, luyện giải đề thi thử tuyển sinh chính thức bám sát cấu trúc sở GD&ĐT các năm gần đây. Rèn luyện tư duy tự học giúp học sinh vững vàng đỗ trường THPT mong muốn.",
        duration: "6 tháng (72 buổi)",
        image_url: "assets/images/course-10.png",
        target_audience: [
            "Học sinh lớp 9 chuẩn bị thi vào lớp 10.",
            "Học sinh bị hổng kiến thức hình học phẳng.",
            "Học sinh muốn đạt điểm 8.5 - 9.5 môn Toán.",
            "Học sinh ôn thi các lớp chuyên Toán cấp ba."
        ],
        features: [
            { icon: "fa-regular fa-clock", text: "Thời lượng: 6 tháng (72 buổi)" },
            { icon: "fa-solid fa-book-open", text: "Tài liệu đặc quyền: Có (PDF tải về)" },
            { icon: "fa-solid fa-circle-play", text: "Học thử: Có (Bài 1 miễn phí)" },
            { icon: "fa-solid fa-shield-halved", text: "Cam kết tiến bộ vượt bậc" }
        ]
    },
    {
        id: 2,
        title: "Luyện Thi Tốt Nghiệp THPT Chuyên Sâu",
        tag: "thpt",
        tag_label: "Lớp 12 ôn thi THPT",
        price: 2000000,
        description: "Hệ thống toàn bộ kiến thức đại số, giải tích, hình học 12. Rèn luyện các kỹ năng phân tích nhanh trắc nghiệm, bấm máy tính Casio tối ưu 30 giây mỗi câu giúp học sinh bứt phá đạt điểm 9+ thi THPT Quốc Gia.",
        duration: "8 tháng (96 buổi)",
        image_url: "assets/images/course-thpt.png",
        target_audience: [
            "Học sinh lớp 12 đang chuẩn bị cho kỳ thi Tốt nghiệp THPT.",
            "Học sinh muốn tối ưu hóa thời gian làm bài trắc nghiệm Toán.",
            "Học sinh muốn rèn luyện kỹ thuật Casio nâng cao.",
            "Học sinh đặt mục tiêu đỗ các trường đại học top đầu (Bách Khoa, NEU...)."
        ],
        features: [
            { icon: "fa-regular fa-clock", text: "Thời lượng: 8 tháng (96 buổi)" },
            { icon: "fa-solid fa-book-open", text: "Tài liệu đặc quyền: Có (PDF tải về)" },
            { icon: "fa-solid fa-circle-play", text: "Học thử: Có (Bài 1 miễn phí)" },
            { icon: "fa-solid fa-shield-halved", text: "Cam kết đầu ra đỗ ĐH NV1" }
        ]
    },
    {
        id: 3,
        title: "Luyện Tư Duy Định Lượng HSA/APT (ĐGNL)",
        tag: "dgnl",
        tag_label: "Luyện ĐGNL HSA/APT",
        price: 1800000,
        description: "Phát triển sâu năng lực tư duy logic toán học, kỹ năng phân tích bảng biểu số liệu và giải quyết vấn đề thực tế bám sát cấu trúc phần thi định lượng của HSA (ĐHQGHN) và APT (ĐHQG TP.HCM).",
        duration: "4 tháng (48 buổi)",
        image_url: "assets/images/course-dgnl.png",
        target_audience: [
            "Học sinh lớp 12 có mục tiêu xét tuyển đại học bằng điểm thi ĐGNL.",
            "Học sinh muốn rèn luyện kỹ năng phân tích số liệu khoa học nhanh.",
            "Học sinh muốn chinh phục mốc điểm cao phần tư duy định lượng.",
            "Học sinh muốn phát triển tư duy suy luận logic toán học ứng dụng."
        ],
        features: [
            { icon: "fa-regular fa-clock", text: "Thời lượng: 4 tháng (48 buổi)" },
            { icon: "fa-solid fa-book-open", text: "Tài liệu đặc quyền: Có (PDF tải về)" },
            { icon: "fa-solid fa-circle-play", text: "Học thử: Có (Bài 1 miễn phí)" },
            { icon: "fa-solid fa-shield-halved", text: "Cam kết bứt phá điểm số HSA" }
        ]
    }
];

let dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || [
    { id: 101, course_id: 1, title: "Chương 1: Đại số chuyên sâu & Hệ thức Vi-ét ôn thi vào 10", order_index: 1 },
    { id: 102, course_id: 1, title: "Chương 2: Hình học phẳng & Tứ giác nội tiếp đường tròn", order_index: 2 },
    { id: 103, course_id: 1, title: "Chương 3: Luyện đề thi thử & Chiến thuật tối ưu điểm số", order_index: 3 },
    { id: 201, course_id: 2, title: "Chương 1: Khảo sát hàm số & Giải tích 12 chuyên sâu", order_index: 1 },
    { id: 202, course_id: 2, title: "Chương 2: Tuyệt kỹ Casio & Phương pháp giải nhanh trắc nghiệm 30s", order_index: 2 },
    { id: 203, course_id: 2, title: "Chương 3: Hình học không gian & Hình học tọa độ Oxyz", order_index: 3 },
    { id: 301, course_id: 3, title: "Chương 1: Logic toán học & Kỹ năng phân tích bảng số liệu thực tế", order_index: 1 },
    { id: 302, course_id: 3, title: "Chương 2: Tổng ôn toán học phổ thông bám sát cấu trúc đề HSA/APT", order_index: 2 }
];

let dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || [
    { id: 1001, chapter_id: 101, title: "Bài 1: Phương trình bậc hai & Hệ thức Vi-ét cơ bản", order_index: 1 },
    { id: 1002, chapter_id: 101, title: "Bài 2: Phương pháp rút gọn biểu thức chứa căn thức bậc hai", order_index: 2 },
    { id: 1003, chapter_id: 101, title: "Bài 3: Giải toán bằng cách lập phương trình, hệ phương trình", order_index: 3 },
    { id: 1004, chapter_id: 101, title: "Bài 4: Các bài toán chứa tham số m liên quan đến cực trị Vi-ét", order_index: 4 },
    { id: 1005, chapter_id: 102, title: "Bài 5: Định nghĩa & 4 phương pháp chứng minh Tứ giác nội tiếp", order_index: 1 },
    { id: 1006, chapter_id: 102, title: "Bài 6: Các bài toán về tiếp tuyến đường tròn cực kỳ đặc sắc", order_index: 2 },
    { id: 1007, chapter_id: 102, title: "Bài 7: Chứng minh ba điểm thẳng hàng, hai đường thẳng vuông góc", order_index: 3 },
    { id: 1008, chapter_id: 103, title: "Bài 8: Giải đề thi thử bám sát cấu trúc sở GD&ĐT Hà Nội", order_index: 1 },
    { id: 1009, chapter_id: 103, title: "Bài 9: Các lỗi sai ngớ ngẩn làm mất điểm Toán tự luận", order_index: 2 },
    { id: 2001, chapter_id: 201, title: "Bài 1: Sự đồng biến, nghịch biến của hàm số chứa tham số m", order_index: 1 },
    { id: 2002, chapter_id: 201, title: "Bài 2: Phương pháp cực trị hàm số liên kết đồ thị f'(x)", order_index: 2 },
    { id: 2003, chapter_id: 201, title: "Bài 3: Nhận diện đồ thị hàm số và các bài toán biện luận nghiệm", order_index: 3 },
    { id: 2004, chapter_id: 202, title: "Bài 4: Kỹ thuật Casio giải nhanh tích phân chống sai số nâng cao", order_index: 1 },
    { id: 2005, chapter_id: 202, title: "Bài 5: Tối ưu thời gian giải toán số phức bằng máy tính Casio", order_index: 2 },
    { id: 2006, chapter_id: 203, title: "Bài 6: Phương pháp ghép trục tọa độ Oxyz giải nhanh cực trị hình học", order_index: 1 },
    { id: 2007, chapter_id: 203, title: "Bài 7: Góc và khoảng cách trong không gian - Giải nhanh trắc nghiệm", order_index: 2 },
    { id: 3001, chapter_id: 301, title: "Bài 1: Phương pháp đọc đề, phân tích bảng biểu thống kê phức tạp", order_index: 1 },
    { id: 3002, chapter_id: 301, title: "Bài 2: Các bài toán tư duy logic, suy luận toán học đặc sắc tuyển chọn", order_index: 2 },
    { id: 3003, chapter_id: 301, title: "Bài 3: Kỹ thuật loại trừ phương án nhiễu trong phần thi Định lượng", order_index: 3 },
    { id: 3004, chapter_id: 302, title: "Bài 4: Chuyên đề Số học & Đại số ôn thi ĐGNL Hà Nội", order_index: 1 },
    { id: 3005, chapter_id: 302, title: "Bài 5: Chuyên đề Tổ hợp, Xác suất & Thống kê trong đề ĐGNL TP.HCM", order_index: 2 }
];

let dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || [];

// Tự động di chuyển dữ liệu (Migration) từ cấu trúc bài học cũ sang học liệu con nếu cần
migrateOfflineDataIfNeeded();

function migrateOfflineDataIfNeeded() {
    const rawLessons = JSON.parse(localStorage.getItem('db_lessons'));
    const rawMaterials = localStorage.getItem('db_materials');
    
    // Nếu có dữ liệu lessons cũ và chưa có db_materials
    if (rawLessons && rawLessons.length > 0 && (!rawMaterials || JSON.parse(rawMaterials).length === 0)) {
        const migratedMaterials = [];
        const cleanedLessons = [];

        rawLessons.forEach(l => {
            // Nếu có các thuộc tính của học liệu cũ
            if (l.type) {
                migratedMaterials.push({
                    id: l.id * 10,
                    lesson_id: l.id,
                    title: l.type === 'video' ? "Video bài giảng chính thức" : "Tài liệu đọc & Bài tập tự luyện",
                    type: l.type,
                    url: l.url || "https://www.youtube.com/embed/zH0QG_uPez8",
                    content: l.type === 'text' ? "<p>Nội dung lý thuyết chuyên sâu...</p>" : "",
                    is_preview: l.is_preview !== undefined ? l.is_preview : false,
                    order_index: 1
                });
            }
            
            // Tạo lesson sạch không chứa thuộc tính học liệu
            cleanedLessons.push({
                id: l.id,
                chapter_id: l.chapter_id,
                title: l.title,
                order_index: l.order_index
            });
        });

        dbLessons = cleanedLessons;
        dbMaterials = migratedMaterials;
        
        localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
    }
    
    // Nếu db_materials vẫn trống (lần đầu chạy offline chưa có mock data)
    if (dbMaterials.length === 0) {
        // Tạo mặc định một số học liệu mẫu cho các bài học mock để dễ test
        dbLessons.forEach(l => {
            dbMaterials.push({
                id: l.id * 10 + 1,
                lesson_id: l.id,
                title: "Video bài giảng chất lượng cao",
                type: "video",
                url: "https://www.youtube.com/embed/zH0QG_uPez8",
                content: "",
                is_preview: l.id === 1001 || l.id === 2001 || l.id === 3001, // Mở khóa bài 1
                order_index: 1
            });
            dbMaterials.push({
                id: l.id * 10 + 2,
                lesson_id: l.id,
                title: "Tài liệu ôn tập PDF",
                type: "pdf",
                url: "assets/docs/so-tay-toan-12.pdf",
                content: "",
                is_preview: l.id === 1002 || l.id === 2002 || l.id === 3002, // Mở khóa bài 2
                order_index: 2
            });
        });
        localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
    }
}

// Trạng thái Admin, Student & Đăng nhập
let isUserLoggedIn = false;
let isStudentLoggedIn = false;
let isAdminLoggedIn = false;
let loggedInUser = null;
let isEditModeActive = false;
let currentCourseId = 1;

// Biến lưu trữ động hiện tại tải từ DB/Mock
let currentCourse = null;
let currentChapters = [];
let currentLessonsMap = {};
let currentMaterialsMap = {}; // lesson_id -> [materials]

// Cấu hình popup Modal sửa nhanh
let currentModalAction = ''; // 'edit_lesson_props', 'manage_lesson_materials', 'edit_course'
let currentModalTargetId = null; 

// Lưu trữ các thực thể Sortable để dọn dẹp khi bật tắt
let activeSortableInstances = [];

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
    
    // Parse URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = parseInt(urlParams.get('id')) || 1;

    // Elements
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorIndicator = document.getElementById('errorIndicator');
    const courseDetailLayout = document.getElementById('courseDetailLayout');
    const adminToolbar = document.getElementById('adminToolbar');
    const editModeToggle = document.getElementById('editModeToggle');

    // 1. Kiểm tra đăng nhập
    await checkAdminAuth();

    async function checkAdminAuth() {
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
                    } else {
                        isStudentLoggedIn = true;
                    }
                }
            } catch (err) {
                console.error("Lỗi Auth Supabase:", err);
            }
        } else {
            // Chế độ demo
            const demoAdmin = localStorage.getItem('demo_admin_user');
            const demoStudent = localStorage.getItem('demo_student_user');
            
            if (demoAdmin) {
                isAdminLoggedIn = true;
                isUserLoggedIn = true;
                const data = JSON.parse(demoAdmin);
                loggedInUser = { name: data.name, email: data.email };
            } else if (demoStudent) {
                isStudentLoggedIn = true;
                isUserLoggedIn = true;
                const data = JSON.parse(demoStudent);
                loggedInUser = { name: data.name, email: data.email };
            }
        }

        if (isAdminLoggedIn && adminToolbar) {
            adminToolbar.style.display = 'flex';
            document.body.classList.add('admin-toolbar-visible');
            
            // Lấy lại trạng thái edit mode nếu có lưu trước đó
            const savedEditMode = localStorage.getItem('isEditModeActive') === 'true';
            isEditModeActive = savedEditMode;
            if (editModeToggle) {
                editModeToggle.checked = savedEditMode;
            }
        }

        // Vẽ Header động
        initHeaderAuth();
    }

    // Render thông tin tài khoản trên Header
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

            // Dropdown toggle
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

            // Logout event
            const logoutBtn = document.getElementById('headerLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    if (isOnline) {
                        await supabaseClient.auth.signOut();
                    } else {
                        localStorage.removeItem('demo_admin_user');
                        localStorage.removeItem('demo_student_user');
                    }
                    alert("Đã đăng xuất tài khoản!");
                    window.location.reload();
                });
            }
        } else {
            // Chưa đăng nhập
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

    // Toggle Edit Mode
    if (editModeToggle) {
        editModeToggle.addEventListener('change', (e) => {
            isEditModeActive = e.target.checked;
            localStorage.setItem('isEditModeActive', isEditModeActive);
            
            // Vẽ lại toàn bộ trang để cập nhật giao diện
            renderSyllabus(currentChapters, currentLessonsMap, currentMaterialsMap);
            renderSidebar(currentCourse);
            renderCourseIntro(currentCourse);

            // Ẩn tất cả các thanh action bar đang mở
            if (!isEditModeActive) {
                const actionBars = document.querySelectorAll('.inline-action-bar');
                actionBars.forEach(b => b.remove());
            }
        });
    }

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // Tải dữ liệu ban đầu
    await loadCourseDetails(currentCourseId);

    // 2. Tải dữ liệu từ database hoặc offline
    async function loadCourseDetails(id) {
        currentCourse = null;
        currentChapters = [];
        currentLessonsMap = {};
        currentMaterialsMap = {};

        if (isOnline) {
            try {
                // Tải khóa học
                const { data: courseData, error: courseError } = await supabaseClient
                    .from('courses')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (courseError) throw courseError;
                currentCourse = courseData;

                // Tải chương (Sắp xếp theo order_index)
                const { data: chaptersData, error: chaptersError } = await supabaseClient
                    .from('chapters')
                    .select('*')
                    .eq('course_id', id)
                    .order('order_index', { ascending: true });

                if (chaptersError) throw chaptersError;
                currentChapters = chaptersData;

                // Tải bài giảng (Sắp xếp theo order_index)
                const chapterIds = currentChapters.map(c => c.id);
                if (chapterIds.length > 0) {
                    const { data: lessonsData, error: lessonsError } = await supabaseClient
                        .from('lessons')
                        .select('*')
                        .in('chapter_id', chapterIds)
                        .order('order_index', { ascending: true });

                    if (lessonsError) throw lessonsError;

                    const lessonIds = [];
                    lessonsData.forEach(lesson => {
                        if (!currentLessonsMap[lesson.chapter_id]) {
                            currentLessonsMap[lesson.chapter_id] = [];
                        }
                        currentLessonsMap[lesson.chapter_id].push(lesson);
                        lessonIds.push(lesson.id);
                    });

                    // Tải học liệu của các bài giảng (Sắp xếp theo order_index)
                    if (lessonIds.length > 0) {
                        const { data: materialsData, error: materialsError } = await supabaseClient
                            .from('materials')
                            .select('*')
                            .in('lesson_id', lessonIds)
                            .order('order_index', { ascending: true });

                        if (materialsError) throw materialsError;

                        materialsData.forEach(material => {
                            if (!currentMaterialsMap[material.lesson_id]) {
                                currentMaterialsMap[material.lesson_id] = [];
                            }
                            currentMaterialsMap[material.lesson_id].push(material);
                        });
                    }
                }
            } catch (err) {
                console.error("Supabase error, loading offline database:", err);
                loadOfflineData(id);
            }
        } else {
            loadOfflineData(id);
        }

        // Render lên màn hình
        if (currentCourse) {
            renderCourseIntro(currentCourse);
            renderTargetAudience(currentCourse.target_audience);
            renderSyllabus(currentChapters, currentLessonsMap, currentMaterialsMap);
            renderSidebar(currentCourse);
            
            loadingIndicator.style.display = 'none';
            courseDetailLayout.style.display = 'grid';
            setupCheckoutModal();
        } else {
            loadingIndicator.style.display = 'none';
            errorIndicator.style.display = 'block';
        }
    }

    function loadOfflineData(id) {
        dbCourses = JSON.parse(localStorage.getItem('db_courses')) || dbCourses;
        dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || dbChapters;
        dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || dbLessons;
        dbMaterials = JSON.parse(localStorage.getItem('db_materials')) || dbMaterials;

        currentCourse = dbCourses.find(c => c.id == id);
        currentChapters = dbChapters.filter(c => c.course_id == id).sort((a,b) => a.order_index - b.order_index);
        
        currentChapters.forEach(c => {
            currentLessonsMap[c.id] = dbLessons.filter(l => l.chapter_id == c.id).sort((a,b) => a.order_index - b.order_index);
            
            currentLessonsMap[c.id].forEach(l => {
                currentMaterialsMap[l.id] = dbMaterials.filter(m => m.lesson_id == l.id).sort((a,b) => a.order_index - b.order_index);
            });
        });
    }

    // Render thông tin khóa học
    function renderCourseIntro(course) {
        const introBox = document.getElementById('courseIntroBox');
        if (!introBox) return;

        const courseGearHTML = isEditModeActive
            ? `<button class="gear-btn course-gear-btn" data-course-id="${course.id}" style="display: inline-flex;" title="Sửa thông tin khóa học"><i class="fa-solid fa-gear" style="font-size: 1.4rem;"></i></button>`
            : '';

        introBox.innerHTML = `
            <span class="course-tag">${course.tag_label || getTagLabel(course.tag)}</span>
            <h1 style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
                ${course.title}
                ${courseGearHTML}
            </h1>
            <p class="course-desc-large">${course.description}</p>
        `;

        const courseGear = introBox.querySelector('.course-gear-btn');
        if (courseGear) {
            courseGear.addEventListener('click', () => {
                openQuickEditCourseModal(course.id);
            });
        }
    }

    function getTagLabel(tag) {
        if (tag === 'grade10') return 'Lớp 9 lên 10';
        if (tag === 'thpt') return 'Lớp 12 ôn thi THPT';
        if (tag === 'dgnl') return 'Luyện ĐGNL HSA/APT';
        return 'Khóa học ôn thi';
    }

    function renderTargetAudience(audience) {
        const list = document.getElementById('targetAudienceList');
        if (!list || !audience) return;
        list.innerHTML = '';

        audience.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${item}</span>`;
            list.appendChild(li);
        });
    }

    // Render Lộ trình học (3 cấp: Chương > Bài > Học liệu)
    function renderSyllabus(chapters, lessonsMap, materialsMap) {
        const accordion = document.getElementById('syllabusAccordion');
        if (!accordion) return;
        accordion.innerHTML = '';

        const syllabusAddChapterBtn = document.getElementById('syllabusAddChapterBtn');
        if (syllabusAddChapterBtn) {
            syllabusAddChapterBtn.style.display = isEditModeActive ? 'inline-flex' : 'none';
            syllabusAddChapterBtn.onclick = createChapterInline;
        }

        if (chapters.length === 0) {
            accordion.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    Chưa có chương học nào được tạo.
                    ${isEditModeActive ? `<button class="btn btn-primary" onclick="createChapterInline()" style="width: auto; margin-top: 12px; display: block; margin-left: auto; margin-right: auto;"><i class="fa-solid fa-plus"></i> Tạo chương đầu tiên</button>` : ''}
                </div>
            `;
            return;
        }

        chapters.forEach((chapter, index) => {
            const item = document.createElement('div');
            item.className = `accordion-item ${index === 0 ? 'active' : ''}`;
            item.setAttribute('data-id', chapter.id);
            
            const header = document.createElement('div');
            header.className = 'accordion-header';
            
            const chapterDragHTML = isEditModeActive
                ? `<i class="fa-solid fa-grip-vertical chapter-drag-handle" style="color: #94A3B8; cursor: grab; margin-right: 12px;" title="Kéo thả chương"></i>`
                : '';

            header.innerHTML = `
                <span style="display: flex; align-items: center; gap: 8px;">
                    ${chapterDragHTML}
                    ${chapter.title}
                    <button class="gear-btn chapter-gear-btn" data-chapter-id="${chapter.id}" style="display: ${isEditModeActive ? 'inline-flex' : 'none'};" title="Quản lý chương"><i class="fa-solid fa-gear"></i></button>
                </span>
                <i class="fa-solid fa-chevron-down chevron-icon"></i>
            `;
            item.appendChild(header);

            const content = document.createElement('div');
            content.className = 'accordion-content';
            if (index === 0) {
                content.style.maxHeight = '1200px'; 
            }

            const list = document.createElement('ul');
            list.className = 'lesson-list';

            const lessons = lessonsMap[chapter.id] || [];
            if (lessons.length > 0) {
                lessons.forEach(lesson => {
                    const li = document.createElement('li');
                    li.className = 'lesson-item';
                    li.setAttribute('data-id', lesson.id);

                    const lessonDragHTML = isEditModeActive
                        ? `<i class="fa-solid fa-grip-vertical drag-handle" style="color: #94A3B8; cursor: grab; margin-right: 8px;" title="Kéo thả bài"></i>`
                        : '';

                    const materials = materialsMap[lesson.id] || [];

                    // Nút thao tác Admin (chỉ hiện khi bật chế độ sửa)
                    let actionsHTML = '';
                    if (isEditModeActive) {
                        actionsHTML = `
                            <div class="lesson-item-actions" style="margin-left: 12px; display: flex; gap: 8px;">
                                <button class="pencil-btn" data-lesson-id="${lesson.id}" style="display: inline-flex;" title="Sửa tên bài"><i class="fa-solid fa-pencil"></i></button>
                                <button class="gear-btn lesson-gear-btn" data-lesson-id="${lesson.id}" style="display: inline-flex;" title="Quản lý học liệu của bài"><i class="fa-solid fa-gear"></i></button>
                            </div>
                        `;
                    }

                    li.innerHTML = `
                        <div class="lesson-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid rgba(15, 23, 42, 0.03); cursor: pointer;" data-lesson-id="${lesson.id}">
                            <div class="lesson-left" style="display: flex; align-items: center; gap: 10px; flex-grow: 1;">
                                ${lessonDragHTML}
                                <i class="fa-solid fa-folder-open" style="color: #6366F1; font-size: 0.95rem;"></i>
                                <span class="lesson-title-text" style="font-weight: 600; color: var(--text-primary);">${lesson.title}</span>
                            </div>
                            <div class="lesson-right" style="display: flex; align-items: center; gap: 12px;">
                                ${isEditModeActive ? `
                                    <div class="materials-count-badge" style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.06); color: var(--accent-color); padding: 2px 8px; border-radius: 12px; font-weight: 600; white-space: nowrap;">
                                        ${materials.length} học liệu
                                    </div>
                                    ${actionsHTML}
                                ` : `
                                    <i class="fa-solid fa-angle-right" style="color: var(--text-secondary); opacity: 0.6; font-size: 0.85rem;"></i>
                                `}
                            </div>
                        </div>
                    `;
                    list.appendChild(li);
                });
            } else {
                list.innerHTML = `<li class="lesson-item" style="color: var(--text-secondary); font-style: italic;">Chưa có bài học nào trong chương này.</li>`;
            }

            content.appendChild(list);
            item.appendChild(content);
            accordion.appendChild(item);
        });

        // Xử lý click chuyển sang trang chi tiết bài học (lesson.html)
        const lessonRows = accordion.querySelectorAll('.lesson-row');
        lessonRows.forEach(row => {
            row.addEventListener('click', (e) => {
                // Tránh điều hướng khi click vào các nút sửa của admin
                if (e.target.closest('.lesson-item-actions')) return;

                const lessonId = row.getAttribute('data-lesson-id');
                window.location.href = `lesson.html?id=${currentCourseId}&lesson_id=${lessonId}`;
            });
        });

        // Initialize click handlers
        setupAccordions();
        setupInlineGearListeners();
        initDragAndDropSorting();
    }

    function renderSidebar(course) {
        const sidebar = document.getElementById('courseSidebar');
        if (!sidebar) return;

        const priceFormatted = new Intl.NumberFormat('vi-VN').format(course.price || 0) + ' đ';
        
        let featuresHTML = '';
        const features = course.features || [
            { icon: "fa-regular fa-clock", text: `Thời lượng: ${course.duration}` },
            { icon: "fa-solid fa-book-open", text: "Tài liệu đặc quyền: Có (PDF tải về)" },
            { icon: "fa-solid fa-circle-play", text: "Học thử: Có (Bài 1 miễn phí)" },
            { icon: "fa-solid fa-shield-halved", text: "Cam kết chất lượng" }
        ];

        features.forEach(f => {
            featuresHTML += `<li><i class="${f.icon}"></i> <span>${f.text}</span></li>`;
        });

        let actionButtonHTML = '';
        let addChapterButtonHTML = '';

        if (isEditModeActive) {
            actionButtonHTML = `<button class="btn btn-primary w-100 btn-student-role" style="width: 100%;" id="viewAsStudentBtn"><i class="fa-solid fa-eye" style="margin-right: 6px;"></i> Xem với vai trò học sinh</button>`;
            addChapterButtonHTML = `<button class="btn btn-secondary w-100" id="sidebarAddChapterBtn" style="margin-top: 10px; width: 100%; font-weight: 600;"><i class="fa-solid fa-plus"></i> Thêm chương mới</button>`;
        } else {
            actionButtonHTML = `<button class="btn btn-primary w-100 course-register-btn" style="width: 100%;" data-title="${course.title}" data-price="${priceFormatted}">Đăng ký học ngay</button>`;
        }

        sidebar.innerHTML = `
            <div class="sidebar-img-placeholder">
                <img src="${course.image_url}" alt="${course.title}">
            </div>
            <div class="sidebar-price">${priceFormatted}<span>/ khóa</span></div>
            ${actionButtonHTML}
            ${addChapterButtonHTML}
            <ul class="sidebar-features">
                ${featuresHTML}
            </ul>
        `;

        const viewAsStudentBtn = sidebar.querySelector('#viewAsStudentBtn');
        if (viewAsStudentBtn && editModeToggle) {
            viewAsStudentBtn.addEventListener('click', () => {
                editModeToggle.checked = false;
                const event = new Event('change');
                editModeToggle.dispatchEvent(event);
            });
        }

        const sidebarAddChapterBtn = sidebar.querySelector('#sidebarAddChapterBtn');
        if (sidebarAddChapterBtn) {
            sidebarAddChapterBtn.onclick = createChapterInline;
        }
    }

    // 4. KÉO THẢ SẮP XẾP BẰNG SORTABLEJS
    function initDragAndDropSorting() {
        activeSortableInstances.forEach(inst => inst.destroy());
        activeSortableInstances = [];

        if (!isEditModeActive || typeof Sortable === 'undefined') return;

        const accordion = document.getElementById('syllabusAccordion');
        if (accordion) {
            try {
                const chapterSortable = new Sortable(accordion, {
                    animation: 150,
                    handle: '.chapter-drag-handle',
                    onEnd: async () => {
                        const items = accordion.querySelectorAll('.accordion-item');
                        const updates = [];
                        items.forEach((item, index) => {
                            const id = parseInt(item.getAttribute('data-id'));
                            updates.push({ id, order_index: index + 1 });
                        });
                        await saveNewChapterOrder(updates);
                    }
                });
                activeSortableInstances.push(chapterSortable);
            } catch (err) {
                console.error("Lỗi kéo thả chương:", err);
            }
        }

        const lessonLists = document.querySelectorAll('.lesson-list');
        lessonLists.forEach(listEl => {
            try {
                const lessonSortable = new Sortable(listEl, {
                    animation: 150,
                    handle: '.drag-handle',
                    onEnd: async () => {
                        const items = listEl.querySelectorAll('.lesson-item');
                        const updates = [];
                        items.forEach((item, index) => {
                            const id = parseInt(item.getAttribute('data-id'));
                            updates.push({ id, order_index: index + 1 });
                        });
                        await saveNewLessonOrder(updates);
                    }
                });
                activeSortableInstances.push(lessonSortable);
            } catch (err) {
                console.error("Lỗi kéo thả bài:", err);
            }
        });
    }

    async function saveNewChapterOrder(updates) {
        if (isOnline) {
            try {
                const promises = updates.map(u => 
                    supabaseClient.from('chapters').update({ order_index: u.order_index }).eq('id', u.id)
                );
                await Promise.all(promises);
            } catch (err) {
                console.error("Lỗi cập nhật thứ tự chương:", err);
                alert("Không thể lưu thứ tự chương.");
            }
        } else {
            updates.forEach(u => {
                const idx = dbChapters.findIndex(c => c.id == u.id);
                if (idx !== -1) dbChapters[idx].order_index = u.order_index;
            });
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
        }
        loadOfflineData(currentCourseId);
    }

    async function saveNewLessonOrder(updates) {
        if (isOnline) {
            try {
                const promises = updates.map(u => 
                    supabaseClient.from('lessons').update({ order_index: u.order_index }).eq('id', u.id)
                );
                await Promise.all(promises);
            } catch (err) {
                console.error("Lỗi cập nhật thứ tự bài:", err);
                alert("Không thể lưu thứ tự bài.");
            }
        } else {
            updates.forEach(u => {
                const idx = dbLessons.findIndex(l => l.id == u.id);
                if (idx !== -1) dbLessons[idx].order_index = u.order_index;
            });
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }
        loadOfflineData(currentCourseId);
    }

    // 5. INLINE GEAR LISTENERS & ACTION BARS
    function setupInlineGearListeners() {
        // Nút bánh răng chương
        const chapterGears = document.querySelectorAll('.chapter-gear-btn');
        chapterGears.forEach(gear => {
            gear.addEventListener('click', (e) => {
                e.stopPropagation();
                const chapterId = parseInt(gear.getAttribute('data-chapter-id'));
                toggleChapterInlineActionBar(gear, chapterId);
            });
        });

        // Nút hình cây bút (sửa tên bài / thuộc tính)
        const lessonPencils = document.querySelectorAll('.pencil-btn');
        lessonPencils.forEach(pencil => {
            pencil.addEventListener('click', (e) => {
                e.stopPropagation();
                const lessonId = parseInt(pencil.getAttribute('data-lesson-id'));
                openQuickEditLessonPropsModal(lessonId);
            });
        });

        // Nút hình bánh răng (quản lý học liệu con của bài)
        const lessonGears = document.querySelectorAll('.lesson-gear-btn');
        lessonGears.forEach(gear => {
            gear.addEventListener('click', (e) => {
                e.stopPropagation();
                const lessonId = parseInt(gear.getAttribute('data-lesson-id'));
                openManageLessonMaterialsModal(lessonId);
            });
        });
    }

    function toggleChapterInlineActionBar(gearElement, chapterId) {
        const accordionItem = gearElement.closest('.accordion-item');
        const existingBar = accordionItem.querySelector('.inline-action-bar');
        
        document.querySelectorAll('.inline-action-bar').forEach(b => b.remove());

        if (existingBar) return;

        const actionBar = document.createElement('div');
        actionBar.className = 'inline-action-bar';
        
        actionBar.innerHTML = `
            <span class="inline-action-label">CHƯƠNG:</span>
            <button class="inline-action-btn" id="inlineAddLesson"><i class="fa-solid fa-plus" style="color: var(--accent-color);"></i> Tạo bài mới</button>
            <button class="inline-action-btn" id="inlineRenameChapter"><i class="fa-solid fa-pen"></i> Sửa tên</button>
            <button class="inline-action-btn" id="inlineSortChapter"><i class="fa-solid fa-arrow-up-down-left-right" style="color: #F59E0B;"></i> Sắp xếp</button>
            <button class="inline-action-btn delete-btn" id="inlineDeleteChapter"><i class="fa-solid fa-trash" style="color: #EF4444;"></i> Xóa</button>
        `;

        const header = accordionItem.querySelector('.accordion-header');
        header.after(actionBar);
        
        const content = accordionItem.querySelector('.accordion-content');
        if (accordionItem.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + 100 + 'px';
        }

        document.getElementById('inlineAddLesson').onclick = () => createLessonInline(chapterId);
        document.getElementById('inlineRenameChapter').onclick = () => renameChapterInline(chapterId);
        document.getElementById('inlineSortChapter').onclick = () => sortChapterInline(chapterId);
        document.getElementById('inlineDeleteChapter').onclick = () => deleteChapterInline(chapterId);
    }

    // 6. INLINE ACTIONS
    async function createChapterInline() {
        const title = prompt("Nhập tên chương học mới:");
        if (!title || !title.trim()) return;

        const order_index = currentChapters.length > 0 
            ? Math.max(...currentChapters.map(c => c.order_index)) + 1 
            : 1;

        const chapterData = { course_id: currentCourseId, title: title.trim(), order_index };

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').insert([chapterData]);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi tạo chương: " + err.message);
                return;
            }
        } else {
            const newId = dbChapters.length > 0 ? Math.max(...dbChapters.map(c => c.id)) + 1 : 101;
            dbChapters.push({ id: newId, ...chapterData });
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
        }

        alert("Đã tạo chương thành công!");
        await loadCourseDetails(currentCourseId);
    }
    window.createChapterInline = createChapterInline;

    async function renameChapterInline(chapterId) {
        const chapter = currentChapters.find(c => c.id == chapterId);
        if (!chapter) return;

        const newTitle = prompt("Sửa tên chương học:", chapter.title);
        if (newTitle === null || !newTitle.trim() || newTitle.trim() === chapter.title) return;

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').update({ title: newTitle.trim() }).eq('id', chapterId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi sửa tên chương: " + err.message);
                return;
            }
        } else {
            const idx = dbChapters.findIndex(c => c.id == chapterId);
            if (idx !== -1) {
                dbChapters[idx].title = newTitle.trim();
                localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
            }
        }
        await loadCourseDetails(currentCourseId);
    }

    async function sortChapterInline(chapterId) {
        const chapter = currentChapters.find(c => c.id == chapterId);
        if (!chapter) return;

        const newOrder = prompt("Nhập số thứ tự hiển thị của chương:", chapter.order_index);
        if (newOrder === null || isNaN(newOrder) || parseInt(newOrder) === chapter.order_index) return;

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').update({ order_index: parseInt(newOrder) }).eq('id', chapterId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi sắp xếp: " + err.message);
                return;
            }
        } else {
            const idx = dbChapters.findIndex(c => c.id == chapterId);
            if (idx !== -1) {
                dbChapters[idx].order_index = parseInt(newOrder);
                localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
            }
        }
        await loadCourseDetails(currentCourseId);
    }

    async function deleteChapterInline(chapterId) {
        if (!confirm("Thầy chắc chắn muốn xóa chương này chứ?")) return;

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').delete().eq('id', chapterId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi xóa chương: " + err.message);
                return;
            }
        } else {
            dbChapters = dbChapters.filter(c => c.id != chapterId);
            dbLessons = dbLessons.filter(l => l.chapter_id != chapterId);
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }
        await loadCourseDetails(currentCourseId);
    }

    // Tạo nhanh bài học mới trong chương
    async function createLessonInline(chapterId) {
        const title = prompt("Nhập tên bài học mới:");
        if (!title || !title.trim()) return;

        const existingLessons = currentLessonsMap[chapterId] || [];
        const nextOrderIndex = existingLessons.length > 0 
            ? Math.max(...existingLessons.map(l => l.order_index)) + 1 
            : 1;

        const lessonData = { chapter_id: chapterId, title: title.trim(), order_index: nextOrderIndex };

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('lessons').insert([lessonData]);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi tạo bài: " + err.message);
                return;
            }
        } else {
            const newId = dbLessons.length > 0 ? Math.max(...dbLessons.map(l => l.id)) + 1 : 1001;
            dbLessons.push({ id: newId, ...lessonData });
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }

        alert("Tạo bài học mới thành công!");
        await loadCourseDetails(currentCourseId);
    }

    // 7. QUICK EDIT MODALS MANAGER
    const quickEditModal = document.getElementById('quickEditModal');
    const quickEditModalClose = document.getElementById('quickEditModalClose');
    const quickEditCancelBtn = document.getElementById('quickEditCancelBtn');
    const quickEditModalTitle = document.getElementById('quickEditModalTitle');
    const quickEditFields = document.getElementById('quickEditFields');
    const quickEditForm = document.getElementById('quickEditForm');

    // MODAL 1: Sửa thuộc tính bài (Pencil Click)
    function openQuickEditLessonPropsModal(lessonId) {
        currentModalAction = 'edit_lesson_props';
        currentModalTargetId = lessonId;
        quickEditModalTitle.textContent = "Chỉnh sửa tên Bài học";

        let lesson = null;
        if (isOnline) {
            for (let chId in currentLessonsMap) {
                const found = currentLessonsMap[chId].find(l => l.id == lessonId);
                if (found) { lesson = found; break; }
            }
        } else {
            lesson = dbLessons.find(l => l.id == lessonId);
        }

        if (!lesson) return;

        quickEditFields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Tên Bài học</label>
                <input type="text" id="inline_l_title" class="form-control" value="${lesson.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                <input type="number" id="inline_l_order" class="form-control" value="${lesson.order_index || 1}" required>
            </div>
            <div style="margin-top: 20px; border-top: 1px dashed var(--card-border); padding-top: 16px;">
                <button type="button" class="btn btn-danger" onclick="deleteLessonInline(${lesson.id})" style="width: auto;"><i class="fa-solid fa-trash"></i> Xóa Bài học này</button>
            </div>
        `;

        quickEditModal.classList.add('active');
    }

    // MODAL 2: Sửa thông tin khóa học (Gear click của Course)
    function openQuickEditCourseModal(courseId) {
        currentModalAction = 'edit_course';
        currentModalTargetId = courseId;
        quickEditModalTitle.textContent = "Chỉnh sửa thông tin khóa học";

        const course = currentCourse;
        if (!course) return;

        quickEditFields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Tên khóa học</label>
                <input type="text" id="inline_c_title" class="form-control" value="${course.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Học phí (VND)</label>
                <input type="number" id="inline_c_price" class="form-control" value="${course.price}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Thời lượng hiển thị</label>
                <input type="text" id="inline_c_duration" class="form-control" value="${course.duration || ''}" placeholder="Ví dụ: 6 tháng (72 buổi)" required>
            </div>
            <div class="form-group">
                <label class="form-label">Đường dẫn ảnh bìa (Image URL)</label>
                <input type="text" id="inline_c_image" class="form-control" value="${course.image_url || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Mô tả khóa học</label>
                <textarea id="inline_c_desc" class="form-control" style="height: 100px;" required>${course.description || ''}</textarea>
            </div>
        `;

        quickEditModal.classList.add('active');
    }

    // MODAL 3: Quản lý học liệu con (Gear click của Lesson)
    let selectedMaterialId = null;

    function openManageLessonMaterialsModal(lessonId) {
        currentModalAction = 'manage_lesson_materials';
        currentModalTargetId = lessonId;
        quickEditModalTitle.textContent = "Quản lý Học liệu";
        selectedMaterialId = null;

        // Vẽ danh sách học liệu hiện tại và form phụ
        quickEditFields.innerHTML = `
            <div style="margin-bottom: 20px;">
                <label class="form-label" style="font-weight: 700;">Học liệu hiện tại của Bài:</label>
                <div id="materialListContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; border: 1px solid var(--card-border); padding: 8px; border-radius: 8px; background: #F8FAFC;">
                    <!-- Sẽ được điền bằng JS -->
                </div>
                <button type="button" class="btn btn-secondary" id="addNewMaterialBtn" style="margin-top: 10px; width: auto; font-size: 0.85rem; padding: 6px 12px;"><i class="fa-solid fa-plus"></i> Thêm học liệu mới</button>
            </div>
            
            <div id="materialEditDetailsForm" style="display: none; border-top: 1px dashed var(--card-border); padding-top: 16px; margin-top: 16px;">
                <h4 id="materialFormTitle" style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px; color: var(--accent-color);">Sửa Học Liệu</h4>
                <div class="form-group">
                    <label class="form-label">Tiêu đề học liệu</label>
                    <input type="text" id="m_title" class="form-control" placeholder="Ví dụ: Video ôn tập chuyên đề">
                </div>
                <div class="form-group">
                    <label class="form-label">Loại học liệu</label>
                    <select id="m_type" class="form-control">
                        <option value="video">🎥 Video bài giảng</option>
                        <option value="pdf">📄 Tài liệu PDF</option>
                        <option value="text">✍️ Bài viết (Lý thuyết)</option>
                        <option value="quiz">📝 Trắc nghiệm (Quiz)</option>
                    </select>
                </div>
                <div class="form-group" id="m_url_group">
                    <label class="form-label">URL (Link nhúng YouTube hoặc Link file PDF)</label>
                    <input type="text" id="m_url" class="form-control" placeholder="https://...">
                </div>
                <div class="form-group" id="m_content_group" style="display: none;">
                    <label class="form-label">Nội dung lý thuyết (Hỗ trợ HTML)</label>
                    <textarea id="m_content" class="form-control" style="height: 120px;" placeholder="<p>Nhập văn bản bài học tại đây...</p>"></textarea>
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                    <input type="checkbox" id="m_preview" style="width: 18px; height: 18px; cursor: pointer;">
                    <label for="m_preview" style="cursor: pointer; font-weight: 500; font-size: 0.9rem;">Học thử miễn phí</label>
                </div>
                <div class="form-group">
                    <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                    <input type="number" id="m_order" class="form-control" value="1">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 16px;">
                    <button type="button" class="btn btn-primary" id="saveMaterialSubBtn" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">Lưu học liệu</button>
                    <button type="button" class="btn btn-danger" id="deleteMaterialSubBtn" style="width: auto; padding: 6px 12px; font-size: 0.85rem; display: none;">Xóa học liệu</button>
                    <button type="button" class="btn btn-secondary" id="cancelMaterialSubBtn" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">Đóng</button>
                </div>
            </div>
        `;

        refreshMaterialList(lessonId);

        // Đăng ký sự kiện
        document.getElementById('addNewMaterialBtn').onclick = () => showMaterialDetailsForm(null, lessonId);
        document.getElementById('cancelMaterialSubBtn').onclick = () => hideMaterialDetailsForm();
        document.getElementById('saveMaterialSubBtn').onclick = () => saveMaterialSubForm(lessonId);
        document.getElementById('deleteMaterialSubBtn').onclick = () => deleteMaterialSubForm(lessonId);

        // Chuyển loại học liệu để hiện/ẩn URL vs Content
        const mTypeSelect = document.getElementById('m_type');
        if (mTypeSelect) {
            mTypeSelect.onchange = (e) => {
                const type = e.target.value;
                document.getElementById('m_url_group').style.display = (type === 'video' || type === 'pdf') ? 'block' : 'none';
                document.getElementById('m_content_group').style.display = (type === 'text' || type === 'quiz') ? 'block' : 'none';
            };
        }

        quickEditModal.classList.add('active');
    }

    function refreshMaterialList(lessonId) {
        const container = document.getElementById('materialListContainer');
        if (!container) return;

        const materials = currentMaterialsMap[lessonId] || [];
        container.innerHTML = '';

        if (materials.length === 0) {
            container.innerHTML = `<div style="padding: 12px; color: var(--text-secondary); text-style: italic; text-align: center; font-size: 0.85rem;">Chưa có học liệu con nào. Nhấp nút Thêm để bắt đầu!</div>`;
            return;
        }

        materials.forEach(m => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justify = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '8px 12px';
            div.style.background = '#FFFFFF';
            div.style.border = '1px solid var(--card-border)';
            div.style.borderRadius = '6px';
            div.style.cursor = 'pointer';

            let typeIcon = '🎥';
            if (m.type === 'pdf') typeIcon = '📄';
            else if (m.type === 'text') typeIcon = '✍️';
            else if (m.type === 'quiz') typeIcon = '📝';

            div.innerHTML = `
                <span style="font-size: 0.85rem; font-weight: 500;">${typeIcon} ${m.title} ${m.is_preview ? '<b>(Thử)</b>' : ''}</span>
                <i class="fa-solid fa-pen-to-square" style="color: var(--accent-color); font-size: 0.85rem;"></i>
            `;
            div.onclick = () => showMaterialDetailsForm(m, lessonId);
            container.appendChild(div);
        });
    }

    function showMaterialDetailsForm(material, lessonId) {
        const formDiv = document.getElementById('materialEditDetailsForm');
        const formTitle = document.getElementById('materialFormTitle');
        const deleteBtn = document.getElementById('deleteMaterialSubBtn');
        if (!formDiv) return;

        formDiv.style.display = 'block';

        if (material) {
            selectedMaterialId = material.id;
            formTitle.textContent = "Sửa Học Liệu";
            deleteBtn.style.display = 'inline-flex';

            document.getElementById('m_title').value = material.title;
            document.getElementById('m_type').value = material.type;
            document.getElementById('m_url').value = material.url || '';
            document.getElementById('m_content').value = material.content || '';
            document.getElementById('m_preview').checked = material.is_preview;
            document.getElementById('m_order').value = material.order_index;

            // Trigger change type
            const event = new Event('change');
            document.getElementById('m_type').dispatchEvent(event);
        } else {
            selectedMaterialId = null;
            formTitle.textContent = "Thêm Học Liệu Mới";
            deleteBtn.style.display = 'none';

            // Giá trị mặc định
            document.getElementById('m_title').value = '';
            document.getElementById('m_type').value = 'video';
            document.getElementById('m_url').value = '';
            document.getElementById('m_content').value = '';
            document.getElementById('m_preview').checked = false;
            
            const materials = currentMaterialsMap[lessonId] || [];
            const nextOrder = materials.length > 0 ? Math.max(...materials.map(m => m.order_index)) + 1 : 1;
            document.getElementById('m_order').value = nextOrder;

            const event = new Event('change');
            document.getElementById('m_type').dispatchEvent(event);
        }
    }

    function hideMaterialDetailsForm() {
        const formDiv = document.getElementById('materialEditDetailsForm');
        if (formDiv) formDiv.style.display = 'none';
        selectedMaterialId = null;
    }

    async function saveMaterialSubForm(lessonId) {
        const title = document.getElementById('m_title').value.trim();
        const type = document.getElementById('m_type').value;
        const url = document.getElementById('m_url').value.trim();
        const content = document.getElementById('m_content').value.trim();
        const is_preview = document.getElementById('m_preview').checked;
        const order_index = parseInt(document.getElementById('m_order').value) || 1;

        if (!title) {
            alert("Vui lòng nhập tiêu đề học liệu!");
            return;
        }

        const materialData = { lesson_id: lessonId, title, type, url, content, is_preview, order_index };

        if (selectedMaterialId) {
            // Update
            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').update(materialData).eq('id', selectedMaterialId);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi cập nhật học liệu: " + err.message);
                    return;
                }
            } else {
                const idx = dbMaterials.findIndex(m => m.id == selectedMaterialId);
                if (idx !== -1) {
                    dbMaterials[idx] = { id: selectedMaterialId, ...materialData };
                    localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
                }
            }
            alert("Cập nhật học liệu thành công!");
        } else {
            // Create
            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('materials').insert([materialData]);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi tạo học liệu: " + err.message);
                    return;
                }
            } else {
                const newId = dbMaterials.length > 0 ? Math.max(...dbMaterials.map(m => m.id)) + 1 : 10001;
                dbMaterials.push({ id: newId, ...materialData });
                localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
            }
            alert("Thêm học liệu mới thành công!");
        }

        hideMaterialDetailsForm();
        // Load lại bộ nhớ đệm
        if (!isOnline) loadOfflineData(currentCourseId);
        else await loadCourseDetails(currentCourseId);
        
        refreshMaterialList(lessonId);
    }

    async function deleteMaterialSubForm(lessonId) {
        if (!selectedMaterialId) return;
        if (!confirm("Thầy chắc chắn muốn xóa học liệu này chứ?")) return;

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('materials').delete().eq('id', selectedMaterialId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi khi xóa: " + err.message);
                return;
            }
        } else {
            dbMaterials = dbMaterials.filter(m => m.id != selectedMaterialId);
            localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
        }

        alert("Đã xóa học liệu!");
        hideMaterialDetailsForm();
        if (!isOnline) loadOfflineData(currentCourseId);
        else await loadCourseDetails(currentCourseId);
        
        refreshMaterialList(lessonId);
    }

    function closeQuickEditModal() {
        quickEditModal.classList.remove('active');
        quickEditForm.reset();
        currentModalAction = '';
        currentModalTargetId = null;
    }

    if (quickEditModalClose) quickEditModalClose.onclick = closeQuickEditModal;
    if (quickEditCancelBtn) quickEditCancelBtn.onclick = closeQuickEditModal;

    // Submit Modal Form (Chỉ xử lý lưu cho Course và Lesson Props, còn Học liệu được lưu tức thời)
    if (quickEditForm) {
        quickEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (currentModalAction === 'manage_lesson_materials') {
                closeQuickEditModal();
                await loadCourseDetails(currentCourseId);
                return;
            }

            if (currentModalAction === 'edit_course') {
                const courseId = currentModalTargetId;
                const title = document.getElementById('inline_c_title').value.trim();
                const price = parseInt(document.getElementById('inline_c_price').value);
                const duration = document.getElementById('inline_c_duration').value.trim();
                const image_url = document.getElementById('inline_c_image').value.trim();
                const description = document.getElementById('inline_c_desc').value.trim();

                const courseUpdateData = { title, price, duration, image_url, description };

                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('courses').update(courseUpdateData).eq('id', courseId);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi lưu thông tin khóa học: " + err.message);
                        return;
                    }
                } else {
                    const idx = dbCourses.findIndex(c => c.id == courseId);
                    if (idx !== -1) {
                        dbCourses[idx] = { ...dbCourses[idx], ...courseUpdateData };
                        localStorage.setItem('db_courses', JSON.stringify(dbCourses));
                    }
                }
                alert("Đã cập nhật thông tin khóa học!");
            } 
            else if (currentModalAction === 'edit_lesson_props') {
                const lessonId = currentModalTargetId;
                const title = document.getElementById('inline_l_title').value.trim();
                const order_index = parseInt(document.getElementById('inline_l_order').value);

                const lessonData = { title, order_index };

                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('lessons').update(lessonData).eq('id', lessonId);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi lưu bài học: " + err.message);
                        return;
                    }
                } else {
                    const idx = dbLessons.findIndex(l => l.id == lessonId);
                    if (idx !== -1) {
                        dbLessons[idx].title = title;
                        dbLessons[idx].order_index = order_index;
                        localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
                    }
                }
                alert("Lưu thay đổi bài học thành công!");
            }

            closeQuickEditModal();
            await loadCourseDetails(currentCourseId);
        });
    }

    // Xóa Bài học
    async function deleteLessonInline(lessonId) {
        if (!confirm("Thầy chắc chắn muốn xóa bài học này chứ? Toàn bộ học liệu con của bài cũng sẽ bị xóa.")) {
            return;
        }

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('lessons').delete().eq('id', lessonId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi xóa bài: " + err.message);
                return;
            }
        } else {
            dbLessons = dbLessons.filter(l => l.id != lessonId);
            dbMaterials = dbMaterials.filter(m => m.lesson_id != lessonId);
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
            localStorage.setItem('db_materials', JSON.stringify(dbMaterials));
        }

        alert("Đã xóa bài giảng thành công!");
        closeQuickEditModal();
        await loadCourseDetails(currentCourseId);
    }
    window.deleteLessonInline = deleteLessonInline;

    // 8. SETUP ACCORDIONS LOGIC
    function setupAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                // Tránh trigger mở đóng accordion khi nhấp vào gear của chương học
                if (e.target.closest('.gear-btn')) return;

                const item = header.closest('.accordion-item');
                const content = item.querySelector('.accordion-content');
                if (!content) return;
                const isActive = item.classList.contains('active');

                if (isActive) {
                    item.classList.remove('active');
                    content.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 200 + 'px';
                }
            });
        });
    }

    // 9. CHECKOUT MODAL SETUP
    function setupCheckoutModal() {
        const modal = document.getElementById('checkoutModal');
        const modalClose = document.querySelector('.modal-close');
        const registerBtns = document.querySelectorAll('.course-register-btn');
        const modalCourseTitle = document.getElementById('modalCourseTitle');
        const modalCoursePrice = document.getElementById('modalCoursePrice');
        const modalQrImg = document.getElementById('modalQrImg');

        function openModal(title, price) {
            if (!modal) return;
            modalCourseTitle.textContent = title;
            modalCoursePrice.textContent = price;

            const cleanPrice = price.replace(/[^\d]/g, '');
            modalQrImg.src = `https://api.vietqr.io/image/970407-19035623674015-vietqr_net.jpg?accountName=TOAN%20SMART%20ACADEMY&amount=${cleanPrice}&addInfo=DkKhoc%20${encodeURIComponent(title)}`;

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        registerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const title = btn.getAttribute('data-title');
                const price = btn.getAttribute('data-price');
                openModal(title, price);
            });
        });

        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }
    }
});
