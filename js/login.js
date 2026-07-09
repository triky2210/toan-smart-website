// Toán Smart Website - Student Authentication Logic (Supabase Auth & Fallback)

document.addEventListener('DOMContentLoaded', () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
    
    // Tab Elements
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Tab switching
    if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });
        
        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }
    
    // REGISTER PROCESS
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            if (password.length < 6) {
                alert("Mật khẩu phải chứa ít nhất 6 ký tự!");
                return;
            }
            
            if (password !== confirmPassword) {
                alert("Mật khẩu xác nhận không khớp!");
                return;
            }
            
            if (isOnline) {
                try {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: fullName
                            }
                        }
                    });
                    
                    if (error) throw error;
                    
                    alert("Đăng ký thành công! Vui lòng kiểm tra email của thầy/bạn để kích hoạt tài khoản nếu Supabase yêu cầu xác minh.");
                    
                    // Switch to login tab
                    tabLoginBtn.click();
                    document.getElementById('loginEmail').value = email;
                    registerForm.reset();
                    
                } catch (err) {
                    console.error("Lỗi đăng ký:", err);
                    alert("Đăng ký thất bại: " + err.message);
                }
            } else {
                // Offline fallback mode
                let users = JSON.parse(localStorage.getItem('demo_users')) || [];
                if (users.some(u => u.email === email)) {
                    alert("Email này đã được đăng ký tài khoản!");
                    return;
                }
                
                users.push({ name: fullName, email, password });
                localStorage.setItem('demo_users', JSON.stringify(users));
                
                alert("Đăng ký tài khoản Demo Offline thành công!");
                tabLoginBtn.click();
                document.getElementById('loginEmail').value = email;
                registerForm.reset();
            }
        });
    }
    
    // LOGIN PROCESS
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (isOnline) {
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) throw error;
                    
                    alert("Đăng nhập thành công!");
                    handleRedirect();
                    
                } catch (err) {
                    console.error("Lỗi đăng nhập:", err);
                    alert("Đăng nhập thất bại: " + err.message);
                }
            } else {
                // Offline fallback mode
                // 1. Kiểm tra tài khoản admin mẫu
                if (email === 'admin@toansmart.edu.vn' && password === 'admin') {
                    localStorage.setItem('demo_admin_user', JSON.stringify({ name: "Thầy Tùng Dương", email: email }));
                    localStorage.removeItem('demo_student_user');
                    alert("Đăng nhập Admin thành công!");
                    handleRedirect();
                    return;
                }
                
                // 2. Kiểm tra tài khoản học sinh mẫu vừa đăng ký
                let users = JSON.parse(localStorage.getItem('demo_users')) || [];
                const foundUser = users.find(u => u.email === email && u.password === password);
                if (foundUser) {
                    localStorage.setItem('demo_student_user', JSON.stringify({ name: foundUser.name, email: email }));
                    localStorage.removeItem('demo_admin_user');
                    alert("Đăng nhập học viên thành công!");
                    handleRedirect();
                } else {
                    alert("Sai email hoặc mật khẩu! (Gợi ý Admin offline: admin@toansmart.edu.vn / admin)");
                }
            }
        });
    }
    
    // REDIRECT HANDLER
    function handleRedirect() {
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }
});
