// Supabase Database Connection Configuration
// Thầy Tùng Dương hãy điền thông tin kết nối từ tài khoản Supabase vào đây nhé!

const SUPABASE_URL = "https://tgwrduswgptnjpjlfzus.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnd3JkdXN3Z3B0bmpwamxmenVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTU0MjIsImV4cCI6MjA5OTA3MTQyMn0.8Fb42Lg5eyRrzBCC6YUR5VWWZLP5Pxqz6-GDRKturwg";

let supabaseClient = null;

if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY") {
    try {
        // Cần tải thư viện Supabase JS SDK trước khi file này chạy
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("Đã kết nối thành công tới Supabase Database!");
        } else {
            console.error("Supabase SDK chưa được tải. Vui lòng thêm thư viện script Supabase.");
        }
    } catch (error) {
        console.error("Lỗi khởi tạo Supabase client:", error);
    }
} else {
    console.warn("Website đang chạy ở chế độ DEMO OFFLINE. Dữ liệu khóa học sẽ được tự động tải từ kho mẫu có sẵn (Mock Data) trong mã nguồn. Hãy điền thông tin dự án Supabase của thầy vào file 'js/config.js' để kích hoạt chế độ quản trị thực tế.");
}
