// Toán Smart Website - Dynamic Course Details Page Loader & Interactions

// Mock Data dự phòng khi chạy offline (Không kết nối Supabase)
const MOCK_COURSES_DETAILS = {
    1: {
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
    2: {
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
    3: {
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
};

const MOCK_CHAPTERS = {
    1: [
        { id: 101, title: "Chương 1: Đại số chuyên sâu & Hệ thức Vi-ét ôn thi vào 10" },
        { id: 102, title: "Chương 2: Hình học phẳng & Tứ giác nội tiếp đường tròn" },
        { id: 103, title: "Chương 3: Luyện đề thi thử & Chiến thuật tối ưu điểm số" }
    ],
    2: [
        { id: 201, title: "Chương 1: Khảo sát hàm số & Giải tích 12 chuyên sâu" },
        { id: 202, title: "Chương 2: Tuyệt kỹ Casio & Phương pháp giải nhanh trắc nghiệm 30s" },
        { id: 203, title: "Chương 3: Hình học không gian & Hình học tọa độ Oxyz" }
    ],
    3: [
        { id: 301, title: "Chương 1: Logic toán học & Kỹ năng phân tích bảng số liệu thực tế" },
        { id: 302, title: "Chương 2: Tổng ôn toán học phổ thông bám sát cấu trúc đề HSA/APT" }
    ]
};

const MOCK_LESSONS = {
    101: [
        { id: 1001, title: "Bài 1: Phương trình bậc hai & Hệ thức Vi-ét cơ bản", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "25:12", is_preview: true },
        { id: 1002, title: "Bài 2: Phương pháp rút gọn biểu thức chứa căn thức bậc hai", type: "pdf", url: "assets/docs/de-thi-thu-toan-vao-10.pdf", duration: "", is_preview: true },
        { id: 1003, title: "Bài 3: Giải toán bằng cách lập phương trình, hệ phương trình", type: "video", url: "", duration: "", is_preview: false },
        { id: 1004, title: "Bài 4: Các bài toán chứa tham số m liên quan đến cực trị Vi-ét", type: "video", url: "", duration: "", is_preview: false }
    ],
    102: [
        { id: 1005, title: "Bài 5: Định nghĩa & 4 phương pháp chứng minh Tứ giác nội tiếp", type: "video", url: "", duration: "", is_preview: false },
        { id: 1006, title: "Bài 6: Các bài toán về tiếp tuyến đường tròn cực kỳ đặc sắc", type: "video", url: "", duration: "", is_preview: false },
        { id: 1007, title: "Bài 7: Chứng minh ba điểm thẳng hàng, hai đường thẳng vuông góc", type: "video", url: "", duration: "", is_preview: false }
    ],
    103: [
        { id: 1008, title: "Bài 8: Giải đề thi thử bám sát cấu trúc sở GD&ĐT Hà Nội", type: "video", url: "", duration: "", is_preview: false },
        { id: 1009, title: "Bài 9: Các lỗi sai ngớ ngẩn làm mất điểm Toán tự luận", type: "video", url: "", duration: "", is_preview: false }
    ],
    201: [
        { id: 2001, title: "Bài 1: Sự đồng biến, nghịch biến của hàm số chứa tham số m", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "28:45", is_preview: true },
        { id: 2002, title: "Bài 2: Phương pháp cực trị hàm số liên kết đồ thị f'(x)", type: "pdf", url: "assets/docs/so-tay-toan-12.pdf", duration: "", is_preview: true },
        { id: 2003, title: "Bài 3: Nhận diện đồ thị hàm số và các bài toán biện luận nghiệm", type: "video", url: "", duration: "", is_preview: false }
    ],
    202: [
        { id: 2004, title: "Bài 4: Kỹ thuật Casio giải nhanh tích phân chống sai số nâng cao", type: "video", url: "", duration: "", is_preview: false },
        { id: 2005, title: "Bài 5: Tối ưu thời gian giải toán số phức bằng máy tính Casio", type: "video", url: "", duration: "", is_preview: false }
    ],
    203: [
        { id: 2006, title: "Bài 6: Phương pháp ghép trục tọa độ Oxyz giải nhanh cực trị hình học", type: "video", url: "", duration: "", is_preview: false },
        { id: 2007, title: "Bài 7: Góc và khoảng cách trong không gian - Giải nhanh trắc nghiệm", type: "video", url: "", duration: "", is_preview: false }
    ],
    301: [
        { id: 3001, title: "Bài 1: Phương pháp đọc đề, phân tích bảng biểu thống kê phức tạp", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "32:10", is_preview: true },
        { id: 3002, title: "Bài 2: Các bài toán tư duy logic, suy luận toán học đặc sắc tuyển chọn", type: "pdf", url: "assets/docs/so-tay-toan-12.pdf", duration: "", is_preview: true },
        { id: 3003, title: "Bài 3: Kỹ thuật loại trừ phương án nhiễu trong phần thi Định lượng", type: "video", url: "", duration: "", is_preview: false }
    ],
    302: [
        { id: 3004, title: "Bài 4: Chuyên đề Số học & Đại số ôn thi ĐGNL Hà Nội", type: "video", url: "", duration: "", is_preview: false },
        { id: 3005, title: "Bài 5: Chuyên đề Tổ hợp, Xác suất & Thống kê trong đề ĐGNL TP.HCM", type: "video", url: "", duration: "", is_preview: false }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Course ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id')) || 1; // Default to course 1 if not specified

    // Elements
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorIndicator = document.getElementById('errorIndicator');
    const courseDetailLayout = document.getElementById('courseDetailLayout');

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

    loadCourseDetails(courseId);

    // 2. Fetch logic from Supabase or Mock Data
    async function loadCourseDetails(id) {
        let course = null;
        let chapters = [];
        let lessonsMap = {}; // key: chapter_id, value: array of lessons

        // Check if database client is configured
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
            try {
                // Fetch course info
                const { data: courseData, error: courseError } = await supabaseClient
                    .from('courses')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (courseError) throw courseError;
                course = courseData;

                // Fetch chapters
                const { data: chaptersData, error: chaptersError } = await supabaseClient
                    .from('chapters')
                    .select('*')
                    .eq('course_id', id)
                    .order('order_index', { ascending: true });

                if (chaptersError) throw chaptersError;
                chapters = chaptersData;

                // Fetch lessons for all chapters
                const chapterIds = chapters.map(c => c.id);
                if (chapterIds.length > 0) {
                    const { data: lessonsData, error: lessonsError } = await supabaseClient
                        .from('lessons')
                        .select('*')
                        .in('chapter_id', chapterIds)
                        .order('order_index', { ascending: true });

                    if (lessonsError) throw lessonsError;

                    // Group lessons by chapter_id
                    lessonsData.forEach(lesson => {
                        if (!lessonsMap[lesson.chapter_id]) {
                            lessonsMap[lesson.chapter_id] = [];
                        }
                        lessonsMap[lesson.chapter_id].push(lesson);
                    });
                }

            } catch (err) {
                console.error("Lỗi khi tải thông tin từ Supabase. Chuyển sang chế độ dự phòng offline:", err);
                course = MOCK_COURSES_DETAILS[id];
                chapters = MOCK_CHAPTERS[id] || [];
                // Map mock lessons
                chapters.forEach(c => {
                    lessonsMap[c.id] = MOCK_LESSONS[c.id] || [];
                });
            }
        } else {
            // Offline preview mode fallback
            course = MOCK_COURSES_DETAILS[id];
            chapters = MOCK_CHAPTERS[id] || [];
            if (chapters.length > 0) {
                chapters.forEach(c => {
                    lessonsMap[c.id] = MOCK_LESSONS[c.id] || [];
                });
            }
        }

        // Render page
        if (course) {
            renderCourseIntro(course);
            renderTargetAudience(course.target_audience);
            renderSyllabus(chapters, lessonsMap);
            renderSidebar(course);
            
            // Show Layout, Hide Loading
            loadingIndicator.style.display = 'none';
            courseDetailLayout.style.display = 'grid';
            setupCheckoutModal();
        } else {
            loadingIndicator.style.display = 'none';
            errorIndicator.style.display = 'block';
        }
    }

    // 3. Render functions
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

        chapters.forEach((chapter, index) => {
            const item = document.createElement('div');
            // First chapter is active by default
            item.className = `accordion-item ${index === 0 ? 'active' : ''}`;
            
            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.innerHTML = `
                <span>${chapter.title}</span>
                <i class="fa-solid fa-chevron-down chevron-icon"></i>
            `;
            item.appendChild(header);

            const content = document.createElement('div');
            content.className = 'accordion-content';
            // Set max-height for the first active item so it animates open
            if (index === 0) {
                // Approximate height for initial render, script will adjust
                content.style.maxHeight = '600px'; 
            }

            const list = document.createElement('ul');
            list.className = 'lesson-list';

            const lessons = lessonsMap[chapter.id] || [];
            if (lessons.length > 0) {
                lessons.forEach(lesson => {
                    const li = document.createElement('li');
                    li.className = 'lesson-item';

                    // Left Side (Icon + Lesson Name)
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
                        <div class="lesson-left">
                            ${iconHTML}
                            <span>${lesson.title}</span>
                        </div>
                        <div class="lesson-right">
                            ${rightHTML}
                        </div>
                    `;
                    list.appendChild(li);
                });
            } else {
                list.innerHTML = `<li class="lesson-item">Đang cập nhật danh sách bài học...</li>`;
            }

            content.appendChild(list);
            item.appendChild(content);
            accordion.appendChild(item);
        });

        // Initialize Accordion Click Handlers
        setupAccordions();
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
            { icon: "fa-solid fa-shield-halved", text: "Cam kết đầu ra chất lượng" }
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
            <ul class="sidebar-features">
                ${featuresHTML}
            </ul>
        `;
    }

    function setupAccordions() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.closest('.accordion-item');
                const content = item.querySelector('.accordion-content');
                const isActive = item.classList.contains('active');

                if (isActive) {
                    item.classList.remove('active');
                    content.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }

    // 4. Modal Setup
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
