// Toán Smart Website - Main Interactions & Homepage Course Loader

// Mock Data dự phòng khi chạy offline (Không cấu hình Supabase)
const MOCK_COURSES = [
    {
        id: 1,
        title: "Luyện Thi Vào Lớp 10 Toán Mục Tiêu 9+",
        tag: "grade10",
        tag_label: "Lớp 9 lên 10",
        price: 1500000,
        description: "Bứt phá điểm số hình học học kỳ 2, đại số chuyên đề, luyện giải đề thi thử sát với cấu trúc sở GD&ĐT các năm gần đây.",
        duration: "6 tháng (72 buổi)",
        image_url: "assets/images/course-10.png"
    },
    {
        id: 2,
        title: "Luyện Thi Tốt Nghiệp THPT Chuyên Sâu",
        tag: "thpt",
        tag_label: "Lớp 12 ôn thi THPT",
        price: 2000000,
        description: "Hệ thống toàn bộ kiến thức đại số, giải tích, hình học 12. Rèn luyện các kỹ năng phân tích nhanh trắc nghiệm, bấm máy tính Casio tối ưu 30s.",
        duration: "8 tháng (96 buổi)",
        image_url: "assets/images/course-thpt.png"
    },
    {
        id: 3,
        title: "Luyện Tư Duy Định Lượng HSA/APT (ĐGNL)",
        tag: "dgnl",
        tag_label: "Luyện ĐGNL HSA/APT",
        price: 1800000,
        description: "Phát triển tư duy phân tích số liệu khoa học, logic toán học cực nhanh bám sát cấu trúc đề của ĐHQG Hà Nội & ĐHQG TP.HCM.",
        duration: "4 tháng (48 buổi)",
        image_url: "assets/images/course-dgnl.png"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header Scroll Class
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        detectActiveSection();
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

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

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            const icon = menuToggle?.querySelector('i');
            if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            }
        });
    });

    // 3. Active Link Detection
    const sections = document.querySelectorAll('section, hero');
    function detectActiveSection() {
        let current = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id') || '';
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}` || link.getAttribute('href') === `index.html#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // 4. Load Courses (Homepage)
    const coursesGrid = document.querySelector('.courses-grid');
    if (coursesGrid) {
        loadHomepageCourses();
    }

    async function loadHomepageCourses() {
        let courses = [];
        
        // Kiểm tra xem có cấu hình Supabase Client không
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
            try {
                const { data, error } = await supabaseClient
                    .from('courses')
                    .select('*')
                    .order('id', { ascending: true });
                
                if (error) throw error;
                courses = data;
            } catch (err) {
                console.error("Lỗi khi tải khóa học từ Supabase. Chuyển sang dữ liệu dự phòng:", err);
                courses = MOCK_COURSES;
            }
        } else {
            courses = MOCK_COURSES;
        }

        renderCourses(courses);
    }

    function renderCourses(courses) {
        if (!coursesGrid) return;
        coursesGrid.innerHTML = '';

        courses.forEach(course => {
            const priceFormatted = new Intl.NumberFormat('vi-VN').format(course.price) + ' đ';
            const card = document.createElement('div');
            card.className = `course-card`;
            card.setAttribute('data-category', course.tag);

            card.innerHTML = `
                <div class="course-image-wrapper">
                    <span class="course-tag">${course.tag_label || getTagLabel(course.tag)}</span>
                    <img src="${course.image_url}" alt="${course.title}" class="course-img">
                </div>
                <div class="course-info">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-desc">${course.description}</p>
                    <div class="course-meta">
                        <div class="meta-item">
                            <i class="fa-regular fa-clock"></i>
                            <span>${course.duration}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-solid fa-user-group"></i>
                            <span>Tương tác trực tiếp</span>
                        </div>
                    </div>
                    <div class="course-footer">
                        <div class="course-price">${priceFormatted}<span>/ khóa</span></div>
                        <a href="course-detail.html?id=${course.id}" class="btn btn-primary" style="padding: 10px 20px; font-size: 0.9rem;">Xem khóa học</a>
                    </div>
                </div>
            `;
            coursesGrid.appendChild(card);
        });

        // Kích hoạt lại bộ lọc khóa học sau khi render xong
        setupCourseFilters();
    }

    function getTagLabel(tag) {
        if (tag === 'grade10') return 'Lớp 9 lên 10';
        if (tag === 'thpt') return 'Lớp 12 ôn thi THPT';
        if (tag === 'dgnl') return 'Luyện ĐGNL HSA/APT';
        return 'Khóa học ôn thi';
    }

    // 5. Course Filtering Setup
    function setupCourseFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const courseCards = document.querySelectorAll('.course-card');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                courseCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || category === filterValue) {
                        card.style.display = 'flex';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.style.opacity = '1';
                        }, 50);
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // 6. Search Resources/Blog Logic (Homepage)
    const searchInput = document.querySelector('.search-input');
    const resourceCards = document.querySelectorAll('.resource-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            resourceCards.forEach(card => {
                const title = card.querySelector('.resource-title').textContent.toLowerCase();
                const excerpt = card.querySelector('.resource-excerpt').textContent.toLowerCase();
                const type = card.querySelector('.resource-type').textContent.toLowerCase();

                if (title.includes(searchTerm) || excerpt.includes(searchTerm) || type.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 7. Contact Form Submission (Homepage)
    const contactForm = document.getElementById('mathContactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';

            setTimeout(() => {
                alert('Đăng ký tư vấn thành công! Thầy/cô sẽ liên hệ với em trong vòng 24 giờ qua Số điện thoại/Zalo nhé.');
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1200);
        });
    }
});
