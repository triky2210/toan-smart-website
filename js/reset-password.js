// Toán Smart Website - Reset Password Logic (Supabase Auth & Fallback)

document.addEventListener('DOMContentLoaded', async () => {
    const isOnline = (typeof supabaseClient !== 'undefined' && supabaseClient !== null);
    
    const resetForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

    // Kiểm tra tính hợp lệ của session phục hồi mật khẩu (chỉ khi online)
    if (isOnline) {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            
            // Link phục hồi từ Email sẽ tự động thiết lập session tạm thời trên URL Hash
            if (!session) {
                console.warn("Không tìm thấy phiên phục hồi mật khẩu. Có thể link đã hết hạn hoặc không hợp lệ.");
            }
        } catch (err) {
            console.error("Lỗi khi kiểm tra session phục hồi:", err);
        }
    }

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = newPasswordInput.value;
            const confirmPassword = confirmNewPasswordInput.value;

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
                    // Cập nhật mật khẩu mới của user đang đăng nhập tạm thời
                    const { data, error } = await supabaseClient.auth.updateUser({
                        password: password
                    });

                    if (error) throw error;

                    alert("Đặt lại mật khẩu thành công! Thầy/bạn có thể đăng nhập bằng mật khẩu mới.");
                    window.location.href = 'login.html';
                } catch (err) {
                    console.error("Lỗi cập nhật mật khẩu:", err);
                    let displayMsg = err.message;
                    if (err.message && (
                        err.message.toLowerCase().includes("different") || 
                        err.message.toLowerCase().includes("same as") ||
                        err.message.toLowerCase().includes("old password")
                    )) {
                        displayMsg = "Mật khẩu mới không được trùng với mật khẩu cũ!";
                    }
                    alert("Cập nhật mật khẩu thất bại: " + displayMsg);
                }
            } else {
                // Offline fallback mode
                // Mô phỏng đặt lại mật khẩu cho tài khoản demo
                let users = JSON.parse(localStorage.getItem('demo_users')) || [];
                if (users.length > 0) {
                    const lastUser = users[users.length - 1];
                    if (lastUser.password === password) {
                        alert("Cập nhật mật khẩu thất bại: Mật khẩu mới không được trùng với mật khẩu cũ!");
                        return;
                    }
                    lastUser.password = password;
                    localStorage.setItem('demo_users', JSON.stringify(users));
                }
                alert("Demo Offline: Mô phỏng đặt lại mật khẩu mới thành công!");
                window.location.href = 'login.html';
            }
        });
    }
});
