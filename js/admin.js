// Toán Smart Website - Admin Dashboard Controller

// Mock Data để hiển thị tại trang Admin khi chạy offline (Chưa cấu hình Supabase)
let mockCourses = [
    { id: 1, title: "Luyện Thi Vào Lớp 10 Toán Mục Tiêu 9+", tag: "grade10", price: 1500000, duration: "6 tháng (72 buổi)", image_url: "assets/images/course-10.png" },
    { id: 2, title: "Luyện Thi Tốt Nghiệp THPT Chuyên Sâu", tag: "thpt", price: 2000000, duration: "8 tháng (96 buổi)", image_url: "assets/images/course-thpt.png" },
    { id: 3, title: "Luyện Tư Duy Định Lượng HSA/APT (ĐGNL)", tag: "dgnl", price: 1800000, duration: "4 tháng (48 buổi)", image_url: "assets/images/course-dgnl.png" }
];

let mockChapters = [
    { id: 101, course_id: 1, title: "Chương 1: Đại số chuyên sâu & Hệ thức Vi-ét ôn thi vào 10", order_index: 1 },
    { id: 102, course_id: 1, title: "Chương 2: Hình học phẳng & Tứ giác nội tiếp đường tròn", order_index: 2 },
    { id: 103, course_id: 1, title: "Chương 3: Luyện đề thi thử & Chiến thuật tối ưu điểm số", order_index: 3 },
    { id: 201, course_id: 2, title: "Chương 1: Khảo sát hàm số & Giải tích 12 chuyên sâu", order_index: 1 },
    { id: 202, course_id: 2, title: "Chương 2: Tuyệt kỹ Casio & Phương pháp giải nhanh trắc nghiệm 30s", order_index: 2 },
    { id: 203, course_id: 2, title: "Chương 3: Hình học không gian & Hình học tọa độ Oxyz", order_index: 3 },
    { id: 301, course_id: 3, title: "Chương 1: Logic toán học & Kỹ năng phân tích bảng số liệu thực tế", order_index: 1 },
    { id: 302, course_id: 3, title: "Chương 2: Tổng ôn toán học phổ thông bám sát cấu trúc đề HSA/APT", order_index: 2 }
];

let mockLessons = [
    { id: 1001, chapter_id: 101, title: "Bài 1: Phương trình bậc hai & Hệ thức Vi-ét cơ bản", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "25:12", is_preview: true, order_index: 1 },
    { id: 1002, chapter_id: 101, title: "Bài 2: Phương pháp rút gọn biểu thức chứa căn thức bậc hai", type: "pdf", url: "assets/docs/de-thi-thu-toan-vao-10.pdf", duration: "", is_preview: true, order_index: 2 },
    { id: 1003, chapter_id: 101, title: "Bài 3: Giải toán bằng cách lập phương trình, hệ phương trình", type: "video", url: "", duration: "", is_preview: false, order_index: 3 },
    { id: 1005, chapter_id: 102, title: "Bài 5: Định nghĩa & 4 phương pháp chứng minh Tứ giác nội tiếp", type: "video", url: "", duration: "", is_preview: false, order_index: 1 },
    { id: 2001, chapter_id: 201, title: "Bài 1: Sự đồng biến, nghịch biến của hàm số chứa tham số m", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "28:45", is_preview: true, order_index: 1 },
    { id: 2002, chapter_id: 201, title: "Bài 2: Phương pháp cực trị hàm số liên kết đồ thị f'(x)", type: "pdf", url: "assets/docs/so-tay-toan-12.pdf", duration: "", is_preview: true, order_index: 2 },
    { id: 3001, chapter_id: 301, title: "Bài 1: Phương pháp đọc đề, phân tích bảng biểu thống kê phức tạp", type: "video", url: "https://www.youtube.com/embed/zH0QG_uPez8", duration: "32:10", is_preview: true, order_index: 1 }
];

// Biến lưu trữ dữ liệu hiện tại
let dbCourses = [];
let dbChapters = [];
let dbLessons = [];

// Trạng thái Form hiện tại
let currentCrudType = ''; // 'course', 'chapter', 'lesson'
let currentEditId = null; // null nếu là thêm mới

