-- ==============================================================================
-- SQL SEED: KHUNG DẠNG TOÁN CHUẨN SƯ PHẠM LỚP 12 (TOÁN SMART)
-- Bám sát 19 chuyên đề Ngân hàng câu hỏi thực tế của Thầy
-- ==============================================================================

-- Đảm bảo bảng math_topics đã tồn tại
CREATE TABLE IF NOT EXISTS math_topics (
    id SERIAL PRIMARY KEY,
    lesson_id INT,
    chuyen_de_id INT,
    topic_name TEXT NOT NULL,
    description TEXT,
    topic_order INT DEFAULT 1,
    cognitive_level TEXT DEFAULT 'TH' CHECK (cognitive_level IN ('NB', 'TH', 'VD', 'VDC')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Xóa dữ liệu mẫu cũ nếu có để nạp bộ chuẩn
DELETE FROM math_topics WHERE chuyen_de_id BETWEEN 1 AND 19;

-- CHUYÊN ĐỀ 1: ĐƠN ĐIỆU VÀ CỰC TRỊ
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(1, '1.1. Đọc khoảng đơn điệu từ bảng biến thiên hoặc bảng xét dấu', 'Đọc khoảng đồng biến, nghịch biến từ dấu y'' hoặc chiều mũi tên', 'NB', 1),
(1, '1.2. Đọc khoảng đơn điệu từ hình vẽ đồ thị', 'Nhìn nhánh đồ thị đi lên hoặc đi xuống từ trái sang phải', 'TH', 2),
(1, '1.3. Đọc điểm cực trị, giá trị cực trị từ bảng biến thiên hoặc bảng xét dấu', 'Xác định điểm cực đại, cực tiểu, giá trị cực trị', 'NB', 3),
(1, '1.4. Đọc điểm cực trị, giá trị cực trị từ hình vẽ đồ thị', 'Điểm uốn, đỉnh lồi, đáy lõm của đồ thị', 'TH', 4),
(1, '1.5. Xét tính đơn điệu khi biết công thức hàm số tường minh', 'Tính y'', giải y'' = 0 và lập bảng xét dấu', 'TH', 5),
(1, '1.6. Tìm cực trị khi biết công thức hàm số hoặc đạo hàm', 'Quy tắc 1 hoặc quy tắc 2 tìm cực trị', 'TH', 6),
(1, '1.7. Dùng tính đơn điệu để so sánh giá trị hoặc giải bất phương trình', 'Ứng dụng hàm đặc trưng và tính đơn điệu', 'VD', 7),
(1, '1.8. Tìm tham số m để hàm số đơn điệu trên khoảng yêu cầu', 'Điều kiện y'' >= 0 hoặc y'' <= 0, cô lập m hoặc tam thức bậc 2', 'VD', 8),
(1, '1.9. Tìm tham số m để hàm số có cực trị thỏa mãn điều kiện', 'Cực trị bậc 3, cực trị tạo thành tam giác, hình học', 'VDC', 9),
(1, '1.10. Bài tập tổng hợp đơn điệu và cực trị (Hàm hợp f(u))', 'Đạo hàm hàm hợp y'' = u'' * f''(u)', 'VDC', 10);

-- CHUYÊN ĐỀ 2: GTLN VÀ GTNN
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(2, '2.1. Đọc GTLN, GTNN từ bảng biến thiên hoặc hình vẽ đồ thị', 'Quan sát điểm cao nhất và thấp nhất trên miền xác định', 'NB', 1),
(2, '2.2. Tìm GTLN, GTNN của hàm đa thức, phân thức trên đoạn [a; b]', 'Tính đạo hàm, so sánh giá trị tại các điểm tới hạn và mút', 'TH', 2),
(2, '2.3. Tìm GTLN, GTNN trên khoảng và nửa khoảng', 'Lập bảng biến thiên để tìm cực trị tuyệt đối', 'TH', 3),
(2, '2.4. Tìm GTLN, GTNN của hàm chứa căn, lượng giác, mũ, logarit', 'Đổi biến hoặc đánh giá bất đẳng thức', 'VD', 4),
(2, '2.5. Bài toán chứa tham số m liên quan đến GTLN, GTNN', 'Biện luận min, max theo m (bao gồm hàm trị tuyệt đối)', 'VDC', 5),
(2, '2.6. Giải bài toán thực tiễn tối ưu quy về min, max', 'Thiết lập hàm số mục tiêu và tìm cực trị', 'VD', 6),
(2, '2.7. Kiểm tra tính đúng/sai nhiều tính chất liên quan min, max', 'Phần 2 trắc nghiệm Đúng/Sai', 'TH', 7);

-- CHUYÊN ĐỀ 3: TIỆM CẬN
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(3, '3.1. Đọc tiệm cận từ bảng biến thiên hoặc hình vẽ đồ thị', 'Nhận diện giới hạn vô cực và giới hạn tại vô cực', 'NB', 1),
(3, '3.2. Tìm tiệm cận đứng khi cho công thức hàm số', 'Tìm nghiệm mẫu không bị triệt tiêu bởi nghiệm tử', 'TH', 2),
(3, '3.3. Tìm tiệm cận ngang khi cho công thức hàm số', 'Tính giới hạn khi x tiến về dương/âm vô cùng', 'TH', 3),
(3, '3.4. Tìm tiệm cận xiên của hàm phân thức bậc 2 trên bậc 1', 'Chia đa thức hoặc tính hệ số a = lim y/x, b = lim (y - ax)', 'TH', 4),
(3, '3.5. Tìm tiệm cận từ các giới hạn cho trước', 'Suy luận tiệm cận từ điều kiện lim', 'TH', 5),
(3, '3.6. Đếm tổng số đường tiệm cận của đồ thị hàm số', 'Kết hợp đứng, ngang, xiên', 'VD', 6),
(3, '3.7. Bài toán tiệm cận chứa tham số m', 'Điều kiện có đúng n tiệm cận', 'VDC', 7);

-- CHUYÊN ĐỀ 4: KHẢO SÁT HÀM SỐ & NHẬN DẠNG ĐỒ THỊ
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(4, '4.1. Nhận dạng đồ thị hàm số bậc ba', 'Dựa vào nhánh vô cực, số điểm cực trị, giao điểm trục Oy', 'NB', 1),
(4, '4.2. Nhận dạng đồ thị hàm phân thức bậc nhất trên bậc nhất', 'Dựa vào tiệm cận đứng, ngang, giao điểm Ox, Oy', 'NB', 2),
(4, '4.3. Nhận dạng đồ thị hàm phân thức bậc hai trên bậc nhất', 'Dựa vào tiệm cận đứng, tiệm cận xiên, cực trị', 'TH', 3),
(4, '4.4. Xác định dấu của các hệ số từ đồ thị', 'Xác định dấu a, b, c, d từ tiệm cận, cực trị, giao điểm', 'TH', 4),
(4, '4.5. Tìm giao điểm của đồ thị với trục toạ độ hoặc đồ thị khác', 'Giải phương trình hoành độ giao điểm', 'TH', 5),
(4, '4.6. Dùng đồ thị biện luận số nghiệm của phương trình', 'Tương giao giữa đường cong y = f(x) và đường nằm ngang y = m', 'VD', 6),
(4, '4.7. Kiểm tra tính đúng/sai nhiều tính chất của hàm số', 'Trắc nghiệm Đúng/Sai theo cấu trúc Bộ 2025', 'TH', 7);

-- CHUYÊN ĐỀ 5: ỨNG DỤNG ĐẠO HÀM GIẢI BÀI TOÁN THỰC TIỄN
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(5, '5.1. Tối ưu chi phí, lợi nhuận, doanh thu trong kinh tế', 'Hàm chi phí C(x), doanh thu R(x), lợi nhuận P(x)', 'VD', 1),
(5, '5.2. Tối ưu diện tích, thể tích, kích thước vật liệu', 'Lon nước, hộp chữ nhật, bể chứa nước hình lăng trụ/trụ', 'VD', 2),
(5, '5.3. Tối ưu quãng đường, thời gian di chuyển, vị trí lắp đặt', 'Định lý Fermat về quang học, bài toán trạm điện', 'VD', 3),
(5, '5.4. Bài toán chuyển động (vận tốc tức thời, gia tốc)', 'v(t) = s''(t), a(t) = v''(t)', 'TH', 4),
(5, '5.5. Tốc độ thay đổi tức thời của một đại lượng', 'Nhiệt độ, thể tích nước xả, nồng độ thuốc', 'TH', 5),
(5, '5.6. Bài toán tăng trưởng hoặc phân rã', 'Quy luật tăng trưởng mũ N(t) = N0 * e^(kt)', 'TH', 6),
(5, '5.7. Đọc hiểu và xác định thông tin từ mô hình thực tiễn', 'Khai thác dữ kiện thực tế để giải toán', 'VD', 7);

-- CHUYÊN ĐỀ 6 & 7: VECTƠ VÀ TOẠ ĐỘ TRONG KHÔNG GIAN
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(6, '6.1. Xác định vectơ bằng nhau, cùng phương, đối nhau trong hình khối', 'Khối lập phương, hộp, tứ diện đều', 'NB', 1),
(6, '6.2. Tính tổng, hiệu các vectơ trong hình khối', 'Quy tắc 3 điểm, hình bình hành, hình hộp', 'TH', 2),
(6, '6.3. Tính góc giữa hai vectơ và tích vô hướng trong hình khối', 'Tính tích vô hướng u.v = |u||v|cos(u, v)', 'TH', 3),
(6, '6.4. Phân tích vectơ và giải bài toán thực tế mô tả bằng vectơ', 'Tổng hợp lực kéo, hướng gió', 'VD', 4),
(7, '7.1. Tìm toạ độ điểm và vectơ từ dữ kiện cho trước', 'Toạ độ hình chiếu, điểm đối xứng, toạ độ vectơ', 'NB', 1),
(7, '7.2. Dùng hệ thức trung điểm, trọng tâm theo toạ độ', 'Công thức toạ độ trung điểm và trọng tâm', 'NB', 2),
(7, '7.3. Tính độ dài vectơ, khoảng cách giữa 2 điểm, tích vô hướng', 'Biểu thức toạ độ của tích vô hướng và độ dài', 'TH', 3),
(7, '7.4. Toạ độ hoá bài toán hình không gian và bài toán thực tế', 'Thiết lập hệ trục Oxyz giải bài toán hình khối, radar, GPS', 'VD', 4);

-- CHUYÊN ĐỀ 8 & 9: THỐNG KÊ MẪU SỐ LIỆU GHÉP NHÓM
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(8, '8.1. Tính khoảng biến thiên của mẫu số liệu ghép nhóm', 'R = x_max - x_min', 'NB', 1),
(8, '8.2. Tính các tứ phân vị Q1, Q2, Q3 và khoảng tứ phân vị', 'Delta_Q = Q3 - Q1', 'TH', 2),
(8, '8.3. Phát hiện giá trị bất thường và bài tập tổng hợp', 'Đánh giá độ phân tán mẫu số liệu', 'VD', 3),
(9, '9.1. Tính số trung bình cộng của mẫu số liệu ghép nhóm', 'Dùng giá trị đại diện từng nhóm', 'TH', 1),
(9, '9.2. Tính phương sai và độ lệch chuẩn của mẫu ghép nhóm', 's^2 và s = sqrt(s^2)', 'TH', 2),
(9, '9.3. Dùng độ lệch chuẩn để so sánh độ đồng đều, mức độ phân tán', 'So sánh độ ổn định chất lượng, rủi ro tài chính', 'VD', 3);

-- CHUYÊN ĐỀ 10, 11, 12: NGUYÊN HÀM, TÍCH PHÂN & ỨNG DỤNG
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(10, '10.1. Tìm nguyên hàm cơ bản của hàm đa thức, luỹ thừa, căn thức, phân thức', 'Bảng nguyên hàm cơ bản', 'NB', 1),
(10, '10.2. Tìm nguyên hàm của hàm số mũ, logarit và lượng giác', 'Bảng nguyên hàm hàm sơ cấp', 'NB', 2),
(10, '10.3. Phương pháp đổi biến số và nguyên hàm từng phần', 'Kỹ thuật đặt ẩn phụ u và từng phần u*dv', 'TH', 3),
(10, '10.4. Tìm nguyên hàm thỏa mãn điều kiện và bài toán thực tế', 'Tìm hằng số C từ điều kiện F(x0) = y0', 'TH', 4),
(11, '11.1. Dùng tính chất và định nghĩa tích phân Newton-Leibniz', 'Tính chất cộng đoạn, nhân hằng số', 'NB', 1),
(11, '11.2. Tính tích phân bằng phương pháp đổi biến số và từng phần', 'Đổi biến số đổi cận, tích phân từng phần', 'TH', 2),
(11, '11.3. Tìm giá trị tham số m từ điều kiện tích phân và bài toán thực tế', 'Quãng đường, lưu lượng chất lỏng', 'VD', 3),
(12, '12.1. Tính diện tích hình phẳng giới hạn bởi các đường cong', 'Tích phân trị tuyệt đối f(x) - g(x)', 'TH', 1),
(12, '12.2. Tính diện tích hình phẳng khi cho hình vẽ đồ thị', 'Tách tích phân theo các giao điểm', 'TH', 2),
(12, '12.3. Tính thể tích khối tròn xoay quay quanh trục Ox', 'V = pi * int(f^2(x) dx)', 'TH', 3),
(12, '12.4. Tính thể tích vật thể bằng diện tích thiết diện và bài toán thực tế', 'V = int(S(x) dx)', 'VD', 4);

-- CHUYÊN ĐỀ 13, 14, 15, 16, 17: HÌNH HỌC TOẠ ĐỘ OXYZ
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(13, '13.1. Xác định VTPT và viết phương trình mặt phẳng qua 1 điểm', 'A(x-x0) + B(y-y0) + C(z-z0) = 0', 'NB', 1),
(13, '13.2. Viết phương trình mặt phẳng qua 3 điểm hoặc dạng đoạn chắn', 'x/a + y/b + z/c = 1', 'TH', 2),
(13, '13.3. Tính khoảng cách từ điểm đến mặt phẳng và vị trí tương đối', 'Công thức khoảng cách d(M, (P))', 'TH', 3),
(14, '14.1. Xác định VTCP và viết phương trình tham số, chính tắc của đường thẳng', 'Phương trình đường thẳng trong Oxyz', 'NB', 1),
(14, '14.2. Vị trí tương đối giữa đường thẳng với đường thẳng và mặt phẳng', 'Cắt nhau, chéo nhau, song song, vuông góc', 'TH', 2),
(14, '14.3. Khoảng cách và hình chiếu vuông góc liên quan đến đường thẳng', 'Tìm toạ độ hình chiếu H', 'TH', 3),
(15, '15.1. Công thức tính góc giữa 2 đường thẳng, đường thẳng với mặt phẳng, 2 mặt phẳng', 'Góc nhị diện và góc trong không gian', 'TH', 1),
(16, '16.1. Xác định tâm, bán kính và viết phương trình mặt cầu', '(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2', 'NB', 1),
(16, '16.2. Vị trí tương đối của mặt cầu với mặt phẳng, đường thẳng (thiết diện)', 'Giao tuyến là đường tròn r = sqrt(R^2 - d^2)', 'TH', 2),
(17, '17.1. Ứng dụng toạ độ Oxyz giải bài toán thực tiễn tổng hợp', 'Radar, máy bay, toạ độ hoá công trình kiến trúc', 'VD', 1);

-- CHUYÊN ĐỀ 18 & 19: XÁC SUẤT CÓ ĐIỀU KIỆN & CÔNG THỨC BAYES
INSERT INTO math_topics (chuyen_de_id, topic_name, description, cognitive_level, topic_order) VALUES
(18, '18.1. Định nghĩa và kí hiệu xác suất có điều kiện', 'P(A|B) = P(AB) / P(B)', 'NB', 1),
(18, '18.2. Tính xác suất có điều kiện khi cho trước các xác suất thành phần', 'Áp dụng công thức và tính chất', 'TH', 2),
(18, '18.3. Tính xác suất có điều kiện từ mô hình ngẫu nhiên cụ thể', 'Chọn bi, bốc thăm, chơi bài', 'TH', 3),
(18, '18.4. Quy tắc nhân xác suất và bài tập tổng hợp xác suất có điều kiện', 'P(AB) = P(A) * P(B|A)', 'VD', 4),
(19, '19.1. Tính xác suất bằng công thức xác suất toàn phần', 'P(A) = P(B1)P(A|B1) + P(B2)P(A|B2) + ...', 'TH', 1),
(19, '19.2. Tính xác suất bằng công thức Bayes', 'P(Bk|A) = [P(Bk)P(A|Bk)] / P(A)', 'VD', 2),
(19, '19.3. Bài toán thực tiễn xét nghiệm y tế, sản xuất tại các nhà máy', 'Độ nhạy, độ đặc hiệu, tỷ lệ lỗi', 'VD', 3),
(19, '19.4. Bài toán chuyển bóng/vật thể giữa các hộp rồi lấy ngẫu nhiên', 'Áp dụng kết hợp toàn phần và Bayes', 'VD', 4);
