// Toán Smart Website - Dynamic Course Details Page Loader & Inline Editor

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
    { id: 1001, chapter_id: 101, title: "Bài 1: Phương trình bậc hai & Hệ thức Vi-ét cơ bản", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "25:12", is_preview: true, order_index: 1 },
    { id: 1002, chapter_id: 101, title: "Bài 2: Phương pháp rút gọn biểu thức chứa căn thức bậc hai", type: "pdf", url: "assets/docs/de-thi-thu-toan-vao-10.pdf", duration: "", is_preview: true, order_index: 2 },
    { id: 1003, chapter_id: 101, title: "Bài 3: Giải toán bằng cách lập phương trình, hệ phương trình", type: "video", url: "", duration: "", is_preview: false, order_index: 3 },
    { id: 1004, chapter_id: 101, title: "Bài 4: Các bài toán chứa tham số m liên quan đến cực trị Vi-ét", type: "video", url: "", duration: "", is_preview: false, order_index: 4 },
    { id: 1005, chapter_id: 102, title: "Bài 5: Định nghĩa & 4 phương pháp chứng minh Tứ giác nội tiếp", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 1006, chapter_id: 102, title: "Bài 6: Các bài toán về tiếp tuyến đường tròn cực kỳ đặc sắc", type: "video", url: "", duration: "", is_preview: false, order_index: 2 },
    { id: 1007, chapter_id: 102, title: "Bài 7: Chứng minh ba điểm thẳng hàng, hai đường thẳng vuông góc", type: "video", url: "", duration: "", is_preview: false, order_index: 3 },
    { id: 1008, chapter_id: 103, title: "Bài 8: Giải đề thi thử bám sát cấu trúc sở GD&ĐT Hà Nội", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 1009, chapter_id: 103, title: "Bài 9: Các lỗi sai ngớ ngẩn làm mất điểm Toán tự luận", type: "video", url: "", duration: "", is_preview: false, order_index: 2 },
    { id: 2001, chapter_id: 201, title: "Bài 1: Sự đồng biến, nghịch biến của hàm số chứa tham số m", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "28:45", is_preview: true, order_index: 1 },
    { id: 2002, chapter_id: 201, title: "Bài 2: Phương pháp cực trị hàm số liên kết đồ thị f'(x)", type: "pdf", url: "assets/docs/so-tay-toan-12.pdf", duration: "", is_preview: true, order_index: 2 },
    { id: 2003, chapter_id: 201, title: "Bài 3: Nhận diện đồ thị hàm số và các bài toán biện luận nghiệm", type: "video", url: "", duration: "", is_preview: false, order_index: 3 },
    { id: 2004, chapter_id: 202, title: "Bài 4: Kỹ thuật Casio giải nhanh tích phân chống sai số nâng cao", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 2005, chapter_id: 202, title: "Bài 5: Tối ưu thời gian giải toán số phức bằng máy tính Casio", type: "video", url: "", duration: "", is_preview: false, order_index: 2 },
    { id: 2006, chapter_id: 203, title: "Bài 6: Phương pháp ghép trục tọa độ Oxyz giải nhanh cực trị hình học", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 2007, chapter_id: 203, title: "Bài 7: Góc và khoảng cách trong không gian - Giải nhanh trắc nghiệm", type: "video", url: "", duration: "", is_preview: false, order_index: 2 },
    { id: 3001, chapter_id: 301, title: "Bài 1: Phương pháp đọc đề, phân tích bảng biểu thống kê phức tạp", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "32:10", is_preview: true, order_index: 1 },
    { id: 3002, chapter_id: 301, title: "Bài 2: Các bài toán tư duy logic, suy luận toán học đặc sắc tuyển chọn", type: "pdf", url: "assets/docs/so-tay-toan-12.pdf", duration: "", is_preview: true, order_index: 2 },
    { id: 3003, chapter_id: 301, title: "Bài 3: Kỹ thuật loại trừ phương án nhiễu trong phần thi Định lượng", type: "video", url: "", duration: "", is_preview: false, order_index: 3 },
    { id: 3004, chapter_id: 302, title: "Bài 4: Chuyên đề Số học & Đại số ôn thi ĐGNL Hà Nội", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 3005, chapter_id: 302, title: "Bài 5: Chuyên đề Tổ hợp, Xác suất & Thống kê trong đề ĐGNL TP.HCM", type: "video", url: "", duration: "", is_preview: false, order_index: 2 }
];

