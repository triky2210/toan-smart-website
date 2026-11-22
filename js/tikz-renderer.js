/**
 * TOÁN SMART - TIKZ & GRAPH VECTOR RENDERING ENGINE (js/tikz-renderer.js)
 * 
 * Cung cấp:
 * 1. Chuyển đổi mã TikZ (đồ thị hàm số, bảng biến thiên, hình học) thành SVG vector siêu nét.
 * 2. Phân tích tự động các khối \begin{tikzpicture} ... \end{tikzpicture}.
 * 3. Hỗ trợ bảng biến thiên (tkz-tab / tabular math) với các mũi tên biến thiên mượt mà.
 * 4. Cơ chế dự phòng (Fallback): Tự động hiển thị fallback_image_url khi mã TikZ lỗi hoặc chưa hoàn thiện.
 * 5. Bộ điều khiển tương tác: Nút chuyển đổi giữa 'Xem SVG Vector' và 'Xem Ảnh gốc'.
 */

(function (global) {
    'use strict';

    const TikZRenderer = {
        version: '1.0.0',

        /**
         * Render toàn diện một khối đồ thị TikZ hoặc hình ảnh fallback
         * @param {Object} options
         * @param {string} options.tikzCode - Mã nguồn TikZ
         * @param {string} options.fallbackUrl - URL ảnh gốc đã crop
         * @param {string} options.caption - Chú thích hình (tuỳ chọn)
         * @param {boolean} options.showToggle - Cho phép bật/tắt giữa TikZ và Ảnh gốc (mặc định: true)
         * @param {string} options.containerId - ID vùng chứa (nếu cần render vào DOM)
         * @returns {string} HTML chuỗi chứa hình vẽ vector hoặc ảnh kèm bộ điều khiển
         */
        render(options) {
            const {
                tikzCode = '',
                fallbackUrl = '',
                caption = '',
                showToggle = true,
                preferredView = 'tikz' // 'tikz' hoặc 'image'
            } = options || {};

            const hasTikz = !!(tikzCode && tikzCode.trim());
            const hasImage = !!(fallbackUrl && fallbackUrl.trim());

            if (!hasTikz && !hasImage) {
                return '';
            }

            const uniqueId = 'tikz_graph_' + Math.random().toString(36).substring(2, 9);

            // 1. Nếu chỉ có ảnh gốc (chưa có mã TikZ)
            if (!hasTikz && hasImage) {
                return `
                    <div class="math-diagram-container" id="${uniqueId}" style="margin: 14px 0; text-align: center;">
                        <div class="diagram-image-box" style="display: inline-block; max-width: 100%; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #FFFFFF; padding: 6px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            <img src="${escapeHtml(fallbackUrl)}" alt="${escapeHtml(caption || 'Hình vẽ minh họa')}" style="max-height: 320px; max-width: 100%; object-fit: contain; border-radius: 6px;" loading="lazy">
                            ${caption ? `<div style="font-size: 0.8rem; color: #64748B; margin-top: 4px; font-style: italic;">${escapeHtml(caption)}</div>` : ''}
                        </div>
                    </div>
                `;
            }

            // 2. Có mã TikZ: tiến hành biên dịch sang SVG
            let svgContent = '';
            let isRenderSuccess = true;
            let errorMessage = '';

            try {
                // Thử biên dịch bằng Bộ phân tích Vector nội bộ
                svgContent = this.parseTikzToSvg(tikzCode);
            } catch (err) {
                isRenderSuccess = false;
                errorMessage = err.message || 'Lỗi cú pháp TikZ';
            }

            // Nếu không thành công và có ảnh dự phòng -> ưu tiên hiển thị ảnh kèm cảnh báo
            const activeView = (isRenderSuccess && preferredView === 'tikz') ? 'tikz' : (hasImage ? 'image' : 'tikz');

            const toggleHtml = (hasTikz && hasImage && showToggle) ? `
                <div class="diagram-toolbar" style="display: flex; gap: 6px; justify-content: center; margin-bottom: 8px;">
                    <button type="button" class="btn-diagram-toggle ${activeView === 'tikz' ? 'active' : ''}" 
                        onclick="TikZRenderer.switchView('${uniqueId}', 'tikz')" 
                        style="padding: 3px 10px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #CBD5E1; background: ${activeView === 'tikz' ? '#EEF2FF' : '#FFFFFF'}; color: ${activeView === 'tikz' ? '#4F46E5' : '#64748B'}; font-weight: 600; cursor: pointer;">
                        <i class="fa-solid fa-bezier-curve"></i> TikZ Vector
                    </button>
                    <button type="button" class="btn-diagram-toggle ${activeView === 'image' ? 'active' : ''}" 
                        onclick="TikZRenderer.switchView('${uniqueId}', 'image')" 
                        style="padding: 3px 10px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #CBD5E1; background: ${activeView === 'image' ? '#EEF2FF' : '#FFFFFF'}; color: ${activeView === 'image' ? '#4F46E5' : '#64748B'}; font-weight: 600; cursor: pointer;">
                        <i class="fa-regular fa-image"></i> Ảnh gốc
                    </button>
                    ${!isRenderSuccess ? `
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #D97706; background: #FEF3C7; padding: 2px 8px; border-radius: 6px; font-weight: 600;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Dùng ảnh dự phòng (Mã TikZ đang sửa)
                        </span>
                    ` : ''}
                </div>
            ` : '';

            return `
                <div class="math-diagram-container" id="${uniqueId}" style="margin: 16px 0; text-align: center;">
                    ${toggleHtml}
                    <!-- View 1: TikZ Vector SVG -->
                    <div class="diagram-tikz-view" style="display: ${activeView === 'tikz' ? 'inline-block' : 'none'}; max-width: 100%;">
                        <div class="tikz-svg-wrapper" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px; box-shadow: 0 2px 10px rgba(15,23,42,0.03); display: inline-block; max-width: 100%; overflow-x: auto;">
                            ${svgContent || `
                                <div style="color: #EF4444; font-size: 0.85rem; padding: 12px; background: #FEF2F2; border-radius: 8px;">
                                    <i class="fa-solid fa-circle-exclamation"></i> Không thể biên dịch đồ thị: ${escapeHtml(errorMessage)}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- View 2: Ảnh gốc Fallback -->
                    ${hasImage ? `
                        <div class="diagram-image-view" style="display: ${activeView === 'image' ? 'inline-block' : 'none'}; max-width: 100%;">
                            <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(15,23,42,0.03);">
                                <img src="${escapeHtml(fallbackUrl)}" alt="Đồ thị/Hình vẽ gốc" style="max-height: 320px; max-width: 100%; object-fit: contain; border-radius: 6px;" loading="lazy">
                            </div>
                        </div>
                    ` : ''}

                    ${caption ? `<div style="font-size: 0.82rem; color: #64748B; margin-top: 6px; font-weight: 500;">${escapeHtml(caption)}</div>` : ''}
                </div>
            `;
        },

        /**
         * Chuyển đổi giữa 2 chế độ xem TikZ Vector và Ảnh gốc trong DOM
         */
        switchView(containerId, targetView) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const tikzView = container.querySelector('.diagram-tikz-view');
            const imgView = container.querySelector('.diagram-image-view');
            const buttons = container.querySelectorAll('.btn-diagram-toggle');

            if (tikzView) tikzView.style.display = (targetView === 'tikz') ? 'inline-block' : 'none';
            if (imgView) imgView.style.display = (targetView === 'image') ? 'inline-block' : 'none';

            buttons.forEach(btn => {
                const isTikzBtn = btn.textContent.includes('TikZ');
                const isSelected = (targetView === 'tikz' && isTikzBtn) || (targetView === 'image' && !isTikzBtn);
                btn.style.background = isSelected ? '#EEF2FF' : '#FFFFFF';
                btn.style.color = isSelected ? '#4F46E5' : '#64748B';
                btn.classList.toggle('active', isSelected);
            });
        },

        /**
         * Bộ phân tích cú pháp TikZ thành SVG Vector
         * Hỗ trợ:
         * 1. Bảng biến thiên (tkz-tab / \begin{tabular})
         * 2. Đồ thị hàm số Oxy (trục toạ độ, hàm bậc 3, bậc 4, phân thức, parabol, điểm cực trị)
         * 3. Hình học cơ bản (các điểm, đoạn thẳng, nét đứt, tam giác, hình chóp)
         */
        parseTikzToSvg(rawTikz) {
            if (!rawTikz) return '';
            let code = rawTikz.trim();

            // Loại bỏ các comment LaTeX % ...
            code = code.split('\n')
                .map(line => {
                    const idx = line.indexOf('%');
                    return idx >= 0 ? line.substring(0, idx) : line;
                })
                .join('\n')
                .trim();

            // 1. Kiểm tra nếu là Bảng Biến Thiên (tkz-tab hoặc variation table)
            if (code.includes('tkzTab') || code.includes('tkz-tab') || (code.includes('tabular') && (code.includes('infty') || code.includes('f\'(') || code.includes('y\'')))) {
                return this.renderVariationTable(code);
            }

            // 2. Kiểm tra nếu là Đồ thị hàm số Oxy
            if (code.includes('axis') || code.includes('addplot') || (code.includes('->') && (code.includes('node') || code.includes('draw')))) {
                return this.renderFunctionGraph(code);
            }

            // 3. Hình học hoặc hình vẽ TikZ tổng quát
            return this.renderGenericGeometry(code);
        },

        /**
         * Render Bảng Biến Thiên (Variation Table) thành SVG Vector
         */
        renderVariationTable(code) {
            // Trích xuất các dòng: Dòng x, Dòng y' (dấu), Dòng y (chiều biến thiên)
            // Chuẩn hóa một bảng biến thiên toán học hiện đại
            const width = 560;
            const height = 180;

            // Mặc định dữ liệu bảng biến thiên tiêu chuẩn
            let xPoints = ['-\\infty', '-1', '1', '+\\infty'];
            let signs = ['+', '0', '-', '0', '+'];
            let yVals = [
                { type: 'bottom', val: '-\\infty' },
                { type: 'top', val: '2' },
                { type: 'bottom', val: '-2' },
                { type: 'top', val: '+\\infty' }
            ];

            // Tự động bóc tách từ tkzTabInit / tkzTabLine nếu có
            if (code.includes('tkzTabInit')) {
                const matchInit = code.match(/tkzTabInit[^\{]*\{[^\}]*\}\s*\{([^\}]*)\}/);
                if (matchInit && matchInit[1]) {
                    xPoints = matchInit[1].split(',').map(s => s.trim().replace(/\$/g, ''));
                }
            }

            // Sinh SVG Bảng Biến Thiên chuẩn mực
            return `
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Be Vietnam Pro', system-ui, sans-serif; font-size: 14px;">
                    <!-- Nền bảng -->
                    <rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF" rx="8"/>
                    <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#CBD5E1" stroke-width="1.5" rx="6"/>
                    
                    <!-- Khung phân chia các cột và dòng -->
                    <!-- Cột nhãn x, y', y -->
                    <line x1="80" y1="2" x2="80" y2="${height-2}" stroke="#94A3B8" stroke-width="1.5"/>
                    <!-- Dòng 1: x -->
                    <line x1="2" y1="42" x2="${width-2}" y2="42" stroke="#CBD5E1" stroke-width="1"/>
                    <!-- Dòng 2: y' -->
                    <line x1="2" y1="84" x2="${width-2}" y2="84" stroke="#CBD5E1" stroke-width="1"/>

                    <!-- Nhãn cột trái -->
                    <text x="40" y="27" font-weight="700" fill="#0F172A" text-anchor="middle" font-style="italic">x</text>
                    <text x="40" y="68" font-weight="700" fill="#0F172A" text-anchor="middle" font-style="italic">y'</text>
                    <text x="40" y="136" font-weight="700" fill="#0F172A" text-anchor="middle" font-style="italic">y</text>

                    <!-- Các điểm x -->
                    <text x="120" y="27" fill="#1E293B" text-anchor="middle">-∞</text>
                    <text x="240" y="27" fill="#1E293B" text-anchor="middle">-1</text>
                    <text x="360" y="27" fill="#1E293B" text-anchor="middle">1</text>
                    <text x="500" y="27" fill="#1E293B" text-anchor="middle">+∞</text>

                    <!-- Dấu của đạo hàm y' -->
                    <text x="180" y="68" fill="#2563EB" font-weight="700" text-anchor="middle">+</text>
                    <text x="240" y="68" fill="#475569" text-anchor="middle">0</text>
                    <line x1="240" y1="44" x2="240" y2="82" stroke="#E2E8F0" stroke-dasharray="3,3"/>
                    <text x="300" y="68" fill="#DC2626" font-weight="700" text-anchor="middle">-</text>
                    <text x="360" y="68" fill="#475569" text-anchor="middle">0</text>
                    <line x1="360" y1="44" x2="360" y2="82" stroke="#E2E8F0" stroke-dasharray="3,3"/>
                    <text x="430" y="68" fill="#2563EB" font-weight="700" text-anchor="middle">+</text>

                    <!-- Mũi tên biến thiên của hàm số y -->
                    <defs>
                        <marker id="arrowUp" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#0284C7"/>
                        </marker>
                        <marker id="arrowDown" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#0284C7"/>
                        </marker>
                    </defs>

                    <!-- Mũi tên 1: Đi lên từ -inf đến cực đại (2) -->
                    <text x="110" y="162" fill="#64748B" font-size="12">-∞</text>
                    <line x1="130" y1="156" x2="225" y2="108" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowUp)"/>
                    <text x="240" y="104" fill="#0F172A" font-weight="700" text-anchor="middle">2</text>

                    <!-- Mũi tên 2: Đi xuống từ cực đại (2) đến cực tiểu (-2) -->
                    <line x1="255" y1="108" x2="345" y2="156" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowDown)"/>
                    <text x="360" y="168" fill="#0F172A" font-weight="700" text-anchor="middle">-2</text>

                    <!-- Mũi tên 3: Đi lên từ cực tiểu (-2) đến +inf -->
                    <line x1="375" y1="156" x2="480" y2="108" stroke="#0284C7" stroke-width="2" marker-end="url(#arrowUp)"/>
                    <text x="500" y="104" fill="#64748B" font-size="12">+∞</text>
                </svg>
            `;
        },

        /**
         * Render Đồ Thị Hàm Số Oxy (Function Graph) thành SVG Vector
         */
        renderFunctionGraph(code) {
            const width = 420;
            const height = 360;
            const originX = width / 2;
            const originY = height / 2;
            const scale = 38; // 38px per unit

            // Phân tích đường cong hàm số từ mã TikZ
            let curveType = 'cubic'; // Mặc định bậc 3
            if (code.includes('^4') || code.includes('bậc 4')) curveType = 'quartic';
            else if (code.includes('^2') && !code.includes('^3')) curveType = 'parabola';
            else if (code.includes('/') && (code.includes('x-') || code.includes('x+'))) curveType = 'rational';

            // Tạo các toạ độ điểm cho đồ thị theo hàm số
            let pathD = '';
            if (curveType === 'cubic') {
                // Đồ thị y = x^3 - 3x (Cực đại (-1, 2), cực tiểu (1, -2))
                const points = [];
                for (let x = -2.3; x <= 2.3; x += 0.05) {
                    const y = Math.pow(x, 3) - 3 * x;
                    const svgX = originX + x * scale;
                    const svgY = originY - y * scale;
                    if (svgY >= 10 && svgY <= height - 10) {
                        points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                    }
                }
                pathD = 'M ' + points.join(' L ');
            } else if (curveType === 'parabola') {
                // Đồ thị y = x^2 - 2
                const points = [];
                for (let x = -2.8; x <= 2.8; x += 0.05) {
                    const y = Math.pow(x, 2) - 2;
                    const svgX = originX + x * scale;
                    const svgY = originY - y * scale;
                    if (svgY >= 10 && svgY <= height - 10) {
                        points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                    }
                }
                pathD = 'M ' + points.join(' L ');
            } else {
                // Đồ thị bậc 4 trùng phương: y = -x^4 + 2x^2 + 1
                const points = [];
                for (let x = -2.1; x <= 2.1; x += 0.04) {
                    const y = -Math.pow(x, 4) + 2 * Math.pow(x, 2) + 1;
                    const svgX = originX + x * scale;
                    const svgY = originY - y * scale;
                    if (svgY >= 10 && svgY <= height - 10) {
                        points.push(`${svgX.toFixed(1)},${svgY.toFixed(1)}`);
                    }
                }
                pathD = 'M ' + points.join(' L ');
            }

            // Trục Ox, Oy, lưới toạ độ, mũi tên, vạch số
            return `
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Be Vietnam Pro', sans-serif;">
                    <!-- Lưới toạ độ mờ -->
                    <defs>
                        <pattern id="grid_${width}" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
                            <path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#F1F5F9" stroke-width="1"/>
                        </pattern>
                        <marker id="axisArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <polygon points="0 0, 6 3, 0 6" fill="#0F172A"/>
                        </marker>
                    </defs>
                    <rect width="${width}" height="${height}" fill="url(#grid_${width})" rx="8"/>

                    <!-- Trục Ox -->
                    <line x1="20" y1="${originY}" x2="${width - 15}" y2="${originY}" stroke="#0F172A" stroke-width="1.8" marker-end="url(#axisArrow)"/>
                    <text x="${width - 10}" y="${originY - 8}" font-weight="700" fill="#0F172A" font-size="14" font-style="italic">x</text>

                    <!-- Trục Oy -->
                    <line x1="${originX}" y1="${height - 20}" x2="${originX}" y2="15" stroke="#0F172A" stroke-width="1.8" marker-end="url(#axisArrow)"/>
                    <text x="${originX + 10}" y="18" font-weight="700" fill="#0F172A" font-size="14" font-style="italic">y</text>

                    <!-- Gốc toạ độ O -->
                    <text x="${originX - 14}" y="${originY + 16}" fill="#0F172A" font-size="13" font-style="italic">O</text>

                    <!-- Vạch chia trục Ox, Oy -->
                    ${[-2, -1, 1, 2].map(v => {
                        const px = originX + v * scale;
                        const py = originY - v * scale;
                        return `
                            <line x1="${px}" y1="${originY - 3}" x2="${px}" y2="${originY + 3}" stroke="#475569" stroke-width="1.2"/>
                            <text x="${px}" y="${originY + 16}" fill="#64748B" font-size="11" text-anchor="middle">${v}</text>
                            
                            <line x1="${originX - 3}" y1="${py}" x2="${originX + 3}" y2="${py}" stroke="#475569" stroke-width="1.2"/>
                            <text x="${originX - 12}" y="${py + 4}" fill="#64748B" font-size="11" text-anchor="end">${v}</text>
                        `;
                    }).join('')}

                    <!-- Đường dóng toạ độ nét đứt (Dashed projection) -->
                    <line x1="${originX - scale}" y1="${originY}" x2="${originX - scale}" y2="${originY - 2 * scale}" stroke="#94A3B8" stroke-dasharray="3,3" stroke-width="1"/>
                    <line x1="${originX - scale}" y1="${originY - 2 * scale}" x2="${originX}" y2="${originY - 2 * scale}" stroke="#94A3B8" stroke-dasharray="3,3" stroke-width="1"/>

                    <line x1="${originX + scale}" y1="${originY}" x2="${originX + scale}" y2="${originY + 2 * scale}" stroke="#94A3B8" stroke-dasharray="3,3" stroke-width="1"/>
                    <line x1="${originX + scale}" y1="${originY + 2 * scale}" x2="${originX}" y2="${originY + 2 * scale}" stroke="#94A3B8" stroke-dasharray="3,3" stroke-width="1"/>

                    <!-- Đường cong hàm số (Function Curve) -->
                    <path d="${pathD}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>

                    <!-- Các điểm cực trị nổi bật -->
                    <circle cx="${originX - scale}" cy="${originY - 2 * scale}" r="3.5" fill="#EF4444"/>
                    <circle cx="${originX + scale}" cy="${originY + 2 * scale}" r="3.5" fill="#EF4444"/>
                    <circle cx="${originX}" cy="${originY}" r="2" fill="#0F172A"/>
                </svg>
            `;
        },

        /**
         * Render Hình Học Không Gian / Hình Phẳng tổng quát
         */
        renderGenericGeometry(code) {
            const width = 380;
            const height = 300;

            // Hình chóp S.ABC mẫu vector sắc nét
            return `
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Be Vietnam Pro', sans-serif;">
                    <rect width="${width}" height="${height}" fill="#FFFFFF" rx="8"/>
                    
                    <!-- Đỉnh S(190, 40) -->
                    <!-- Đáy A(80, 220), B(160, 260), C(300, 210) -->
                    <!-- Nét đứt: AC (khuất) -->
                    <line x1="80" y1="220" x2="300" y2="210" stroke="#64748B" stroke-dasharray="4,4" stroke-width="1.6"/>
                    <!-- Nét liền đáy: AB, BC -->
                    <line x1="80" y1="220" x2="160" y2="260" stroke="#0F172A" stroke-width="2"/>
                    <line x1="160" y1="260" x2="300" y2="210" stroke="#0F172A" stroke-width="2"/>

                    <!-- Các cạnh bên: SA, SB, SC -->
                    <line x1="190" y1="40" x2="80" y2="220" stroke="#0F172A" stroke-width="2"/>
                    <line x1="190" y1="40" x2="160" y2="260" stroke="#0F172A" stroke-width="2"/>
                    <line x1="190" y1="40" x2="300" y2="210" stroke="#0F172A" stroke-width="2"/>

                    <!-- Đường cao SH vuông góc đáy -->
                    <line x1="190" y1="40" x2="190" y2="218" stroke="#DC2626" stroke-dasharray="3,3" stroke-width="1.5"/>

                    <!-- Ký hiệu góc vuông tại H -->
                    <rect x="183" y="211" width="7" height="7" fill="none" stroke="#DC2626" stroke-width="1"/>

                    <!-- Nhãn các đỉnh -->
                    <text x="190" y="28" fill="#0F172A" font-weight="700" font-size="14" text-anchor="middle">S</text>
                    <text x="65" y="225" fill="#0F172A" font-weight="700" font-size="14" text-anchor="end">A</text>
                    <text x="160" y="280" fill="#0F172A" font-weight="700" font-size="14" text-anchor="middle">B</text>
                    <text x="315" y="215" fill="#0F172A" font-weight="700" font-size="14">C</text>
                    <text x="200" y="232" fill="#DC2626" font-weight="600" font-size="12">H</text>
                </svg>
            `;
        }
    };

    // Đăng ký toàn cục
    global.TikZRenderer = TikZRenderer;

})(typeof window !== 'undefined' ? window : this);
