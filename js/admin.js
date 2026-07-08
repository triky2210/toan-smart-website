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

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tab = button.getAttribute('data-tab');
            tabPanes.forEach(pane => {
                pane.style.display = pane.getAttribute('id') === `${tab}Pane` ? 'block' : 'none';
            });
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
