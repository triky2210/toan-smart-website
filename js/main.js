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

    // 8. Tích hợp Đăng nhập & Đăng ký trên Header
    initHeaderAuth();
    
    // Nạp nội dung Trang chủ
    initHomepage();

    async function initHomepage() {
        await loadHomepageContent();
    }

    async function initHeaderAuth() {
        const authContainer = document.getElementById('headerAuthContainer');
        if (!authContainer) return;

        const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
        let user = null;

        if (isOnline) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session && session.user) {
                    user = {
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                        email: session.user.email,
                        isAdmin: false
                    };
                    
                    if (session.user.email === 'admin@toansmart.edu.vn' || session.user.email === 'trungtamtoansmart@gmail.com') {
                        user.isAdmin = true;
                        initHomepageAdminEditing();
                    }
                }
            } catch (err) {
                console.error("Lỗi Auth Supabase ở Header:", err);
            }
        }

        // Fallback to LocalStorage checks if user is still null (both for offline mode or offline demo login when online is enabled)
        if (!user) {
            const demoAdmin = localStorage.getItem('demo_admin_user');
            const demoStudent = localStorage.getItem('demo_student_user');
            
            if (demoAdmin) {
                const data = JSON.parse(demoAdmin);
                user = { name: data.name, email: data.email, isAdmin: true };
                initHomepageAdminEditing();
            } else if (demoStudent) {
                const data = JSON.parse(demoStudent);
                user = { name: data.name, email: data.email, isAdmin: false };
            }
        }

        if (user) {
            // Đã đăng nhập: Vẽ Dropdown tài khoản
            const avatarChar = user.name.charAt(0).toUpperCase();
            
            authContainer.innerHTML = `
                <div class="user-profile-menu">
                    <div class="profile-trigger" id="profileTrigger">
                        <div class="user-avatar">${avatarChar}</div>
                        <span class="user-name-span" style="font-weight: 600;">${user.name}</span>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 4px;"></i>
                    </div>
                    <div class="profile-dropdown-menu" id="profileDropdown">
                        <div class="profile-dropdown-header">
                            <span class="user-name">${user.name}</span>
                            <span class="user-email">${user.email}</span>
                        </div>
                        <ul class="profile-dropdown-list">
                            ${user.isAdmin ? `
                                <li class="profile-dropdown-item"><a href="admin.html"><i class="fa-solid fa-gauge"></i> Trang Dashboard</a></li>
                            ` : ''}
                            <li class="profile-dropdown-item logout-btn"><button id="headerLogoutBtn" style="border: none; background: none; width: 100%; text-align: left; padding: 10px 12px; cursor: pointer;"><i class="fa-solid fa-right-from-bracket"></i> Đăng xuất</button></li>
                        </ul>
                    </div>
                </div>
            `;

            // Xử lý đóng mở dropdown
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

            // Xử lý nút Đăng xuất
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
            // Chưa đăng nhập: Vẽ nút Đăng nhập
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

    // --- QUẢN TRỊ NỘI DUNG TRANG CHỦ (INLINE EDITING) ---
    
    let homepageContent = null;

    const DEFAULT_HOMEPAGE_CONTENT = {
        hero_title: "Bứt Phá Điểm Số<br><span>Toán Học</span> Kỳ Thi Lớn",
        hero_desc: "Khóa học ôn thi Toán chuyên sâu vào lớp 10, thi tốt nghiệp THPT Quốc Gia và Đánh giá năng lực (HSA/APT). Giúp học sinh nắm vững bản chất, rèn luyện tư duy giải nhanh để tự tin đỗ nguyện vọng 1.",
        hero_btn_primary_text: "Khám phá khóa học",
        hero_btn_primary_link: "#courses",
        hero_btn_secondary_text: "Đăng ký tư vấn miễn phí",
        hero_btn_secondary_link: "#contact",
        hero_image_url: "assets/images/teacher-avatar.jpg",
        
        about_tag: "Người đồng hành",
        about_title: "Thầy Tùng Dương",
        about_intro: "Thầy Tùng Dương, cựu học sinh THPT chuyên Vĩnh Phúc, Tốt nghiệp ĐH Sư phạm Hà Nội ngành Toán Tiếng Anh, Thạc sĩ Toán học ĐH Sư phạm Hà Nội, nhiều năm kinh nghiệm ôn thi vào 10, ôn thi tốt nghiệp THPT, ĐGNL.",
        about_quote: `"Toán học không đơn thuần là những công thức khô khan, mà là nghệ thuật rèn luyện tư duy logic. Tại Toán Smart, thầy không chỉ truyền thụ kiến thức thi cử bám sát thực tế, mà còn giúp các em xây dựng nền tảng tư duy toán học rộng mở để tự tin vượt qua mọi dạng bài mới."`,
        about_image_url: "assets/images/teacher-avatar.jpg",
        
        feature_1_title: "Tư duy mở rộng",
        feature_1_desc: "Dạy phương pháp giải bản chất thay vì học vẹt công thức toán.",
        feature_2_title: "Bám sát đề thi",
        feature_2_desc: "Cập nhật liên tục xu hướng ra đề thi vào 10, tốt nghiệp THPT mới nhất.",
        
        contact_title: "Nhận Tư Vấn Lộ Trình Học Chi Tiết",
        contact_desc: "Hãy gửi lại thông tin để thầy tư vấn trực tiếp và gửi tặng bộ tài liệu ôn thi đắc lực nhất phù hợp với học lực hiện tại của em.",
        contact_hotline: "0912.345.678 (Hỗ trợ 24/7)",
        contact_email: "lienhe@toansmart.edu.vn",
        
        footer_desc: "Nơi học Toán từ bản chất, nâng tầm tư duy logic và đồng hành cùng sự bứt phá học thuật của thế hệ trẻ Việt Nam.",
        footer_fb_link: "#",
        footer_yt_link: "#",
        footer_tt_link: "#"
    };

    async function loadHomepageContent() {
        let content = null;
        
        // 1. Cố gắng tải từ Supabase trước nếu online
        if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
            try {
                const { data, error } = await supabaseClient
                    .from('homepage_settings')
                    .select('value')
                    .eq('key', 'content')
                    .single();
                
                if (!error && data) {
                    content = data.value;
                }
            } catch (err) {
                console.warn("Chưa cấu hình bảng homepage_settings trên Supabase. Sẽ dùng LocalStorage/Mặc định.", err);
            }
        }
        
        // 2. Nếu online thất bại hoặc offline, tải từ LocalStorage
        if (!content) {
            const localData = localStorage.getItem('db_homepage_content');
            if (localData) {
                content = JSON.parse(localData);
            } else {
                content = DEFAULT_HOMEPAGE_CONTENT;
            }
        }
        
        homepageContent = content;
        applyHomepageContent(content);
    }

    function applyHomepageContent(content) {
        // Hero Section
        const heroTitleEl = document.querySelector('.hero-content h1');
        const heroDescEl = document.querySelector('.hero-content p');
        const heroBtns = document.querySelectorAll('.hero-btns a');
        const heroImgEl = document.querySelector('.hero-image');
        
        if (heroTitleEl && content.hero_title) heroTitleEl.innerHTML = content.hero_title;
        if (heroDescEl && content.hero_desc) heroDescEl.textContent = content.hero_desc;
        if (heroBtns[0] && content.hero_btn_primary_text) {
            heroBtns[0].textContent = content.hero_btn_primary_text;
            heroBtns[0].setAttribute('href', content.hero_btn_primary_link || '#');
        }
        if (heroBtns[1] && content.hero_btn_secondary_text) {
            heroBtns[1].textContent = content.hero_btn_secondary_text;
            heroBtns[1].setAttribute('href', content.hero_btn_secondary_link || '#');
        }
        if (heroImgEl && content.hero_image_url) heroImgEl.setAttribute('src', content.hero_image_url);
        
        // About Section
        const aboutTagEl = document.querySelector('.about-content .about-tag');
        const aboutTitleEl = document.querySelector('.about-content h2');
        const aboutIntroEl = document.querySelector('.about-content .about-intro');
        const aboutQuoteEl = document.querySelector('.about-content .about-details p');
        const aboutImgEl = document.querySelector('.about-img');
        
        if (aboutTagEl && content.about_tag) aboutTagEl.textContent = content.about_tag;
        if (aboutTitleEl && content.about_title) aboutTitleEl.textContent = content.about_title;
        if (aboutIntroEl && content.about_intro) aboutIntroEl.textContent = content.about_intro;
        if (aboutQuoteEl && content.about_quote) aboutQuoteEl.textContent = content.about_quote;
        if (aboutImgEl && content.about_image_url) aboutImgEl.setAttribute('src', content.about_image_url);
        
        // Feature boxes
        const featureBoxes = document.querySelectorAll('.feature-box');
        if (featureBoxes[0] && content.feature_1_title) {
            const title = featureBoxes[0].querySelector('h4');
            const desc = featureBoxes[0].querySelector('p');
            if (title) title.textContent = content.feature_1_title;
            if (desc) desc.textContent = content.feature_1_desc;
        }
        if (featureBoxes[1] && content.feature_2_title) {
            const title = featureBoxes[1].querySelector('h4');
            const desc = featureBoxes[1].querySelector('p');
            if (title) title.textContent = content.feature_2_title;
            if (desc) desc.textContent = content.feature_2_desc;
        }
        
        // Contact Section
        const contactTitleEl = document.querySelector('.contact-info-panel h2');
        const contactDescEl = document.querySelector('.contact-info-panel p');
        const contactItems = document.querySelectorAll('.contact-item');
        if (contactTitleEl && content.contact_title) contactTitleEl.textContent = content.contact_title;
        if (contactDescEl && content.contact_desc) contactDescEl.textContent = content.contact_desc;
        if (contactItems[0] && content.contact_hotline) {
            const p = contactItems[0].querySelector('p');
            if (p) p.textContent = content.contact_hotline;
        }
        if (contactItems[1] && content.contact_email) {
            const p = contactItems[1].querySelector('p');
            if (p) p.textContent = content.contact_email;
        }
        
        // Footer Section
        const footerBrandDesc = document.querySelector('.footer-brand p');
        const socialLinks = document.querySelectorAll('.social-links a');
        if (footerBrandDesc && content.footer_desc) footerBrandDesc.textContent = content.footer_desc;
        if (socialLinks[0] && content.footer_fb_link) socialLinks[0].setAttribute('href', content.footer_fb_link);
        if (socialLinks[1] && content.footer_yt_link) socialLinks[1].setAttribute('href', content.footer_yt_link);
        if (socialLinks[2] && content.footer_tt_link) socialLinks[2].setAttribute('href', content.footer_tt_link);
    }

    // Khởi động tính năng sửa cho admin
    function initHomepageAdminEditing() {
        const heroContent = document.querySelector('.hero-content');
        const aboutContent = document.querySelector('.about-content');
        const contactInfo = document.querySelector('.contact-info-panel');
        
        // Tránh tạo trùng lặp nút nếu hàm chạy nhiều lần
        if (document.querySelector('.homepage-section-edit-btn')) return;

        // 1. Thêm nút sửa vào phần Hero
        if (heroContent) {
            const editBtn = document.createElement('button');
            editBtn.className = 'homepage-section-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa nội dung Hero';
            editBtn.style.top = '0';
            editBtn.style.right = '0';
            editBtn.addEventListener('click', () => {
                document.getElementById('editHeroTitle').value = homepageContent.hero_title || '';
                document.getElementById('editHeroDesc').value = homepageContent.hero_desc || '';
                document.getElementById('editHeroBtnPrimaryText').value = homepageContent.hero_btn_primary_text || '';
                document.getElementById('editHeroBtnPrimaryLink').value = homepageContent.hero_btn_primary_link || '';
                document.getElementById('editHeroBtnSecondaryText').value = homepageContent.hero_btn_secondary_text || '';
                document.getElementById('editHeroBtnSecondaryLink').value = homepageContent.hero_btn_secondary_link || '';
                document.getElementById('editHeroImageUrl').value = homepageContent.hero_image_url || '';
                document.getElementById('editHeroModal').classList.add('active');
            });
            heroContent.appendChild(editBtn);
        }
        
        // 2. Thêm nút sửa vào phần About
        if (aboutContent) {
            const editBtn = document.createElement('button');
            editBtn.className = 'homepage-section-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa phần Giới thiệu';
            editBtn.style.top = '0';
            editBtn.style.right = '0';
            editBtn.addEventListener('click', () => {
                document.getElementById('editAboutTag').value = homepageContent.about_tag || '';
                document.getElementById('editAboutTitle').value = homepageContent.about_title || '';
                document.getElementById('editAboutIntro').value = homepageContent.about_intro || '';
                document.getElementById('editAboutQuote').value = homepageContent.about_quote || '';
                document.getElementById('editAboutImageUrl').value = homepageContent.about_image_url || '';
                document.getElementById('editFeature1Title').value = homepageContent.feature_1_title || '';
                document.getElementById('editFeature1Desc').value = homepageContent.feature_1_desc || '';
                document.getElementById('editFeature2Title').value = homepageContent.feature_2_title || '';
                document.getElementById('editFeature2Desc').value = homepageContent.feature_2_desc || '';
                document.getElementById('editAboutModal').classList.add('active');
            });
            aboutContent.appendChild(editBtn);
        }
        
        // 3. Thêm nút sửa vào phần Contact & Footer
        if (contactInfo) {
            const editBtn = document.createElement('button');
            editBtn.className = 'homepage-section-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa phần Liên hệ & Footer';
            editBtn.style.top = '0';
            editBtn.style.right = '0';
            editBtn.addEventListener('click', () => {
                document.getElementById('editContactTitle').value = homepageContent.contact_title || '';
                document.getElementById('editContactDesc').value = homepageContent.contact_desc || '';
                document.getElementById('editContactHotline').value = homepageContent.contact_hotline || '';
                document.getElementById('editContactEmail').value = homepageContent.contact_email || '';
                document.getElementById('editFooterDesc').value = homepageContent.footer_desc || '';
                document.getElementById('editFooterFbLink').value = homepageContent.footer_fb_link || '';
                document.getElementById('editFooterYtLink').value = homepageContent.footer_yt_link || '';
                document.getElementById('editFooterTtLink').value = homepageContent.footer_tt_link || '';
                document.getElementById('editContactModal').classList.add('active');
            });
            contactInfo.appendChild(editBtn);
        }
    }

    // Đóng Modal trang chủ
    window.closeHomepageModal = function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    };

    // Hàm lưu cấu hình trang chủ chung
    async function saveHomepageContent(updatedContent) {
        homepageContent = { ...homepageContent, ...updatedContent };
        localStorage.setItem('db_homepage_content', JSON.stringify(homepageContent));
        
        const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
        if (isOnline) {
            try {
                const { error } = await supabaseClient
                    .from('homepage_settings')
                    .upsert({ key: 'content', value: homepageContent });
                
                if (error) throw error;
            } catch (err) {
                console.error("Lỗi đồng bộ Supabase:", err);
                alert("Đã lưu thành công vào bộ nhớ trình duyệt của máy (offline). Lưu ý: Việc lưu lên dữ liệu trực tuyến Supabase gặp lỗi (bạn cần chạy câu lệnh SQL tạo bảng 'homepage_settings' ở cuối file 'supabase_setup.sql' trong Dashboard của Supabase để sửa lỗi này).");
            }
        }
        
        alert("Lưu thay đổi thành công!");
        window.location.reload();
    }

    // Thiết lập sự kiện gửi Form
    const editHeroForm = document.getElementById('editHeroForm');
    if (editHeroForm) {
        editHeroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveHomepageContent({
                hero_title: document.getElementById('editHeroTitle').value.trim(),
                hero_desc: document.getElementById('editHeroDesc').value.trim(),
                hero_btn_primary_text: document.getElementById('editHeroBtnPrimaryText').value.trim(),
                hero_btn_primary_link: document.getElementById('editHeroBtnPrimaryLink').value.trim(),
                hero_btn_secondary_text: document.getElementById('editHeroBtnSecondaryText').value.trim(),
                hero_btn_secondary_link: document.getElementById('editHeroBtnSecondaryLink').value.trim(),
                hero_image_url: document.getElementById('editHeroImageUrl').value.trim()
            });
        });
    }

    const editAboutForm = document.getElementById('editAboutForm');
    if (editAboutForm) {
        editAboutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveHomepageContent({
                about_tag: document.getElementById('editAboutTag').value.trim(),
                about_title: document.getElementById('editAboutTitle').value.trim(),
                about_intro: document.getElementById('editAboutIntro').value.trim(),
                about_quote: document.getElementById('editAboutQuote').value.trim(),
                about_image_url: document.getElementById('editAboutImageUrl').value.trim(),
                feature_1_title: document.getElementById('editFeature1Title').value.trim(),
                feature_1_desc: document.getElementById('editFeature1Desc').value.trim(),
                feature_2_title: document.getElementById('editFeature2Title').value.trim(),
                feature_2_desc: document.getElementById('editFeature2Desc').value.trim()
            });
        });
    }

    const editContactForm = document.getElementById('editContactForm');
    if (editContactForm) {
        editContactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveHomepageContent({
                contact_title: document.getElementById('editContactTitle').value.trim(),
                contact_desc: document.getElementById('editContactDesc').value.trim(),
                contact_hotline: document.getElementById('editContactHotline').value.trim(),
                contact_email: document.getElementById('editContactEmail').value.trim(),
                footer_desc: document.getElementById('editFooterDesc').value.trim(),
                footer_fb_link: document.getElementById('editFooterFbLink').value.trim(),
                footer_yt_link: document.getElementById('editFooterYtLink').value.trim(),
                footer_tt_link: document.getElementById('editFooterTtLink').value.trim()
            });
        });
    }
});