// Trạng thái Admin & Edit mode
let isAdminLoggedIn = false;
let isEditModeActive = false;
let currentCourseId = 1;

// Biến lưu trữ động hiện tại tải từ DB/Mock
let currentCourse = null;
let currentChapters = [];
let currentLessonsMap = {};

// Cấu hình popup Modal sửa nhanh
let currentModalAction = ''; // 'edit_lesson', 'create_lesson'
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

    // 1. Kiểm tra đăng nhập Admin
    await checkAdminAuth();

    async function checkAdminAuth() {
        if (isOnline) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    isAdminLoggedIn = true;
                }
            } catch (err) {
                console.error("Lỗi Auth Supabase:", err);
            }
        } else {
            // Chế độ demo
            if (localStorage.getItem('demo_admin_user')) {
                isAdminLoggedIn = true;
            }
        }

        if (isAdminLoggedIn && adminToolbar) {
            adminToolbar.style.display = 'flex';
            
            // Lấy lại trạng thái edit mode nếu có lưu trước đó
            const savedEditMode = localStorage.getItem('isEditModeActive') === 'true';
            isEditModeActive = savedEditMode;
            if (editModeToggle) {
                editModeToggle.checked = savedEditMode;
            }
        }
    }

    // Toggle Edit Mode
    if (editModeToggle) {
        editModeToggle.addEventListener('change', (e) => {
            isEditModeActive = e.target.checked;
            localStorage.setItem('isEditModeActive', isEditModeActive);
            
            // Vẽ lại toàn bộ Syllabus để cập nhật hoặc ẩn biểu tượng kéo thả drag-handle
            renderSyllabus(currentChapters, currentLessonsMap);
            renderSidebar(currentCourse);

            // Ẩn tất cả các thanh action bar đang mở
            if (!isEditModeActive) {
                const actionBars = document.querySelectorAll('.inline-action-bar');
                actionBars.forEach(b => b.remove());
            }
        });
    }

    // Mobil navbar toggle (for subpages)
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

                    lessonsData.forEach(lesson => {
                        if (!currentLessonsMap[lesson.chapter_id]) {
                            currentLessonsMap[lesson.chapter_id] = [];
                        }
                        currentLessonsMap[lesson.chapter_id].push(lesson);
                    });
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
            renderSyllabus(currentChapters, currentLessonsMap);
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
        // Đồng bộ dữ liệu local
        dbCourses = JSON.parse(localStorage.getItem('db_courses')) || dbCourses;
        dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || dbChapters;
        dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || dbLessons;

        currentCourse = dbCourses.find(c => c.id == id);
        currentChapters = dbChapters.filter(c => c.course_id == id).sort((a,b) => a.order_index - b.order_index);
        
        currentChapters.forEach(c => {
            currentLessonsMap[c.id] = dbLessons.filter(l => l.chapter_id == c.id).sort((a,b) => a.order_index - b.order_index);
        });
    }

    // 3. Render chức năng
    function renderCourseIntro(course) {
        const introBox = document.getElementById('courseIntroBox');
        if (!introBox) return;

        introBox.innerHTML = `
            <span class="course-tag">${course.tag_label || getTagLabel(course.tag)}</span>
            <h1>${course.title}</h1>
            <p class="course-desc-large">${course.description}</p>
        `;
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

    function renderSyllabus(chapters, lessonsMap) {
        const accordion = document.getElementById('syllabusAccordion');
        if (!accordion) return;
        accordion.innerHTML = '';

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
            
            // Biểu tượng tay nắm kéo thả chương (chỉ hiện khi bật edit mode)
            const chapterDragHTML = isEditModeActive
                ? `<i class="fa-solid fa-grip-vertical chapter-drag-handle" style="color: #94A3B8; cursor: grab; margin-right: 12px;" title="Kéo thả để sắp xếp chương"></i>`
                : '';

            // Tên chương + Nút bánh răng kế bên
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
                content.style.maxHeight = '800px'; 
            }

            const list = document.createElement('ul');
            list.className = 'lesson-list';

            const lessons = lessonsMap[chapter.id] || [];
            if (lessons.length > 0) {
                lessons.forEach(lesson => {
                    const li = document.createElement('li');
                    li.className = 'lesson-item';
                    li.setAttribute('data-id', lesson.id);

                    // Biểu tượng tay nắm kéo thả bài (chỉ hiện khi bật edit mode)
                    const lessonDragHTML = isEditModeActive
                        ? `<i class="fa-solid fa-grip-vertical drag-handle" style="color: #94A3B8; cursor: grab; margin-right: 8px;" title="Kéo thả để sắp xếp bài giảng"></i>`
                        : '';

                    // Left Side (Icon + Lesson Name + Gear Icon next to lesson)
                    let iconHTML = '';
                    if (lesson.is_preview) {
                        iconHTML = lesson.type === 'video' 
                            ? `<i class="fa-solid fa-circle-play"></i>` 
                            : `<i class="fa-regular fa-file-pdf"></i>`;
                    } else {
                        iconHTML = `<i class="fa-solid fa-lock"></i>`;
                    }

                    // Right Side (Trial btn or Locked status)
                    let rightHTML = '';
                    if (lesson.is_preview) {
                        if (lesson.type === 'video') {
                            rightHTML = `
                                <span class="lesson-duration">${lesson.duration || ''}</span>
                                <a href="${lesson.url}" target="_blank" class="lesson-btn">Học thử</a>
                            `;
                        } else {
                            rightHTML = `<a href="${lesson.url}" download class="lesson-btn">Tải PDF mẫu</a>`;
                        }
                    } else {
                        rightHTML = `<span class="lesson-locked">Khóa học viên</span>`;
                    }

                    li.innerHTML = `
                        <div class="lesson-left" style="display: flex; align-items: center; gap: 8px; flex-grow: 1;">
                            ${lessonDragHTML}
                            ${iconHTML}
                            <span style="font-weight: 500;">${lesson.title}</span>
                            <button class="gear-btn lesson-gear-btn" data-lesson-id="${lesson.id}" style="display: ${isEditModeActive ? 'inline-flex' : 'none'};" title="Sửa bài giảng"><i class="fa-solid fa-gear"></i></button>
                        </div>
                        <div class="lesson-right">
                            ${rightHTML}
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

        // Initialize click handlers
        setupAccordions();
        setupInlineGearListeners();
        
        // Khởi tạo tính năng kéo thả SortableJS
        initDragAndDropSorting();
    }

    function renderSidebar(course) {
        const sidebar = document.getElementById('courseSidebar');
        if (!sidebar) return;

        const priceFormatted = new Intl.NumberFormat('vi-VN').format(course.price) + ' đ';
        
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

        sidebar.innerHTML = `
            <div class="sidebar-img-placeholder">
                <img src="${course.image_url}" alt="${course.title}">
            </div>
            <div class="sidebar-price">${priceFormatted}<span>/ khóa</span></div>
            <button class="btn btn-primary w-100 course-register-btn" style="width: 100%;" data-title="${course.title}" data-price="${priceFormatted}">Đăng ký học ngay</button>
            
            ${isEditModeActive ? `<button class="btn btn-secondary w-100" onclick="createChapterInline()" style="margin-top: 10px; width: 100%;"><i class="fa-solid fa-plus"></i> Thêm chương mới</button>` : ''}
            
            <ul class="sidebar-features">
                ${featuresHTML}
            </ul>
        `;
    }

    // 4. KÉO THẢ SẮP XẾP BẰNG SORTABLEJS
    function initDragAndDropSorting() {
        // Dọn dẹp các instance cũ trước đó
        activeSortableInstances.forEach(inst => inst.destroy());
        activeSortableInstances = [];

        // Nếu không bật chế độ chỉnh sửa, không kích hoạt kéo thả
        if (!isEditModeActive || typeof Sortable === 'undefined') return;

        // 1. Kéo thả sắp xếp Chương học (Accordion items)
        const accordion = document.getElementById('syllabusAccordion');
        if (accordion) {
            try {
                const chapterSortable = new Sortable(accordion, {
                    animation: 150,
                    handle: '.chapter-drag-handle', // Chỉ cho kéo bằng tay nắm
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
                console.error("Lỗi khởi tạo kéo thả chương:", err);
            }
        }

        // 2. Kéo thả sắp xếp Bài học trong từng chương
        const lessonLists = document.querySelectorAll('.lesson-list');
        lessonLists.forEach(listEl => {
            try {
                const lessonSortable = new Sortable(listEl, {
                    animation: 150,
                    handle: '.drag-handle', // Chỉ cho kéo bằng tay nắm
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
                console.error("Lỗi khởi tạo kéo thả bài giảng:", err);
            }
        });
    }

    async function saveNewChapterOrder(updates) {
        if (isOnline) {
            try {
                // Chạy cập nhật hàng loạt song song lên Supabase
                const promises = updates.map(u => 
                    supabaseClient.from('chapters').update({ order_index: u.order_index }).eq('id', u.id)
                );
                await Promise.all(promises);
            } catch (err) {
                console.error("Lỗi cập nhật thứ tự chương trên Supabase:", err);
                alert("Không thể lưu thứ tự chương mới lên database.");
            }
        } else {
            // Offline
            updates.forEach(u => {
                const idx = dbChapters.findIndex(c => c.id == u.id);
                if (idx !== -1) dbChapters[idx].order_index = u.order_index;
            });
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
        }

        // Reload data cục bộ mà không load lại trang
        loadOfflineData(currentCourseId);
    }

    async function saveNewLessonOrder(updates) {
        if (isOnline) {
            try {
                // Chạy cập nhật hàng loạt song song lên Supabase
                const promises = updates.map(u => 
                    supabaseClient.from('lessons').update({ order_index: u.order_index }).eq('id', u.id)
                );
                await Promise.all(promises);
            } catch (err) {
                console.error("Lỗi cập nhật thứ tự bài học trên Supabase:", err);
                alert("Không thể lưu thứ tự bài học mới lên database.");
            }
        } else {
            // Offline
            updates.forEach(u => {
                const idx = dbLessons.findIndex(l => l.id == u.id);
                if (idx !== -1) dbLessons[idx].order_index = u.order_index;
            });
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }

        // Reload data cục bộ mà không load lại trang
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

        // Nút bánh răng bài giảng (mở modal)
        const lessonGears = document.querySelectorAll('.lesson-gear-btn');
        lessonGears.forEach(gear => {
            gear.addEventListener('click', (e) => {
                e.stopPropagation();
                const lessonId = parseInt(gear.getAttribute('data-lesson-id'));
                openQuickEditLessonModal(lessonId);
            });
        });
    }

    function toggleChapterInlineActionBar(gearElement, chapterId) {
        const accordionItem = gearElement.closest('.accordion-item');
        const existingBar = accordionItem.querySelector('.inline-action-bar');
        
        // Đóng các action bar khác đang mở
        document.querySelectorAll('.inline-action-bar').forEach(b => b.remove());

        if (existingBar) {
            return;
        }

        // Tạo thanh menu inline
        const chapter = currentChapters.find(c => c.id == chapterId);
        const actionBar = document.createElement('div');
        actionBar.className = 'inline-action-bar';
        
        actionBar.innerHTML = `
            <span class="inline-action-label">CHƯƠNG:</span>
            <button class="inline-action-btn" id="inlineAddLesson"><i class="fa-solid fa-plus" style="color: var(--accent-color);"></i> Tạo bài học</button>
            <button class="inline-action-btn" id="inlineRenameChapter"><i class="fa-solid fa-pen"></i> Sửa tên</button>
            <button class="inline-action-btn" id="inlineSortChapter"><i class="fa-solid fa-arrow-up-down-left-right" style="color: #F59E0B;"></i> Sắp xếp</button>
            <button class="inline-action-btn delete-btn" id="inlineDeleteChapter"><i class="fa-solid fa-trash" style="color: #EF4444;"></i> Xóa</button>
        `;

        // Insert vào dưới header của accordion
        const header = accordionItem.querySelector('.accordion-header');
        header.after(actionBar);
        
        // Mở rộng accordion content để chứa vừa bar
        const content = accordionItem.querySelector('.accordion-content');
        if (accordionItem.classList.contains('active')) {
            content.style.maxHeight = content.scrollHeight + 100 + 'px';
        }

        // Gắn sự kiện các nút
        document.getElementById('inlineAddLesson').onclick = () => openQuickCreateLessonModal(chapterId);
        document.getElementById('inlineRenameChapter').onclick = () => renameChapterInline(chapterId);
        document.getElementById('inlineSortChapter').onclick = () => sortChapterInline(chapterId);
        document.getElementById('inlineDeleteChapter').onclick = () => deleteChapterInline(chapterId);
    }

    // 6. INLINE ACTIONS IMPLEMENTATION
    window.createChapterInline = async () => {
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
                alert("Lỗi khi tạo chương online: " + err.message);
                return;
            }
        } else {
            // Offline
            const newId = dbChapters.length > 0 ? Math.max(...dbChapters.map(c => c.id)) + 1 : 101;
            dbChapters.push({ id: newId, ...chapterData });
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
        }

        alert("Đã tạo chương thành công!");
        await loadCourseDetails(currentCourseId);
    };

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
                alert("Lỗi khi sửa tên chương: " + err.message);
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

        const newOrder = prompt("Nhập số thứ tự hiển thị của chương (Ví dụ: 1, 2, 3...):", chapter.order_index);
        if (newOrder === null || isNaN(newOrder) || parseInt(newOrder) === chapter.order_index) return;

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').update({ order_index: parseInt(newOrder) }).eq('id', chapterId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi khi sắp xếp chương: " + err.message);
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
        if (!confirm("Thầy chắc chắn muốn xóa chương này chứ? Tất cả bài giảng bên trong chương cũng sẽ bị xóa.")) {
            return;
        }

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('chapters').delete().eq('id', chapterId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi khi xóa chương online: " + err.message);
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

    // 6. QUICK EDIT / CREATE LESSON POPUP MODAL
    const quickEditModal = document.getElementById('quickEditModal');
    const quickEditModalClose = document.getElementById('quickEditModalClose');
    const quickEditCancelBtn = document.getElementById('quickEditCancelBtn');
    const quickEditModalTitle = document.getElementById('quickEditModalTitle');
    const quickEditFields = document.getElementById('quickEditFields');
    const quickEditForm = document.getElementById('quickEditForm');

    function openQuickCreateLessonModal(chapterId) {
        currentModalAction = 'create_lesson';
        currentModalTargetId = chapterId;
        quickEditModalTitle.textContent = "Thêm bài học mới";
        
        // Tính toán thứ tự hiển thị bài học mới mặc định ở cuối chương
        const existingLessons = currentLessonsMap[chapterId] || [];
        const nextOrderIndex = existingLessons.length > 0 
            ? Math.max(...existingLessons.map(l => l.order_index || 1)) + 1 
            : 1;

        quickEditFields.innerHTML = `
            <div class="form-group">
                <label class="form-label">Tên bài giảng / tài liệu</label>
                <input type="text" id="inline_l_title" class="form-control" placeholder="Ví dụ: Bài 1: Mệnh đề" required>
            </div>
            <div class="form-group">
                <label class="form-label">Loại bài học</label>
                <select id="inline_l_type" class="form-control" required>
                    <option value="video">Video bài giảng</option>
                    <option value="pdf">File tài liệu PDF</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">URL (Link nhúng YouTube hoặc link PDF)</label>
                <input type="text" id="inline_l_url" class="form-control" placeholder="https://...">
            </div>
            <div class="form-group">
                <label class="form-label">Thời lượng (Nếu có, ví dụ: 25:12)</label>
                <input type="text" id="inline_l_duration" class="form-control">
            </div>
            <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                <input type="checkbox" id="inline_l_preview" style="width: 18px; height: 18px; cursor: pointer;" checked>
                <label for="inline_l_preview" style="cursor: pointer; font-weight: 500; font-size: 0.9rem;">Cho học thử miễn phí</label>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                <input type="number" id="inline_l_order" class="form-control" value="${nextOrderIndex}" required>
            </div>
        `;

        quickEditModal.classList.add('active');
    }

    function openQuickEditLessonModal(lessonId) {
        currentModalAction = 'edit_lesson';
        currentModalTargetId = lessonId;
        quickEditModalTitle.textContent = "Chỉnh sửa bài học";

        // Tìm thông tin bài giảng
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
                <label class="form-label">Tên bài giảng / tài liệu</label>
                <input type="text" id="inline_l_title" class="form-control" value="${lesson.title}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Loại bài học</label>
                <select id="inline_l_type" class="form-control" required>
                    <option value="video" ${lesson.type === 'video' ? 'selected' : ''}>Video bài giảng</option>
                    <option value="pdf" ${lesson.type === 'pdf' ? 'selected' : ''}>File tài liệu PDF</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">URL (Link nhúng YouTube hoặc link PDF)</label>
                <input type="text" id="inline_l_url" class="form-control" value="${lesson.url || ''}">
            </div>
            <div class="form-group">
                <label class="form-label">Thời lượng (Nếu có, ví dụ: 25:12)</label>
                <input type="text" id="inline_l_duration" class="form-control" value="${lesson.duration || ''}">
            </div>
            <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                <input type="checkbox" id="inline_l_preview" style="width: 18px; height: 18px; cursor: pointer;" ${lesson.is_preview ? 'checked' : ''}>
                <label for="inline_l_preview" style="cursor: pointer; font-weight: 500; font-size: 0.9rem;">Cho học thử miễn phí (Không cần tài khoản)</label>
            </div>
            <div class="form-group" style="margin-top: 16px;">
                <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                <input type="number" id="inline_l_order" class="form-control" value="${lesson.order_index || 1}" required>
            </div>
            <div style="margin-top: 20px; border-top: 1px dashed var(--card-border); padding-top: 16px;">
                <button type="button" class="btn btn-danger" onclick="deleteLessonInline(${lesson.id})" style="width: auto;"><i class="fa-solid fa-trash"></i> Xóa bài giảng này</button>
            </div>
        `;

        quickEditModal.classList.add('active');
    }

    function closeQuickEditModal() {
        quickEditModal.classList.remove('active');
        quickEditForm.reset();
        currentModalAction = '';
        currentModalTargetId = null;
    }

    if (quickEditModalClose) quickEditModalClose.onclick = closeQuickEditModal;
    if (quickEditCancelBtn) quickEditCancelBtn.onclick = closeQuickEditModal;

    // Submit Modal Form
    if (quickEditForm) {
        quickEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('inline_l_title').value.trim();
            const type = document.getElementById('inline_l_type').value;
            const url = document.getElementById('inline_l_url').value.trim();
            const duration = document.getElementById('inline_l_duration').value.trim();
            const is_preview = document.getElementById('inline_l_preview').checked;
            const order_index = parseInt(document.getElementById('inline_l_order').value);

            const lessonData = { title, type, url, duration, is_preview, order_index };

            if (currentModalAction === 'create_lesson') {
                const chapter_id = currentModalTargetId;
                const newLesson = { chapter_id, ...lessonData };

                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('lessons').insert([newLesson]);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi khi thêm bài học online: " + err.message);
                        return;
                    }
                } else {
                    const newId = dbLessons.length > 0 ? Math.max(...dbLessons.map(l => l.id)) + 1 : 1001;
                    dbLessons.push({ id: newId, ...newLesson });
                    localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
                }
                alert("Đã thêm bài học thành công!");
            } 
            else if (currentModalAction === 'edit_lesson') {
                const lessonId = currentModalTargetId;

                if (isOnline) {
                    try {
                        const { error } = await supabaseClient.from('lessons').update(lessonData).eq('id', lessonId);
                        if (error) throw error;
                    } catch (err) {
                        alert("Lỗi khi lưu bài học online: " + err.message);
                        return;
                    }
                } else {
                    const idx = dbLessons.findIndex(l => l.id == lessonId);
                    if (idx !== -1) {
                        dbLessons[idx] = { id: lessonId, chapter_id: dbLessons[idx].chapter_id, ...lessonData };
                        localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
                    }
                }
                alert("Đã lưu thay đổi bài học!");
            }

            closeQuickEditModal();
            await loadCourseDetails(currentCourseId);
        });
    }

    // Xóa bài giảng trực tiếp
    window.deleteLessonInline = async (lessonId) => {
        if (!confirm("Thầy chắc chắn muốn xóa bài giảng này chứ? Hành động này không thể hoàn tác.")) {
            return;
        }

        if (isOnline) {
            try {
                const { error } = await supabaseClient.from('lessons').delete().eq('id', lessonId);
                if (error) throw error;
            } catch (err) {
                alert("Lỗi khi xóa bài học: " + err.message);
                return;
            }
        } else {
            dbLessons = dbLessons.filter(l => l.id != lessonId);
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }

        alert("Đã xóa bài giảng!");
        closeQuickEditModal();
        await loadCourseDetails(currentCourseId);
    };

    // 6.5. SETUP ACCORDIONS LOGIC
    function setupAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
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
                    content.style.maxHeight = content.scrollHeight + 150 + 'px';
                }
            });
        });
    }

    // 7. CHECKOUT MODAL SETUP
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
                if (e.target === modal) {
                    closeModal();
                }
            });
        }
    }
});