document.addEventListener('DOMContentLoaded', () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);

    // Elements
    const loginScreen = document.getElementById('loginScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmail = document.getElementById('userEmail');

    // 1. AUTHENTICATION LOGIC
    checkAuthState();

    async function checkAuthState() {
        if (isOnline) {
            try {
                const { data: { session } } = await supabaseClient.auth.getSession();
                if (session) {
                    showDashboard(session.user.email);
                } else {
                    showLogin();
                }
            } catch (err) {
                console.error("Lỗi xác thực Supabase:", err);
                showLogin();
            }
        } else {
            // Chế độ demo offline
            const demoUser = localStorage.getItem('demo_admin_user');
            if (demoUser) {
                showDashboard(demoUser);
            } else {
                showLogin();
            }
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            loginError.style.display = 'none';

            if (isOnline) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    if (error) throw error;
                    showDashboard(data.user.email);
                } catch (err) {
                    loginError.textContent = "Lỗi: " + (err.message || "Không thể đăng nhập.");
                    loginError.style.display = 'block';
                }
            } else {
                // Đăng nhập demo offline
                if (email === 'admin@toansmart.edu.vn' && password === 'admin') {
                    localStorage.setItem('demo_admin_user', email);
                    showDashboard(email);
                } else {
                    loginError.textContent = "Sai email hoặc mật khẩu (Thử email: admin@toansmart.edu.vn, mật khẩu: admin).";
                    loginError.style.display = 'block';
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (isOnline) {
                await supabaseClient.auth.signOut();
            } else {
                localStorage.removeItem('demo_admin_user');
            }
            showLogin();
        });
    }

    function showLogin() {
        loginScreen.style.display = 'flex';
        dashboardScreen.style.display = 'none';
    }

    function showDashboard(email) {
        loginScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        userEmail.textContent = email;
        loadAllData();

        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
            if (tabBtn) {
                setTimeout(() => tabBtn.click(), 100);
            }
        }
    }

    // 2. LOAD DATA
    async function loadAllData() {
        if (isOnline) {
            try {
                // Tải khóa học
                let { data: courses, error: err1 } = await supabaseClient.from('courses').select('*').order('id');
                if (err1) throw err1;
                dbCourses = courses;

                // Tải chương
                let { data: chapters, error: err2 } = await supabaseClient.from('chapters').select('*').order('order_index');
                if (err2) throw err2;
                dbChapters = chapters;

                // Tải bài giảng
                let { data: lessons, error: err3 } = await supabaseClient.from('lessons').select('*').order('order_index');
                if (err3) throw err3;
                dbLessons = lessons;

            } catch (err) {
                console.error("Lỗi khi tải dữ liệu từ Supabase. Chuyển sang dữ liệu mẫu:", err);
                useMockData();
            }
        } else {
            useMockData();
        }

        renderTables();
    }

    function useMockData() {
        // Tải dữ liệu từ LocalStorage nếu có đổi trước đó, nếu không lấy từ mock mẫu
        dbCourses = JSON.parse(localStorage.getItem('db_courses')) || mockCourses;
        dbChapters = JSON.parse(localStorage.getItem('db_chapters')) || mockChapters;
        dbLessons = JSON.parse(localStorage.getItem('db_lessons')) || mockLessons;
    }

    function saveLocalMockData() {
        if (!isOnline) {
            localStorage.setItem('db_courses', JSON.stringify(dbCourses));
            localStorage.setItem('db_chapters', JSON.stringify(dbChapters));
            localStorage.setItem('db_lessons', JSON.stringify(dbLessons));
        }
    }

    // 3. TAB CONTROLLER
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    let qbInitialized = false;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tab = button.getAttribute('data-tab');
            tabPanes.forEach(pane => {
                pane.style.display = pane.getAttribute('id') === `${tab}Pane` ? 'block' : 'none';
            });

            if (tab === 'questions' && !qbInitialized) {
                if (typeof initQuestionBank === 'function') {
                    initQuestionBank();
                    qbInitialized = true;
                }
            }
        });
    });

    // 4. RENDER TABLES
    function renderTables() {
        renderCoursesTable();
        renderChaptersTable();
        renderLessonsTable();
    }

    function renderCoursesTable() {
        const tbody = document.getElementById('coursesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        dbCourses.forEach(c => {
            const tr = document.createElement('tr');
            const priceFormatted = new Intl.NumberFormat('vi-VN').format(c.price) + ' đ';
            tr.innerHTML = `
                <td>${c.id}</td>
                <td style="font-weight: 600;">${c.title}</td>
                <td><span style="background: rgba(99,102,241,0.1); color: var(--accent-color); padding: 4px 8px; border-radius: 6px; font-size: 0.8rem;">${c.tag}</span></td>
                <td>${priceFormatted}</td>
                <td>${c.duration}</td>
                <td class="actions-cell">
                    <button class="action-icon-btn edit-item-btn" data-type="course" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn delete-btn delete-item-btn" data-type="course" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        bindActionButtons();
    }

    function renderChaptersTable() {
        const tbody = document.getElementById('chaptersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        dbChapters.forEach(c => {
            const course = dbCourses.find(item => item.id == c.course_id);
            const courseTitle = course ? course.title : `Khóa học #${c.course_id}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${courseTitle}</td>
                <td style="font-weight: 600;">${c.title}</td>
                <td>${c.order_index}</td>
                <td class="actions-cell">
                    <button class="action-icon-btn edit-item-btn" data-type="chapter" data-id="${c.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn delete-btn delete-item-btn" data-type="chapter" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        bindActionButtons();
    }

    function renderLessonsTable() {
        const tbody = document.getElementById('lessonsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        dbLessons.forEach(l => {
            const chapter = dbChapters.find(item => item.id == l.chapter_id);
            const chapterTitle = chapter ? chapter.title : `Chương #${l.chapter_id}`;

            const typeLabel = l.type === 'video' 
                ? '<i class="fa-solid fa-video" style="color: #3B82F6;"></i> Video' 
                : '<i class="fa-regular fa-file-pdf" style="color: #EF4444;"></i> PDF';
                
            const previewLabel = l.is_preview 
                ? '<span style="color: #10B981; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Học thử</span>' 
                : '<span style="color: #94A3B8;"><i class="fa-solid fa-lock"></i> Đóng</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${l.id}</td>
                <td style="font-size: 0.85rem; color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${chapterTitle}</td>
                <td style="font-weight: 600;">${l.title}</td>
                <td>${typeLabel}</td>
                <td>${previewLabel}</td>
                <td class="actions-cell">
                    <button class="action-icon-btn edit-item-btn" data-type="lesson" data-id="${l.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn delete-btn delete-item-btn" data-type="lesson" data-id="${l.id}"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        bindActionButtons();
    }

    // 5. CRUD MODAL LOGIC
    const crudModal = document.getElementById('crudModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalTitle = document.getElementById('modalTitle');
    const formFieldsContainer = document.getElementById('formFieldsContainer');
    const crudForm = document.getElementById('crudForm');
    const btnAdds = document.querySelectorAll('.btn-add');

    // Mở modal Thêm mới
    btnAdds.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            openCrudModal(type, null);
        });
    });

    function openCrudModal(type, id) {
        currentCrudType = type;
        currentEditId = id;
        
        modalTitle.textContent = (id === null ? "Thêm mới " : "Chỉnh sửa ") + getTypeName(type);
        renderFormFields(type, id);
        
        crudModal.classList.add('active');
    }

    function closeCrudModal() {
        crudModal.classList.remove('active');
        crudForm.reset();
        currentCrudType = '';
        currentEditId = null;
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCrudModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeCrudModal);

    function getTypeName(type) {
        if (type === 'course') return 'Khóa học';
        if (type === 'chapter') return 'Chương học';
        if (type === 'lesson') return 'Bài giảng';
        return '';
    }

    // Render form inputs dynamically
    function renderFormFields(type, id) {
        formFieldsContainer.innerHTML = '';
        
        if (type === 'course') {
            const course = id !== null ? dbCourses.find(item => item.id == id) : null;
            formFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Tên khóa học</label>
                    <input type="text" id="course_title" class="form-control" value="${course ? course.title : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phân loại nhãn (Tag code)</label>
                    <select id="course_tag" class="form-control" required>
                        <option value="grade10" ${course && course.tag === 'grade10' ? 'selected' : ''}>grade10 (Thi vào 10)</option>
                        <option value="thpt" ${course && course.tag === 'thpt' ? 'selected' : ''}>thpt (Thi THPT)</option>
                        <option value="dgnl" ${course && course.tag === 'dgnl' ? 'selected' : ''}>dgnl (Đánh giá năng lực)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Học phí (VND)</label>
                    <input type="number" id="course_price" class="form-control" value="${course ? course.price : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Thời lượng học (Hiển thị)</label>
                    <input type="text" id="course_duration" class="form-control" placeholder="Ví dụ: 6 tháng (72 buổi)" value="${course ? course.duration : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Đường dẫn ảnh bìa khóa học</label>
                    <input type="text" id="course_image" class="form-control" value="${course ? course.image_url : 'assets/images/course-10.png'}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Mô tả khóa học</label>
                    <textarea id="course_desc" class="form-control" style="height: 80px;" required>${course ? course.description : ''}</textarea>
                </div>
            `;
        } 
        else if (type === 'chapter') {
            const chapter = id !== null ? dbChapters.find(item => item.id == id) : null;
            
            // Build Course options
            let courseOptions = '';
            dbCourses.forEach(c => {
                courseOptions += `<option value="${c.id}" ${chapter && chapter.course_id == c.id ? 'selected' : ''}>${c.title}</option>`;
            });

            formFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Khóa học chứa chương này</label>
                    <select id="chapter_course_id" class="form-control" required>
                        ${courseOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Tên chương học</label>
                    <input type="text" id="chapter_title" class="form-control" value="${chapter ? chapter.title : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                    <input type="number" id="chapter_order" class="form-control" value="${chapter ? chapter.order_index : 1}" required>
                </div>
            `;
        }
        else if (type === 'lesson') {
            const lesson = id !== null ? dbLessons.find(item => item.id == id) : null;
            
            // Build Chapter options
            let chapterOptions = '';
            dbChapters.forEach(c => {
                const course = dbCourses.find(co => co.id == c.course_id);
                const courseLabel = course ? `[${course.tag.toUpperCase()}] ` : '';
                chapterOptions += `<option value="${c.id}" ${lesson && lesson.chapter_id == c.id ? 'selected' : ''}>${courseLabel}${c.title}</option>`;
            });

            formFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Chương học chứa bài giảng này</label>
                    <select id="lesson_chapter_id" class="form-control" required>
                        ${chapterOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Tên bài giảng / Tài liệu</label>
                    <input type="text" id="lesson_title" class="form-control" value="${lesson ? lesson.title : ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Loại bài học</label>
                    <select id="lesson_type" class="form-control" required>
                        <option value="video" ${lesson && lesson.type === 'video' ? 'selected' : ''}>Video bài giảng</option>
                        <option value="pdf" ${lesson && lesson.type === 'pdf' ? 'selected' : ''}>File tài liệu PDF</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">URL học thử (Chỉ điền nếu là học thử miễn phí)</label>
                    <input type="text" id="lesson_url" class="form-control" placeholder="Ví dụ: Link nhúng Youtube hoặc file PDF" value="${lesson ? lesson.url : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Thời lượng (Chỉ điền nếu là video, ví dụ: 25:12)</label>
                    <input type="text" id="lesson_duration" class="form-control" value="${lesson ? lesson.duration : ''}">
                </div>
                <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                    <input type="checkbox" id="lesson_preview" style="width: 18px; height: 18px; cursor: pointer;" ${lesson && lesson.is_preview ? 'checked' : ''}>
                    <label for="lesson_preview" style="cursor: pointer; font-weight: 500; font-size: 0.9rem;">Cho học thử miễn phí (Không cần tài khoản)</label>
                </div>
                <div class="form-group" style="margin-top: 16px;">
                    <label class="form-label">Thứ tự hiển thị (Order Index)</label>
                    <input type="number" id="lesson_order" class="form-control" value="${lesson ? lesson.order_index : 1}" required>
                </div>
            `;
        }
    }

    // 6. ACTION BINDING (EDIT / DELETE)
    function bindActionButtons() {
        // Nút Sửa
        const editBtns = document.querySelectorAll('.edit-item-btn');
        editBtns.forEach(btn => {
            // Thay thế listener cũ bằng nhân bản nút để không bị lặp event
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const type = newBtn.getAttribute('data-type');
                const id = parseInt(newBtn.getAttribute('data-id'));
                openCrudModal(type, id);
            });
        });

        // Nút Xóa
        const deleteBtns = document.querySelectorAll('.delete-item-btn');
        deleteBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                const type = newBtn.getAttribute('data-type');
                const id = parseInt(newBtn.getAttribute('data-id'));
                deleteItem(type, id);
            });
        });
    }

    // 7. SAVE CRUD FORM SUBMIT
    if (crudForm) {
        crudForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (currentCrudType === 'course') {
                const title = document.getElementById('course_title').value.trim();
                const tag = document.getElementById('course_tag').value;
                const price = parseInt(document.getElementById('course_price').value);
                const duration = document.getElementById('course_duration').value.trim();
                const image_url = document.getElementById('course_image').value.trim();
                const description = document.getElementById('course_desc').value.trim();

                const courseData = { title, tag, price, duration, image_url, description };

                if (currentEditId === null) {
                    // THÊM MỚI
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('courses').insert([courseData]);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi thêm khóa học lên Supabase: " + err.message);
                            return;
                        }
                    } else {
                        // Offline
                        const newId = dbCourses.length > 0 ? Math.max(...dbCourses.map(o => o.id)) + 1 : 1;
                        dbCourses.push({ id: newId, ...courseData });
                        saveLocalMockData();
                    }
                } else {
                    // CHỈNH SỬA
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('courses').update(courseData).eq('id', currentEditId);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi sửa khóa học trên Supabase: " + err.message);
                            return;
                        }
                    } else {
                        // Offline
                        const idx = dbCourses.findIndex(item => item.id == currentEditId);
                        if (idx !== -1) {
                            dbCourses[idx] = { id: currentEditId, ...courseData };
                            saveLocalMockData();
                        }
                    }
                }
            }
            else if (currentCrudType === 'chapter') {
                const course_id = parseInt(document.getElementById('chapter_course_id').value);
                const title = document.getElementById('chapter_title').value.trim();
                const order_index = parseInt(document.getElementById('chapter_order').value);

                const chapterData = { course_id, title, order_index };

                if (currentEditId === null) {
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('chapters').insert([chapterData]);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi thêm chương: " + err.message);
                            return;
                        }
                    } else {
                        const newId = dbChapters.length > 0 ? Math.max(...dbChapters.map(o => o.id)) + 1 : 101;
                        dbChapters.push({ id: newId, ...chapterData });
                        saveLocalMockData();
                    }
                } else {
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('chapters').update(chapterData).eq('id', currentEditId);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi sửa chương: " + err.message);
                            return;
                        }
                    } else {
                        const idx = dbChapters.findIndex(item => item.id == currentEditId);
                        if (idx !== -1) {
                            dbChapters[idx] = { id: currentEditId, ...chapterData };
                            saveLocalMockData();
                        }
                    }
                }
            }
            else if (currentCrudType === 'lesson') {
                const chapter_id = parseInt(document.getElementById('lesson_chapter_id').value);
                const title = document.getElementById('lesson_title').value.trim();
                const type = document.getElementById('lesson_type').value;
                const url = document.getElementById('lesson_url').value.trim();
                const duration = document.getElementById('lesson_duration').value.trim();
                const is_preview = document.getElementById('lesson_preview').checked;
                const order_index = parseInt(document.getElementById('lesson_order').value);

                const lessonData = { chapter_id, title, type, url, duration, is_preview, order_index };

                if (currentEditId === null) {
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('lessons').insert([lessonData]);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi thêm bài học: " + err.message);
                            return;
                        }
                    } else {
                        const newId = dbLessons.length > 0 ? Math.max(...dbLessons.map(o => o.id)) + 1 : 1001;
                        dbLessons.push({ id: newId, ...lessonData });
                        saveLocalMockData();
                    }
                } else {
                    if (isOnline) {
                        try {
                            const { error } = await supabaseClient.from('lessons').update(lessonData).eq('id', currentEditId);
                            if (error) throw error;
                        } catch (err) {
                            alert("Lỗi khi sửa bài học: " + err.message);
                            return;
                        }
                    } else {
                        const idx = dbLessons.findIndex(item => item.id == currentEditId);
                        if (idx !== -1) {
                            dbLessons[idx] = { id: currentEditId, ...lessonData };
                            saveLocalMockData();
                        }
                    }
                }
            }

            closeCrudModal();
            loadAllData(); // Reload and redraw table
        });
    }

    // 8. DELETE ITEM LOGIC
    async function deleteItem(type, id) {
        if (!confirm(`Thầy chắc chắn muốn xóa ${getTypeName(type)} này chứ? Hành động này không thể hoàn tác.`)) {
            return;
        }

        if (type === 'course') {
            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('courses').delete().eq('id', id);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi khi xóa khóa học khỏi database: " + err.message);
                    return;
                }
            } else {
                dbCourses = dbCourses.filter(item => item.id != id);
                saveLocalMockData();
            }
        }
        else if (type === 'chapter') {
            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('chapters').delete().eq('id', id);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi khi xóa chương: " + err.message);
                    return;
                }
            } else {
                dbChapters = dbChapters.filter(item => item.id != id);
                saveLocalMockData();
            }
        }
        else if (type === 'lesson') {
            if (isOnline) {
                try {
                    const { error } = await supabaseClient.from('lessons').delete().eq('id', id);
                    if (error) throw error;
                } catch (err) {
                    alert("Lỗi khi xóa bài học: " + err.message);
                    return;
                }
            } else {
                dbLessons = dbLessons.filter(item => item.id != id);
                saveLocalMockData();
            }
        }

        loadAllData();
    }
});

// =============================================
// NGÂN HÀNG CÂU HỎI (QUESTION BANK)
// =============================================

let allQBQuestions = [];
let editingQuestionId = null;
let cachedCourses = [];
let cachedChapters = [];
let cachedLessons = [];
let cachedMaterials = [];

// Initialize Question Bank tab
async function initQuestionBank() {
    if (!supabaseClient) {
        document.getElementById('questionsTableBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">Chưa kết nối Supabase. Vui lòng cấu hình kết nối trong config.js</td></tr>';
        return;
    }

    // Cache dropdown data
    const [coursesRes, chaptersRes, lessonsRes, materialsRes] = await Promise.all([
        supabaseClient.from('courses').select('id, title').order('id'),
        supabaseClient.from('chapters').select('id, course_id, title').order('order_index'),
        supabaseClient.from('lessons').select('id, chapter_id, title').order('order_index'),
        supabaseClient.from('materials').select('id, lesson_id, title, type').eq('type', 'quiz').order('order_index')
    ]);

    cachedCourses = coursesRes.data || [];
    cachedChapters = chaptersRes.data || [];
    cachedLessons = lessonsRes.data || [];
    cachedMaterials = materialsRes.data || [];

    // Đảm bảo mỗi bài giảng đều có ít nhất 1 học liệu trắc nghiệm "Quiz Test" (giống như study.js)
    cachedLessons.forEach(l => {
        const hasQuiz = cachedMaterials.some(m => m.lesson_id == l.id && m.type === 'quiz');
        if (!hasQuiz) {
            cachedMaterials.push({
                id: (l.id * 10) + 99,
                lesson_id: l.id,
                title: "Quiz Test",
                type: "quiz"
            });
        }
    });

    // Populate filter dropdowns
    populateFilterDropdowns();
    
    // Load questions
    await loadQuestions();

    // Bind filter events
    document.getElementById('qbFilterCourse').addEventListener('change', function() {
        updateChapterFilter(this.value);
        loadQuestions();
    });
    document.getElementById('qbFilterChapter').addEventListener('change', function() {
        updateLessonFilter(this.value);
        loadQuestions();
    });
    document.getElementById('qbFilterLesson').addEventListener('change', function() {
        updateMaterialFilter(this.value);
        loadQuestions();
    });
    document.getElementById('qbFilterMaterial').addEventListener('change', () => loadQuestions());
    document.getElementById('qbFilterDifficulty').addEventListener('change', () => loadQuestions());
    
    // Debounced search
    let searchTimeout;
    document.getElementById('qbSearchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadQuestions(), 300);
    });

    // Add question button
    document.getElementById('addQuestionBtn').addEventListener('click', () => openQuestionModal());
}

function populateFilterDropdowns() {
    const courseSelect = document.getElementById('qbFilterCourse');
    courseSelect.innerHTML = '<option value="">Tất cả khóa học</option>';
    cachedCourses.forEach(c => {
        courseSelect.innerHTML += `<option value="${c.id}">${c.title}</option>`;
    });
}

function updateChapterFilter(courseId) {
    const chapterSelect = document.getElementById('qbFilterChapter');
    chapterSelect.innerHTML = '<option value="">Tất cả chương</option>';
    const filtered = courseId ? cachedChapters.filter(ch => ch.course_id == courseId) : cachedChapters;
    filtered.forEach(ch => {
        chapterSelect.innerHTML += `<option value="${ch.id}">${ch.title}</option>`;
    });
    // Reset lesson filter
    document.getElementById('qbFilterLesson').innerHTML = '<option value="">Tất cả bài học</option>';
}

function updateLessonFilter(chapterId) {
    const lessonSelect = document.getElementById('qbFilterLesson');
    lessonSelect.innerHTML = '<option value="">Tất cả bài học</option>';
    const filtered = chapterId ? cachedLessons.filter(l => l.chapter_id == chapterId) : cachedLessons;
    filtered.forEach(l => {
        lessonSelect.innerHTML += `<option value="${l.id}">${l.title}</option>`;
    });
    // Reset material filter
    const materialSelect = document.getElementById('qbFilterMaterial');
    if (materialSelect) materialSelect.innerHTML = '<option value="">Tất cả học liệu</option>';
}

function updateMaterialFilter(lessonId) {
    const materialSelect = document.getElementById('qbFilterMaterial');
    if (!materialSelect) return;
    materialSelect.innerHTML = '<option value="">Tất cả học liệu</option>';
    const filtered = lessonId ? cachedMaterials.filter(m => m.lesson_id == lessonId) : cachedMaterials;
    filtered.forEach(m => {
        materialSelect.innerHTML += `<option value="${m.id}">${m.title}</option>`;
    });
}

async function loadQuestions() {
    if (!supabaseClient) return;

    const courseId = document.getElementById('qbFilterCourse').value;
    const chapterId = document.getElementById('qbFilterChapter').value;
    const lessonId = document.getElementById('qbFilterLesson').value;
    const materialId = document.getElementById('qbFilterMaterial') ? document.getElementById('qbFilterMaterial').value : '';
    const difficulty = document.getElementById('qbFilterDifficulty').value;
    const searchText = document.getElementById('qbSearchInput').value.trim().toLowerCase();

    let query = supabaseClient.from('questions').select('*').order('id', { ascending: false });

    if (courseId) query = query.eq('course_id', courseId);
    if (chapterId) query = query.eq('chapter_id', chapterId);
    if (lessonId) query = query.eq('lesson_id', lessonId);
    if (materialId) query = query.eq('material_id', materialId);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (searchText) query = query.ilike('question_text', `%${searchText}%`);

    const { data, error } = await query;

    if (error) {
        console.error('Lỗi tải câu hỏi:', error);
        return;
    }

    allQBQuestions = data || [];
    renderQuestionsTable();
}

function getDiffBadgeHTML(difficulty) {
    const map = {
        'NB': '<span class="diff-badge diff-nb">NB</span>',
        'TH': '<span class="diff-badge diff-th">TH</span>',
        'VD': '<span class="diff-badge diff-vd">VD</span>',
        'VDC': '<span class="diff-badge diff-vdc">VDC</span>'
    };
    return map[difficulty] || '<span class="diff-badge">--</span>';
}

function getClassificationText(q) {
    const course = cachedCourses.find(c => c.id === q.course_id);
    const chapter = cachedChapters.find(ch => ch.id === q.chapter_id);
    const parts = [];
    if (course) parts.push(course.title.substring(0, 25));
    if (chapter) parts.push(chapter.title.substring(0, 30));
    return parts.join(' › ') || '<span style="color: var(--text-secondary);">Chưa phân loại</span>';
}

function stripKaTeX(text) {
    if (!text) return '';
    return text.replace(/\$[^$]+\$/g, '[công thức]').replace(/<[^>]+>/g, '').substring(0, 80);
}

async function renderQuestionsTable() {
    const tbody = document.getElementById('questionsTableBody');
    const countEl = document.getElementById('qbQuestionCount');
    countEl.textContent = `(${allQBQuestions.length} câu hỏi)`;

    if (allQBQuestions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</td></tr>';
        return;
    }

    // Fetch material_questions usage for all questions
    let usageMap = {};
    try {
        const { data: mqData } = await supabaseClient.from('material_questions').select('question_id, material_id');
        if (mqData) {
            mqData.forEach(mq => {
                if (!usageMap[mq.question_id]) usageMap[mq.question_id] = [];
                usageMap[mq.question_id].push(mq.material_id);
            });
        }
    } catch(e) {}

    tbody.innerHTML = allQBQuestions.map(q => {
        const preview = stripKaTeX(q.question_text);
        const usage = usageMap[q.id] || [];
        const usageCount = usage.length;
        
        let tooltipText = '';
        if (usageCount > 0) {
            tooltipText = `<div style="font-weight: 700; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 4px; font-size: 0.8rem; color: #93C5FD;">Đang được sử dụng trong:</div>`;
            tooltipText += usage.map(mId => {
                const mat = cachedMaterials.find(m => m.id == mId);
                const title = mat ? mat.title : `Học liệu #${mId}`;
                
                // Tìm course_id để tạo hyperlink đúng cho học sinh học thử
                let courseId = 1;
                if (mat) {
                    const lesson = cachedLessons.find(l => l.id == mat.lesson_id);
                    const chapter = lesson ? cachedChapters.find(ch => ch.id == lesson.chapter_id) : null;
                    if (chapter) courseId = chapter.course_id;
                }
                
                const url = `study.html?id=${courseId}&lesson_id=${mat ? mat.lesson_id : ''}&material_id=${mId}`;
                return `<a href="${url}" target="_blank" style="color: #60A5FA; text-decoration: underline; display: block; margin-bottom: 6px; font-size: 0.78rem; font-weight: 500;"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; margin-right: 4px;"></i>${title}</a>`;
            }).join('');
        } else {
            tooltipText = 'Chưa gắn vào học liệu nào';
        }

        return `<tr>
            <td style="font-weight: 600; color: var(--text-secondary);">#${q.id}</td>
            <td>
                <div class="qb-question-preview">${preview}...</div>
                <div style="margin-top: 4px;">
                    ${getDiffBadgeHTML(q.difficulty)}
                    <span class="qb-info-icon">
                        <i class="fa-solid fa-info"></i>
                        <span class="qb-tooltip">${tooltipText}</span>
                    </span>
                    ${usageCount > 0 ? `<span style="font-size: 0.75rem; color: #10B981; margin-left: 4px;"><i class="fa-solid fa-link"></i> ${usageCount}</span>` : ''}
                </div>
            </td>
            <td style="font-size: 0.82rem; color: var(--text-secondary);">${getClassificationText(q)}</td>
            <td>${getDiffBadgeHTML(q.difficulty)}</td>
            <td>
                <div class="actions-cell">
                    <button class="action-icon-btn" onclick="openQuestionModal(${q.id})" title="Sửa"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn delete-btn" onclick="deleteQuestion(${q.id})" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Open modal for add/edit question
async function openQuestionModal(questionId = null) {
    editingQuestionId = questionId;
    const modal = document.getElementById('questionModal');
    const title = document.getElementById('questionModalTitle');

    // Populate course dropdown in form
    const qfCourse = document.getElementById('qfCourse');
    qfCourse.innerHTML = '<option value="">-- Chọn khóa học --</option>';
    cachedCourses.forEach(c => {
        qfCourse.innerHTML += `<option value="${c.id}">${c.title}</option>`;
    });

    if (questionId) {
        title.textContent = 'Chỉnh sửa câu hỏi';
        // Load question data
        const q = allQBQuestions.find(q => q.id === questionId);
        if (q) {
            // Set course, then trigger cascade
            if (q.course_id) {
                qfCourse.value = q.course_id;
                await onQfCourseChange();
                if (q.chapter_id) {
                    document.getElementById('qfChapter').value = q.chapter_id;
                    await onQfChapterChange();
                    if (q.lesson_id) {
                        document.getElementById('qfLesson').value = q.lesson_id;
                        await onQfLessonChange();
                        if (q.material_id && document.getElementById('qfMaterial')) {
                            document.getElementById('qfMaterial').value = q.material_id;
                        }
                    }
                }
            }

            // Set difficulty
            const diffRadio = document.querySelector(`input[name="qfDifficulty"][value="${q.difficulty}"]`);
            if (diffRadio) diffRadio.checked = true;

            // Set question text
            document.getElementById('qfQuestionText').value = q.question_text || '';

            // Set options
            const options = q.options || [];
            document.getElementById('qfOptionA').value = options[0] || '';
            document.getElementById('qfOptionB').value = options[1] || '';
            document.getElementById('qfOptionC').value = options[2] || '';
            document.getElementById('qfOptionD').value = options[3] || '';

            // Set correct option
            const correctRadio = document.querySelector(`input[name="qfCorrect"][value="${q.correct_option}"]`);
            if (correctRadio) correctRadio.checked = true;

            // Set explanation
            document.getElementById('qfExplanation').value = q.explanation || '';
        }
    } else {
        title.textContent = 'Thêm câu hỏi mới';
        document.getElementById('questionForm').reset();
        document.getElementById('qfChapter').innerHTML = '<option value="">-- Chọn chương --</option>';
        document.getElementById('qfLesson').innerHTML = '<option value="">-- Chọn bài học --</option>';
        if (document.getElementById('qfMaterial')) {
            document.getElementById('qfMaterial').innerHTML = '<option value="">-- Chọn học liệu --</option>';
        }
    }

    updateQuestionPreview();
    modal.classList.add('active');
}

function closeQuestionModal() {
    document.getElementById('questionModal').classList.remove('active');
    editingQuestionId = null;
}

// Cascade dropdown: Course -> Chapter
async function onQfCourseChange() {
    const courseId = document.getElementById('qfCourse').value;
    const chapterSelect = document.getElementById('qfChapter');
    chapterSelect.innerHTML = '<option value="">-- Chọn chương --</option>';
    document.getElementById('qfLesson').innerHTML = '<option value="">-- Chọn bài học --</option>';

    if (courseId) {
        const filtered = cachedChapters.filter(ch => ch.course_id == courseId);
        filtered.forEach(ch => {
            chapterSelect.innerHTML += `<option value="${ch.id}">${ch.title}</option>`;
        });
    }
}

// Cascade dropdown: Chapter -> Lesson
async function onQfChapterChange() {
    const chapterId = document.getElementById('qfChapter').value;
    const lessonSelect = document.getElementById('qfLesson');
    lessonSelect.innerHTML = '<option value="">-- Chọn bài học --</option>';
    const materialSelect = document.getElementById('qfMaterial');
    if (materialSelect) materialSelect.innerHTML = '<option value="">-- Chọn học liệu --</option>';

    if (chapterId) {
        const filtered = cachedLessons.filter(l => l.chapter_id == chapterId);
        filtered.forEach(l => {
            lessonSelect.innerHTML += `<option value="${l.id}">${l.title}</option>`;
        });
    }
}

// Cascade dropdown: Lesson -> Material
async function onQfLessonChange() {
    const lessonId = document.getElementById('qfLesson').value;
    const materialSelect = document.getElementById('qfMaterial');
    if (!materialSelect) return;
    materialSelect.innerHTML = '<option value="">-- Chọn học liệu --</option>';

    if (lessonId) {
        const filtered = cachedMaterials.filter(m => m.lesson_id == lessonId);
        filtered.forEach(m => {
            materialSelect.innerHTML += `<option value="${m.id}">${m.title}</option>`;
        });
    }
}

// Save question (create or update)
async function saveQuestion(event) {
    event.preventDefault();
    if (!supabaseClient) return alert('Chưa kết nối Supabase!');

    const courseId = document.getElementById('qfCourse').value || null;
    const chapterId = document.getElementById('qfChapter').value || null;
    const lessonId = document.getElementById('qfLesson').value || null;
    const materialIdEl = document.getElementById('qfMaterial');
    const materialId = materialIdEl && materialIdEl.value ? materialIdEl.value : null;
    const difficulty = document.querySelector('input[name="qfDifficulty"]:checked').value;
    const questionText = document.getElementById('qfQuestionText').value.trim();
    const optionA = document.getElementById('qfOptionA').value.trim();
    const optionB = document.getElementById('qfOptionB').value.trim();
    const optionC = document.getElementById('qfOptionC').value.trim();
    const optionD = document.getElementById('qfOptionD').value.trim();
    const correctOption = parseInt(document.querySelector('input[name="qfCorrect"]:checked').value);
    const explanation = document.getElementById('qfExplanation').value.trim();

    if (!questionText) return alert('Vui lòng nhập nội dung câu hỏi!');
    if (!optionA || !optionB || !optionC || !optionD) return alert('Vui lòng nhập đầy đủ 4 đáp án!');

    const questionData = {
        course_id: courseId ? parseInt(courseId) : null,
        chapter_id: chapterId ? parseInt(chapterId) : null,
        lesson_id: lessonId ? parseInt(lessonId) : null,
        material_id: materialId ? parseInt(materialId) : null,
        question_type: 'multiple_choice',
        difficulty: difficulty,
        question_text: questionText,
        options: [optionA, optionB, optionC, optionD],
        correct_option: correctOption,
        explanation: explanation || null,
        updated_at: new Date().toISOString()
    };

    let result;
    if (editingQuestionId) {
        result = await supabaseClient.from('questions').update(questionData).eq('id', editingQuestionId).select();
    } else {
        result = await supabaseClient.from('questions').insert(questionData).select();
    }

    if (result.error) {
        alert('Lỗi lưu câu hỏi: ' + result.error.message);
        return;
    }

    const savedQuestion = result.data && result.data[0];
    if (savedQuestion) {
        // Đồng bộ hóa bảng liên kết material_questions (nhiều-nhiều)
        // 1. Xóa các liên kết cũ của câu hỏi này
        await supabaseClient.from('material_questions').delete().eq('question_id', savedQuestion.id);
        
        // 2. Thêm liên kết mới nếu có chọn học liệu trắc nghiệm cụ thể
        if (materialId) {
            await supabaseClient.from('material_questions').insert({
                material_id: parseInt(materialId),
                question_id: savedQuestion.id,
                order_index: 0
            });
        }
    }

    closeQuestionModal();
    await loadQuestions();
}

// Delete question
async function deleteQuestion(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi #' + id + '? Thao tác này không thể hoàn tác.')) return;
    if (!supabaseClient) return;

    const { error } = await supabaseClient.from('questions').delete().eq('id', id);
    if (error) {
        alert('Lỗi xóa câu hỏi: ' + error.message);
        return;
    }
    await loadQuestions();
}

// Live Preview KaTeX
function updateQuestionPreview() {
    const previewEl = document.getElementById('qbPreviewContent');
    if (!previewEl) return;

    const questionText = document.getElementById('qfQuestionText')?.value || '';
    const optA = document.getElementById('qfOptionA')?.value || '';
    const optB = document.getElementById('qfOptionB')?.value || '';
    const optC = document.getElementById('qfOptionC')?.value || '';
    const optD = document.getElementById('qfOptionD')?.value || '';
    const explanation = document.getElementById('qfExplanation')?.value || '';
    const correctVal = document.querySelector('input[name="qfCorrect"]:checked')?.value || '0';

    if (!questionText.trim()) {
        previewEl.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Nhập nội dung câu hỏi để xem trước...</p>';
        return;
    }

    const letters = ['A', 'B', 'C', 'D'];
    const options = [optA, optB, optC, optD];
    let optionsHTML = options.map((opt, i) => {
        const isCorrect = i === parseInt(correctVal);
        const style = isCorrect ? 'background: #D1FAE5; border-color: #10B981;' : '';
        const icon = isCorrect ? '<i class="fa-solid fa-check" style="color: #10B981; margin-left: 8px;"></i>' : '';
        return `<div style="padding: 10px 14px; border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; ${style}">
            <span style="font-weight: 700; color: var(--text-secondary);">${letters[i]}</span>
            <span>${opt || '...'}</span>${icon}
        </div>`;
    }).join('');

    let explanationHTML = '';
    if (explanation.trim()) {
        explanationHTML = `<div style="margin-top: 14px; padding: 14px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px;">
            <div style="font-weight: 700; margin-bottom: 6px; color: #065F46;"><i class="fa-solid fa-lightbulb"></i> Hướng dẫn giải</div>
            <div>${explanation}</div>
        </div>`;
    }

    previewEl.innerHTML = `
        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 16px; line-height: 1.7;">${questionText}</div>
        ${optionsHTML}
        ${explanationHTML}
    `;

    // Trigger KaTeX rendering
    if (typeof renderMathInElement === 'function') {
        try {
            renderMathInElement(previewEl, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        } catch (e) {
            console.warn('KaTeX render error:', e);
        }
    }
}
