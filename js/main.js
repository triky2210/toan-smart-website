// Toán Smart Website - Main Interactions & Featured Courses Loader (Lớp 11 & 12)

const FEATURED_COURSES = [
    {
        id: 1,
        title: "Toán Học Lớp 11 - Nền Tảng & Chuyên Sâu",
        grade: "Toán Lớp 11",
        tag: "grade11",
        badge: "Chương trình mới GDPT 2018",
        badge_icon: "fa-sparkles",
        description: "Bứt phá toàn bộ kiến thức Hàm số lượng giác, Dãy số, Cấp số cộng - Cấp số nhân, Giới hạn, Đạo hàm, Xác suất và Hình học không gian 11 bám sát chương trình mới GDPT 2018.",
        features: [
            "Trọn bộ video bài giảng bản chất & sơ đồ tư duy",
            "Ngân hàng bài tập & đề trắc nghiệm chấm điểm tự động",
            "Rèn luyện kỹ năng Casio & mẹo giải nhanh toán 11"
        ],
        image_url: "assets/images/course-10.png"
    },
    {
        id: 2,
        title: "Toán Học Lớp 12 - Luyện Thi THPT & ĐGNL",
        grade: "Toán Lớp 12",
        tag: "grade12",
        badge: "Luyện thi THPT & ĐGNL 9+",
        badge_icon: "fa-fire",
        description: "Hệ thống toàn diện Giải tích 12, Ứng dụng đạo hàm, Khảo sát hàm số, Vectơ và Hình không gian Oxyz, Tích phân và Xác suất. Chinh phục kỳ thi Tốt nghiệp THPT và ĐGNL (HSA/APT).",
        features: [
            "Luyện chuyên sâu cấu trúc đề thi THPT Quốc Gia & HSA/APT",
            "Kho đề thi thử tuyển chọn chuẩn format kèm lời giải chi tiết",
            "Tuyệt kỹ Casio giải nhanh trắc nghiệm 30s tối ưu thời gian"
        ],
        image_url: "assets/images/course-thpt.png"
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
    const sections = document.querySelectorAll('section');
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

    // 4. Render 2 Khóa học nổi bật Lớp 11 & Lớp 12
    renderFeaturedCourses();

    function renderFeaturedCourses() {
        const grid = document.querySelector('.featured-courses-grid');
        if (!grid) return;

        grid.innerHTML = FEATURED_COURSES.map(course => `
            <div class="featured-course-card" onclick="window.location.href='course-detail.html?id=${course.id}'">
                <div class="featured-course-image-wrapper">
                    <span class="featured-course-grade-badge"><i class="fa-solid fa-graduation-cap"></i> ${course.grade}</span>
                    <span class="featured-course-highlight-badge"><i class="fa-solid ${course.badge_icon}"></i> ${course.badge}</span>
                    <img src="${course.image_url}" alt="${course.title}" class="featured-course-img">
                </div>
                <div class="featured-course-body">
                    <h3 class="featured-course-title">${course.title}</h3>
                    <p class="featured-course-desc">${course.description}</p>
                    <ul class="featured-course-features">
                        ${course.features.map(f => `<li class="featured-course-feature-item"><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('')}
                    </ul>
                    <div class="featured-course-footer">
                        <a href="course-detail.html?id=${course.id}" class="btn btn-primary featured-course-btn" onclick="event.stopPropagation();">
                            Vào học ngay <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
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

    // 7. Hiển thị khối Tiếp tục bài học (Resume Learning) cho học viên
    function renderResumeLearning(user) {
        const resumeSection = document.getElementById('resumeLearningSection');
        const resumeCard = document.getElementById('resumeCard');
        if (!resumeSection || !resumeCard) return;

        if (!user) {
            resumeSection.style.display = 'none';
            return;
        }

        const lastStudyStr = localStorage.getItem('toansmart_last_study');
        if (lastStudyStr) {
            try {
                const study = JSON.parse(lastStudyStr);
                let typeBadge = '<i class="fa-solid fa-circle-play" style="color: #0EA5E9;"></i> Video bài giảng';
                if (study.materialType === 'quiz') {
                    typeBadge = '<i class="fa-solid fa-square-poll-horizontal" style="color: #F59E0B;"></i> Đề thi trắc nghiệm';
                } else if (study.materialType === 'pdf') {
                    typeBadge = '<i class="fa-regular fa-file-pdf" style="color: #EF4444;"></i> Tài liệu ôn tập';
                }

                resumeCard.innerHTML = `
                    <div class="resume-info">
                        <span class="resume-tag"><i class="fa-solid fa-clock-rotate-left"></i> Góc học tập • Bài học gần nhất</span>
                        <h3 class="resume-title">${study.lessonTitle || 'Bài học đang học dở'}</h3>
                        <div class="resume-meta">
                            <span><i class="fa-solid fa-graduation-cap"></i> ${study.courseTitle || 'Khóa học của em'}</span>
                            <span>${typeBadge} (${study.materialTitle || 'Học liệu'})</span>
                        </div>
                    </div>
                    <div class="resume-action">
                        <a href="study.html?id=${study.courseId}&lesson_id=${study.lessonId}&material_id=${study.materialId}" class="btn btn-primary" style="padding: 12px 24px; gap: 8px;">
                            <i class="fa-solid fa-play"></i> Tiếp tục học ngay
                        </a>
                    </div>
                `;
                resumeSection.style.display = 'block';
                return;
            } catch (err) {
                console.error("Lỗi đọc dữ liệu toansmart_last_study:", err);
            }
        }

        // Nếu là học sinh mới đăng nhập lần đầu hoặc chưa có lịch sử học
        resumeCard.innerHTML = `
            <div class="resume-info">
                <span class="resume-tag"><i class="fa-solid fa-sparkles"></i> Chào mừng ${user.name}!</span>
                <h3 class="resume-title">Bắt đầu bài học đầu tiên của em ngay hôm nay</h3>
                <div class="resume-meta">
                    <span><i class="fa-solid fa-graduation-cap"></i> Toán Học Lớp 11 - Nền Tảng & Chuyên Sâu</span>
                    <span><i class="fa-solid fa-circle-play" style="color: #0EA5E9;"></i> Bài 1.1: Giá trị lượng giác của góc lượng giác</span>
                </div>
            </div>
            <div class="resume-action">
                <a href="lesson.html?id=1&lesson_id=1101" class="btn btn-primary" style="padding: 12px 24px; gap: 8px;">
                    <i class="fa-solid fa-play"></i> Bắt đầu học ngay
                </a>
            </div>
        `;
        resumeSection.style.display = 'block';
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
            // Đã đăng nhập: Vẽ Dropdown tài khoản và hiển thị khối Resume Learning
            renderResumeLearning(user);
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

            if (user.isAdmin) {
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
            // Chưa đăng nhập: Vẽ nút Đăng nhập và ẩn khối Resume Learning
            renderResumeLearning(null);
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
        
        // Compact About Section
        const aboutTagEl = document.querySelector('.about-compact-content .about-tag');
        const aboutTitleEl = document.querySelector('.about-compact-content h3');
        const aboutDescEl = document.querySelector('.about-compact-desc');
        const aboutImgEl = document.querySelector('.about-compact-avatar');
        
        if (aboutTagEl && content.about_tag) aboutTagEl.textContent = content.about_tag;
        if (aboutTitleEl && content.about_title) aboutTitleEl.textContent = content.about_title;
        if (aboutDescEl && content.about_intro) aboutDescEl.textContent = content.about_intro;
        if (aboutImgEl && content.about_image_url) aboutImgEl.setAttribute('src', content.about_image_url);
        
        // Minimal Footer Section
        const footerBrandDesc = document.querySelector('.footer-minimal-brand p');
        if (footerBrandDesc && content.footer_desc) footerBrandDesc.textContent = content.footer_desc;

        const hotlineLink = document.querySelector('.footer-contact-chips a[href^="tel:"]');
        if (hotlineLink && content.contact_hotline) {
            hotlineLink.setAttribute('href', `tel:${content.contact_hotline.replace(/[^0-9]/g, '')}`);
            hotlineLink.innerHTML = `<i class="fa-solid fa-phone"></i> Hotline: ${content.contact_hotline}`;
        }

        const emailLink = document.querySelector('.footer-contact-chips a[href^="mailto:"]');
        if (emailLink && content.contact_email) {
            emailLink.setAttribute('href', `mailto:${content.contact_email}`);
            emailLink.innerHTML = `<i class="fa-solid fa-envelope"></i> ${content.contact_email}`;
        }

        const fbLink = document.querySelector('.footer-contact-chips a[href*="facebook"]');
        if (fbLink && content.footer_fb_link) fbLink.setAttribute('href', content.footer_fb_link);
    }

    // Khởi động tính năng sửa cho admin
    function initHomepageAdminEditing() {
        const aboutCard = document.querySelector('.about-compact-card');
        const footerBrand = document.querySelector('.footer-minimal-brand');
        
        // Tránh tạo trùng lặp nút nếu hàm chạy nhiều lần
        if (document.querySelector('.homepage-section-edit-btn')) return;
        
        // 2. Thêm nút sửa vào phần About
        if (aboutCard) {
            const editBtn = document.createElement('button');
            editBtn.className = 'homepage-section-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa phần Giới thiệu';
            editBtn.style.top = '16px';
            editBtn.style.right = '16px';
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
            aboutCard.appendChild(editBtn);
        }
        
        // 3. Thêm nút sửa vào phần Footer
        if (footerBrand) {
            const editBtn = document.createElement('button');
            editBtn.className = 'homepage-section-edit-btn';
            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa thông tin Footer';
            editBtn.style.top = '0';
            editBtn.style.right = '0';
            editBtn.addEventListener('click', () => {
                document.getElementById('editContactHotline').value = homepageContent.contact_hotline || '';
                document.getElementById('editContactEmail').value = homepageContent.contact_email || '';
                document.getElementById('editFooterDesc').value = homepageContent.footer_desc || '';
                document.getElementById('editFooterFbLink').value = homepageContent.footer_fb_link || '';
                document.getElementById('editFooterYtLink').value = homepageContent.footer_yt_link || '';
                document.getElementById('editFooterTtLink').value = homepageContent.footer_tt_link || '';
                document.getElementById('editContactModal').classList.add('active');
            });
            footerBrand.style.position = 'relative';
            footerBrand.appendChild(editBtn);
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
