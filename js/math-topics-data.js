/**
 * TOÁN SMART - KHUNG DẠNG TOÁN CHUẨN SƯ PHẠM LỚP 12 (19 CHUYÊN ĐỀ & ~80 DẠNG TOÁN)
 * Trích xuất chuẩn xác từ Ngân hàng câu hỏi thực tế của Thầy Dương
 * Hỗ trợ: Bộ lọc Chuyên đề, Dạng toán, Gán nhãn tự động (Auto-tagging), Question Family
 */

(function (global) {
    'use strict';

    // 19 Chuyên đề Chuẩn Sư Phạm Lớp 12
    const MATH_CHUYEN_DE_12 = [
        { id: 1, chapter: 1, name: "Chuyên đề 1: Tính đơn điệu và Cực trị của hàm số", short_name: "CĐ 1: Đơn điệu & Cực trị" },
        { id: 2, chapter: 1, name: "Chuyên đề 2: Giá trị lớn nhất và nhỏ nhất của hàm số", short_name: "CĐ 2: GTLN & GTNN" },
        { id: 3, chapter: 1, name: "Chuyên đề 3: Đường tiệm cận của đồ thị hàm số", short_name: "CĐ 3: Đường tiệm cận" },
        { id: 4, chapter: 1, name: "Chuyên đề 4: Khảo sát hàm số & Nhận dạng đồ thị", short_name: "CĐ 4: Khảo sát & Đồ thị" },
        { id: 5, chapter: 1, name: "Chuyên đề 5: Ứng dụng đạo hàm giải bài toán thực tiễn", short_name: "CĐ 5: Ứng dụng thực tiễn đạo hàm" },
        { id: 6, chapter: 2, name: "Chuyên đề 6: Vectơ trong không gian", short_name: "CĐ 6: Vectơ trong không gian" },
        { id: 7, chapter: 2, name: "Chuyên đề 7: Hệ toạ độ trong không gian Oxyz", short_name: "CĐ 7: Hệ toạ độ Oxyz" },
        { id: 8, chapter: 3, name: "Chuyên đề 8: Khoảng biến thiên & Tứ phân vị mẫu ghép nhóm", short_name: "CĐ 8: Khoảng biến thiên & Tứ phân vị" },
        { id: 9, chapter: 3, name: "Chuyên đề 9: Phương sai & Độ lệch chuẩn mẫu ghép nhóm", short_name: "CĐ 9: Phương sai & Độ lệch chuẩn" },
        { id: 10, chapter: 4, name: "Chuyên đề 10: Nguyên hàm của hàm số", short_name: "CĐ 10: Nguyên hàm" },
        { id: 11, chapter: 4, name: "Chuyên đề 11: Tích phân & Tính chất", short_name: "CĐ 11: Tích phân" },
        { id: 12, chapter: 4, name: "Chuyên đề 12: Ứng dụng tích phân tính Diện tích & Thể tích", short_name: "CĐ 12: Ứng dụng tích phân" },
        { id: 13, chapter: 5, name: "Chuyên đề 13: Phương trình mặt phẳng trong không gian Oxyz", short_name: "CĐ 13: PT Mặt phẳng Oxyz" },
        { id: 14, chapter: 5, name: "Chuyên đề 14: Phương trình đường thẳng trong không gian Oxyz", short_name: "CĐ 14: PT Đường thẳng Oxyz" },
        { id: 15, chapter: 5, name: "Chuyên đề 15: Góc và Khoảng cách trong không gian Oxyz", short_name: "CĐ 15: Góc & Khoảng cách Oxyz" },
        { id: 16, chapter: 5, name: "Chuyên đề 16: Phương trình mặt cầu trong không gian Oxyz", short_name: "CĐ 16: PT Mặt cầu Oxyz" },
        { id: 17, chapter: 5, name: "Chuyên đề 17: Ứng dụng hình học Oxyz giải bài toán thực tiễn", short_name: "CĐ 17: Ứng dụng thực tế Oxyz" },
        { id: 18, chapter: 6, name: "Chuyên đề 18: Xác suất có điều kiện & Quy tắc nhân", short_name: "CĐ 18: Xác suất có điều kiện" },
        { id: 19, chapter: 6, name: "Chuyên đề 19: Công thức Xác suất toàn phần & Công thức Bayes", short_name: "CĐ 19: XS Toàn phần & Bayes" }
    ];

    // Chi tiết ~80 Dạng toán kèm từ khóa nhận diện AI
    const MATH_TOPICS_GRADE_12 = [
        // Chuyên đề 1
        { id: 101, chuyen_de_id: 1, code: "1.1", name: "Đọc khoảng đơn điệu từ bảng biến thiên hoặc bảng xét dấu", level: "NB", keywords: ["đồng biến", "nghịch biến", "bảng biến thiên", "bảng xét dấu", "dấu của y'"] },
        { id: 102, chuyen_de_id: 1, code: "1.2", name: "Đọc khoảng đơn điệu từ hình vẽ đồ thị", level: "TH", keywords: ["đồ thị hàm số đồng biến", "đồ thị hàm số nghịch biến", "nhánh đồ thị đi lên"] },
        { id: 103, chuyen_de_id: 1, code: "1.3", name: "Đọc điểm cực trị, giá trị cực trị từ bảng biến thiên", level: "NB", keywords: ["điểm cực đại", "điểm cực tiểu", "giá trị cực đại", "giá trị cực tiểu", "cực trị"] },
        { id: 104, chuyen_de_id: 1, code: "1.4", name: "Đọc điểm cực trị, giá trị cực trị từ hình vẽ đồ thị", level: "TH", keywords: ["đồ thị", "điểm uốn", "đỉnh lồi", "đáy lõm", "cực đại", "cực tiểu"] },
        { id: 105, chuyen_de_id: 1, code: "1.5", name: "Xét tính đơn điệu khi biết công thức hàm số tường minh", level: "TH", keywords: ["hàm số đồng biến trên", "hàm số nghịch biến trên", "tính đơn điệu", "khoảng đồng biến"] },
        { id: 106, chuyen_de_id: 1, code: "1.6", name: "Tìm cực trị khi biết công thức hàm số hoặc đạo hàm", level: "TH", keywords: ["hàm số đạt cực trị tại", "số điểm cực trị của hàm số", "f'(x) ="] },
        { id: 107, chuyen_de_id: 1, code: "1.7", name: "Dùng tính đơn điệu để so sánh giá trị hoặc giải bất phương trình", level: "VD", keywords: ["so sánh", "bất phương trình f(x)", "hàm đặc trưng"] },
        { id: 108, chuyen_de_id: 1, code: "1.8", name: "Tìm tham số m để hàm số đơn điệu trên khoảng yêu cầu", level: "VD", keywords: ["tham số m", "đồng biến trên R", "nghịch biến trên khoảng", "cô lập m"] },
        { id: 109, chuyen_de_id: 1, code: "1.9", name: "Tìm tham số m để hàm số có cực trị thỏa mãn điều kiện", level: "VDC", keywords: ["có 3 điểm cực trị", "tam giác cực trị", "cực trị tạo thành"] },
        { id: 110, chuyen_de_id: 1, code: "1.10", name: "Bài tập tổng hợp đơn điệu và cực trị (Hàm hợp f(u))", level: "VDC", keywords: ["g(x) = f(", "hàm hợp", "số điểm cực trị của g(x)", "đồ thị f'(x)"] },

        // Chuyên đề 2
        { id: 201, chuyen_de_id: 2, code: "2.1", name: "Đọc GTLN, GTNN từ bảng biến thiên hoặc hình vẽ đồ thị", level: "NB", keywords: ["giá trị lớn nhất", "giá trị nhỏ nhất", "max", "min", "trên đoạn"] },
        { id: 202, chuyen_de_id: 2, code: "2.2", name: "Tìm GTLN, GTNN của hàm đa thức, phân thức trên đoạn [a; b]", level: "TH", keywords: ["giá trị lớn nhất của hàm số", "giá trị nhỏ nhất của hàm số", "trên đoạn [", "max y"] },
        { id: 203, chuyen_de_id: 2, code: "2.3", name: "Tìm GTLN, GTNN trên khoảng và nửa khoảng", level: "TH", keywords: ["trên khoảng (", "nửa khoảng", "GTLN", "GTNN"] },
        { id: 204, chuyen_de_id: 2, code: "2.4", name: "Tìm GTLN, GTNN của hàm chứa căn, lượng giác, mũ, logarit", level: "VD", keywords: ["chứa căn", "sin", "cos", "ln", "e^x", "min", "max"] },
        { id: 205, chuyen_de_id: 2, code: "2.5", name: "Bài toán chứa tham số m liên quan đến GTLN, GTNN", level: "VDC", keywords: ["tìm m để giá trị lớn nhất", "max |f(x)|", "min |f(x)|", "tham số m"] },
        { id: 206, chuyen_de_id: 2, code: "2.6", name: "Giải bài toán thực tiễn tối ưu quy về min, max", level: "VD", keywords: ["chi phí nhỏ nhất", "thời gian ngắn nhất", "thể tích lớn nhất", "diện tích lớn nhất"] },

        // Chuyên đề 3
        { id: 301, chuyen_de_id: 3, code: "3.1", name: "Đọc tiệm cận từ bảng biến thiên hoặc hình vẽ đồ thị", level: "NB", keywords: ["tiệm cận đứng", "tiệm cận ngang", "đường tiệm cận", "bảng biến thiên có tiệm cận"] },
        { id: 302, chuyen_de_id: 3, code: "3.2", name: "Tìm tiệm cận đứng khi cho công thức hàm số", level: "TH", keywords: ["phương trình tiệm cận đứng", "tiệm cận đứng của đồ thị"] },
        { id: 303, chuyen_de_id: 3, code: "3.3", name: "Tìm tiệm cận ngang khi cho công thức hàm số", level: "TH", keywords: ["phương trình tiệm cận ngang", "tiệm cận ngang của đồ thị", "y ="] },
        { id: 304, chuyen_de_id: 3, code: "3.4", name: "Tìm tiệm cận xiên của hàm phân thức bậc 2 trên bậc 1", level: "TH", keywords: ["tiệm cận xiên", "y = ax + b", "chia đa thức"] },
        { id: 305, chuyen_de_id: 3, code: "3.5", name: "Đếm tổng số đường tiệm cận của đồ thị hàm số", level: "VD", keywords: ["tổng số đường tiệm cận", "bao nhiêu đường tiệm cận"] },
        { id: 306, chuyen_de_id: 3, code: "3.6", name: "Bài toán tiệm cận chứa tham số m", level: "VDC", keywords: ["tìm m để có tiệm cận đứng", "2 tiệm cận đứng", "tiệm cận đi qua điểm"] },

        // Chuyên đề 4
        { id: 401, chuyen_de_id: 4, code: "4.1", name: "Nhận dạng đồ thị hàm số bậc ba", level: "NB", keywords: ["đường cong trong hình là đồ thị", "hàm số bậc ba", "ax^3 + bx^2"] },
        { id: 402, chuyen_de_id: 4, code: "4.2", name: "Nhận dạng đồ thị hàm phân thức bậc nhất trên bậc nhất", level: "NB", keywords: ["(ax+b)/(cx+d)", "đồ thị hàm phân thức"] },
        { id: 403, chuyen_de_id: 4, code: "4.3", name: "Nhận dạng đồ thị hàm phân thức bậc hai trên bậc nhất", level: "TH", keywords: ["(ax^2+bx+c)/(dx+e)", "đồ thị có tiệm cận xiên"] },
        { id: 404, chuyen_de_id: 4, code: "4.4", name: "Xác định dấu của các hệ số từ đồ thị", level: "TH", keywords: ["mệnh đề nào đúng", "a > 0", "b < 0", "c > 0", "dấu của các hệ số"] },
        { id: 405, chuyen_de_id: 4, code: "4.5", name: "Tìm giao điểm của đồ thị với trục toạ độ hoặc đồ thị khác", level: "TH", keywords: ["giao điểm với trục hoành", "giao điểm với trục tung", "tọa độ giao điểm"] },
        { id: 406, chuyen_de_id: 4, code: "4.6", name: "Dùng đồ thị biện luận số nghiệm của phương trình", level: "VD", keywords: ["số nghiệm của phương trình", "f(x) = m", "tương giao"] },

        // Chuyên đề 5
        { id: 501, chuyen_de_id: 5, code: "5.1", name: "Tối ưu chi phí, lợi nhuận, doanh thu trong kinh tế", level: "VD", keywords: ["doanh thu", "chi phí", "lợi nhuận", "sản phẩm", "nghìn đồng", "giá bán"] },
        { id: 502, chuyen_de_id: 5, code: "5.2", name: "Tối ưu diện tích, thể tích, kích thước vật liệu", level: "VD", keywords: ["chiếc hộp", "lon nước", "thể tích lớn nhất", "tốn ít vật liệu nhất", "hình trụ"] },
        { id: 503, chuyen_de_id: 5, code: "5.3", name: "Bài toán chuyển động (vận tốc tức thời, gia tốc)", level: "TH", keywords: ["vận tốc tức thời", "gia tốc", "quãng đường s(t)", "v(t)"] },
        { id: 504, chuyen_de_id: 5, code: "5.4", name: "Tốc độ thay đổi tức thời của một đại lượng", level: "TH", keywords: ["tốc độ tăng trưởng", "tốc độ thay đổi", "nhiệt độ", "nồng độ thuốc"] },

        // Chuyên đề 6 & 7
        { id: 601, chuyen_de_id: 6, code: "6.1", name: "Xác định vectơ bằng nhau, cùng phương trong hình khối", level: "NB", keywords: ["vectơ bằng nhau", "khối lập phương", "hình hộp", "tứ diện"] },
        { id: 602, chuyen_de_id: 6, code: "6.2", name: "Tính tổng, hiệu các vectơ trong hình khối", level: "TH", keywords: ["vectơ AB + vectơ AD", "quy tắc hình hộp", "quy tắc 3 điểm"] },
        { id: 603, chuyen_de_id: 6, code: "6.3", name: "Tính góc giữa hai vectơ và tích vô hướng trong hình khối", level: "TH", keywords: ["góc giữa hai vectơ", "tích vô hướng", "cos("] },
        { id: 701, chuyen_de_id: 7, code: "7.1", name: "Tìm toạ độ điểm và vectơ từ dữ kiện cho trước", level: "NB", keywords: ["toạ độ của vectơ", "toạ độ điểm", "vectơ u =", "hình chiếu lên mặt phẳng"] },
        { id: 702, chuyen_de_id: 7, code: "7.2", name: "Dùng hệ thức trung điểm, trọng tâm theo toạ độ", level: "NB", keywords: ["trọng tâm tam giác", "trung điểm của đoạn thẳng", "toạ độ trọng tâm"] },
        { id: 703, chuyen_de_id: 7, code: "7.3", name: "Tính độ dài vectơ, khoảng cách giữa 2 điểm, tích vô hướng", level: "TH", keywords: ["độ dài đoạn thẳng", "khoảng cách giữa hai điểm A và B", "|vectơ u|"] },
        { id: 704, chuyen_de_id: 7, code: "7.4", name: "Toạ độ hoá bài toán hình không gian và bài toán thực tế", level: "VD", keywords: ["hệ trục toạ độ Oxyz", "mô hình ra đa", "không gian Oxyz đặt"] },

        // Chuyên đề 8 & 9
        { id: 801, chuyen_de_id: 8, code: "8.1", name: "Tính khoảng biến thiên của mẫu số liệu ghép nhóm", level: "NB", keywords: ["khoảng biến thiên", "mẫu số liệu ghép nhóm", "nhóm ["] },
        { id: 802, chuyen_de_id: 8, code: "8.2", name: "Tính các tứ phân vị Q1, Q2, Q3 và khoảng tứ phân vị", level: "TH", keywords: ["tứ phân vị thứ nhất", "tứ phân vị thứ ba", "trung vị", "khoảng tứ phân vị"] },
        { id: 901, chuyen_de_id: 9, code: "9.1", name: "Tính số trung bình cộng của mẫu số liệu ghép nhóm", level: "TH", keywords: ["số trung bình", "giá trị đại diện", "trung bình cộng"] },
        { id: 902, chuyen_de_id: 9, code: "9.2", name: "Tính phương sai và độ lệch chuẩn của mẫu ghép nhóm", level: "TH", keywords: ["phương sai", "độ lệch chuẩn", "s^2", "mức độ phân tán"] },

        // Chuyên đề 10, 11, 12
        { id: 1001, chuyen_de_id: 10, code: "10.1", name: "Tìm nguyên hàm cơ bản của hàm đa thức, luỹ thừa, phân thức", level: "NB", keywords: ["nguyên hàm của hàm số", "họ tất cả các nguyên hàm", "\\int", "dx"] },
        { id: 1002, chuyen_de_id: 10, code: "10.2", name: "Tìm nguyên hàm của hàm số mũ, logarit và lượng giác", level: "NB", keywords: ["nguyên hàm của e^x", "nguyên hàm của sin", "nguyên hàm của cos", "\\int \\cos", "\\int e^"] },
        { id: 1003, chuyen_de_id: 10, code: "10.3", name: "Phương pháp đổi biến số và nguyên hàm từng phần", level: "TH", keywords: ["đặt u =", "nguyên hàm từng phần", "u dv"] },
        { id: 1004, chuyen_de_id: 10, code: "10.4", name: "Tìm nguyên hàm F(x) thỏa mãn điều kiện F(x0) = y0", level: "TH", keywords: ["biết F(", "F(0) =", "F(1) =", "hằng số C"] },
        { id: 1101, chuyen_de_id: 11, code: "11.1", name: "Dùng tính chất và định nghĩa tích phân", level: "NB", keywords: ["tích phân từ", "\\int_{", "tính chất tích phân", "cho \\int_0^1"] },
        { id: 1102, chuyen_de_id: 11, code: "11.2", name: "Tính tích phân bằng phương pháp đổi biến số và từng phần", level: "TH", keywords: ["đổi biến số", "tích phân từng phần", "I = \\int"] },
        { id: 1201, chuyen_de_id: 12, code: "12.1", name: "Tính diện tích hình phẳng giới hạn bởi các đường cong", level: "TH", keywords: ["diện tích hình phẳng", "giới hạn bởi đồ thị", "trục hoành", "S ="] },
        { id: 1202, chuyen_de_id: 12, code: "12.2", name: "Tính thể tích khối tròn xoay", level: "TH", keywords: ["thể tích khối tròn xoay", "quay quanh trục Ox", "V = \\pi"] },

        // Chuyên đề 13, 14, 15, 16, 17
        { id: 1301, chuyen_de_id: 13, code: "13.1", name: "Xác định VTPT và viết phương trình mặt phẳng qua 1 điểm", level: "NB", keywords: ["vectơ pháp tuyến của mặt phẳng", "phương trình mặt phẳng đi qua", "VTPT"] },
        { id: 1302, chuyen_de_id: 13, code: "13.2", name: "Viết phương trình mặt phẳng qua 3 điểm hoặc đoạn chắn", level: "TH", keywords: ["mặt phẳng (ABC)", "phương trình đoạn chắn", "cắt ba trục toạ độ"] },
        { id: 1303, chuyen_de_id: 13, code: "13.3", name: "Tính khoảng cách từ điểm đến mặt phẳng", level: "TH", keywords: ["khoảng cách từ điểm M đến mặt phẳng", "d(M, (P))"] },
        { id: 1401, chuyen_de_id: 14, code: "14.1", name: "Xác định VTCP và viết phương trình đường thẳng", level: "NB", keywords: ["vectơ chỉ phương", "phương trình tham số của đường thẳng", "phương trình chính tắc"] },
        { id: 1402, chuyen_de_id: 14, code: "14.2", name: "Vị trí tương đối giữa hai đường thẳng hoặc đường thẳng và mặt phẳng", level: "TH", keywords: ["vị trí tương đối", "cắt nhau", "chéo nhau", "song song", "vuông góc"] },
        { id: 1501, chuyen_de_id: 15, code: "15.1", name: "Tính góc giữa 2 đường thẳng, đường thẳng với mặt phẳng, 2 mặt phẳng", level: "TH", keywords: ["góc giữa hai mặt phẳng", "góc giữa đường thẳng và mặt phẳng", "cosin của góc"] },
        { id: 1601, chuyen_de_id: 16, code: "16.1", name: "Xác định tâm, bán kính và viết phương trình mặt cầu", level: "NB", keywords: ["phương trình mặt cầu", "tâm của mặt cầu", "bán kính của mặt cầu", "mặt cầu (S)"] },
        { id: 1602, chuyen_de_id: 16, code: "16.2", name: "Vị trí tương đối của mặt cầu với mặt phẳng (Thiết diện)", level: "TH", keywords: ["tiếp xúc mặt phẳng", "cắt mặt phẳng theo đường tròn", "bán kính đường tròn giao tuyến"] },
        { id: 1701, chuyen_de_id: 17, code: "17.1", name: "Ứng dụng toạ độ Oxyz giải bài toán thực tế", level: "VD", keywords: ["ra đa", "máy bay", "tầm phủ sóng", "vị trí tàu", "không gian Oxyz"] },

        // Chuyên đề 18 & 19
        { id: 1801, chuyen_de_id: 18, code: "18.1", name: "Định nghĩa và tính xác suất có điều kiện P(A|B)", level: "NB", keywords: ["P(A|B)", "xác suất có điều kiện", "biết rằng biến cố B xảy ra"] },
        { id: 1802, chuyen_de_id: 18, code: "18.2", name: "Quy tắc nhân xác suất và bài tập tính xác suất", level: "TH", keywords: ["quy tắc nhân xác suất", "P(AB)", "độc lập"] },
        { id: 1901, chuyen_de_id: 19, code: "19.1", name: "Tính xác suất bằng công thức xác suất toàn phần", level: "TH", keywords: ["công thức xác suất toàn phần", "hệ đầy đủ", "xác suất để lấy được"] },
        { id: 1902, chuyen_de_id: 19, code: "19.2", name: "Tính xác suất bằng công thức Bayes", level: "VD", keywords: ["công thức Bayes", "biết rằng biến cố", "tính xác suất để"] },
        { id: 1903, chuyen_de_id: 19, code: "19.3", name: "Bài toán thực tiễn xét nghiệm y tế, sản xuất nhà máy", level: "VD", keywords: ["dương tính", "âm tính", "mắc bệnh", "nhà máy", "phế phẩm", "sản phẩm lỗi"] },
        { id: 1904, chuyen_de_id: 19, code: "19.4", name: "Bài toán chuyển bóng/vật thể giữa các hộp rồi lấy ngẫu nhiên", level: "VD", keywords: ["chiếc hộp", "hộp I", "hộp II", "quả bóng", "bóng màu đỏ", "bóng màu vàng", "chuyển từ hộp"] }
    ];

    /**
     * Lấy danh sách dạng toán thuộc một chuyên đề
     */
    function getTopicsByChuyenDe(chuyenDeId) {
        if (!chuyenDeId) return MATH_TOPICS_GRADE_12;
        return MATH_TOPICS_GRADE_12.filter(t => t.chuyen_de_id === parseInt(chuyenDeId));
    }

    /**
     * Lấy thông tin chi tiết một dạng toán theo ID
     */
    function getTopicById(topicId) {
        if (!topicId) return null;
        return MATH_TOPICS_GRADE_12.find(t => t.id === parseInt(topicId) || t.code === String(topicId));
    }

    /**
     * Tự động nhận diện Dạng toán từ nội dung câu hỏi (AI / Keyword-based Auto-tagging)
     */
    function autoDetectTopic(questionText) {
        if (!questionText || typeof questionText !== 'string') return null;
        const lower = questionText.toLowerCase();

        // 1. Kiểm tra các dạng đặc trưng cao trước
        if ((lower.includes('hộp i') || lower.includes('chiếc hộp')) && (lower.includes('bóng') || lower.includes('bi')) && (lower.includes('chuyển') || lower.includes('bỏ vào'))) {
            return getTopicById(1904); // Dạng 19.4
        }
        if (lower.includes('dương tính') || lower.includes('mắc bệnh') || lower.includes('xét nghiệm') || (lower.includes('phế phẩm') && lower.includes('nhà máy'))) {
            return getTopicById(1903); // Dạng 19.3
        }
        if (lower.includes('tiệm cận xiên')) {
            return getTopicById(304); // Dạng 3.4
        }
        if (lower.includes('tiệm cận đứng')) {
            return getTopicById(302); // Dạng 3.2
        }
        if (lower.includes('tiệm cận ngang')) {
            return getTopicById(303); // Dạng 3.3
        }
        if (lower.includes('độ lệch chuẩn') || lower.includes('phương sai')) {
            return getTopicById(902); // Dạng 9.2
        }
        if (lower.includes('tứ phân vị') || lower.includes('khoảng tứ phân vị')) {
            return getTopicById(802); // Dạng 8.2
        }
        if (lower.includes('diện tích hình phẳng')) {
            return getTopicById(1201); // Dạng 12.1
        }
        if (lower.includes('thể tích khối tròn xoay')) {
            return getTopicById(1202); // Dạng 12.2
        }
        if (lower.includes('mặt cầu') && (lower.includes('tâm') || lower.includes('bán kính') || lower.includes('phương trình mặt cầu'))) {
            return getTopicById(1601); // Dạng 16.1
        }
        if (lower.includes('mặt phẳng') && (lower.includes('pháp tuyến') || lower.includes('phương trình mặt phẳng'))) {
            return getTopicById(1301); // Dạng 13.1
        }
        if (lower.includes('đường thẳng') && (lower.includes('chỉ phương') || lower.includes('phương trình tham số'))) {
            return getTopicById(1401); // Dạng 14.1
        }
        if (lower.includes('nguyên hàm') && (lower.includes('e^') || lower.includes('sin') || lower.includes('cos') || lower.includes('ln'))) {
            return getTopicById(1002); // Dạng 10.2
        }
        if (lower.includes('nguyên hàm')) {
            return getTopicById(1001); // Dạng 10.1
        }
        if (lower.includes('tích phân')) {
            return getTopicById(1101); // Dạng 11.1
        }
        if (lower.includes('giá trị lớn nhất') || lower.includes('giá trị nhỏ nhất') || lower.includes('gtln') || lower.includes('gtnn')) {
            return getTopicById(202); // Dạng 2.2
        }
        if (lower.includes('cực trị') || lower.includes('cực đại') || lower.includes('cực tiểu')) {
            return getTopicById(103); // Dạng 1.3
        }
        if (lower.includes('đồng biến') || lower.includes('nghịch biến') || lower.includes('đơn điệu')) {
            return getTopicById(101); // Dạng 1.1
        }

        // 2. Quét qua từ khóa của tất cả các dạng
        for (const topic of MATH_TOPICS_GRADE_12) {
            if (topic.keywords && topic.keywords.length > 0) {
                const match = topic.keywords.some(kw => lower.includes(kw.toLowerCase()));
                if (match) return topic;
            }
        }

        return null;
    }

    // Export ra Window
    global.MATH_CHUYEN_DE_12 = MATH_CHUYEN_DE_12;
    global.MATH_TOPICS_GRADE_12 = MATH_TOPICS_GRADE_12;
    global.MathTopicService = {
        getAllChuyenDe: () => MATH_CHUYEN_DE_12,
        getAllTopics: () => MATH_TOPICS_GRADE_12,
        getTopicsByChuyenDe: getTopicsByChuyenDe,
        getTopicById: getTopicById,
        autoDetectTopic: autoDetectTopic
    };

})(typeof window !== 'undefined' ? window : this);
