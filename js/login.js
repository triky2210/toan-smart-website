// Toán Smart Website - Student Authentication Logic (Supabase Auth & Fallback)

document.addEventListener('DOMContentLoaded', () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
    
    // Tab Elements
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Forgot Password Elements
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');
    const forgotForm = document.getElementById('forgotForm');
    const loginTabs = document.querySelector('.login-tabs');
    
    // Tab switching
    if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'none';
        });
        
        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            if (forgotForm) forgotForm.style.display = 'none';
        });
    }

    // Toggle forgot password form
    if (forgotPasswordLink && backToLoginLink && forgotForm && loginForm && loginTabs) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            loginTabs.style.display = 'none';
            forgotForm.style.display = 'block';
        });

        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotForm.style.display = 'none';
            loginTabs.style.display = 'flex';
            tabLoginBtn.click();
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
                    
                    if (data && data.session) {
                        alert("Đăng ký tài khoản thành công và tự động đăng nhập!");
                        const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectUrl;
                    } else {
                        alert("Đăng ký thành công! Vui lòng kiểm tra email của bạn để kích hoạt tài khoản.");
                        // Switch to login tab
                        tabLoginBtn.click();
                        document.getElementById('loginEmail').value = email;
                        registerForm.reset();
                    }
                    
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

    // FORGOT PASSWORD PROCESS
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();

            if (isOnline) {
                try {
                    const redirectToUrl = window.location.origin + '/reset-password.html';
                    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                        redirectTo: redirectToUrl
                    });

                    if (error) throw error;

                    alert("Đã gửi yêu cầu thành công! Vui lòng kiểm tra hộp thư email của bạn để nhận liên kết đặt lại mật khẩu mới.");
                    backToLoginLink.click();
                } catch (err) {
                    console.error("Lỗi gửi yêu cầu khôi phục mật khẩu:", err);
                    alert("Không thể gửi yêu cầu: " + err.message);
                }
            } else {
                // Offline fallback
                let users = JSON.parse(localStorage.getItem('demo_users')) || [];
                const found = users.some(u => u.email === email) || email === 'admin@toansmart.edu.vn';
                if (found) {
                    alert("Demo Offline: Mô phỏng gửi email thành công! Thầy/bạn vui lòng mở trang reset-password.html trực tiếp để tiến hành đặt lại mật khẩu mới.");
                    window.location.href = 'reset-password.html';
                } else {
                    alert("Email này chưa được đăng ký trong hệ thống demo!");
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
