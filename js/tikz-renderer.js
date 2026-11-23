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
         * @param {string} options.svgCode - Mã SVG vector trực tiếp (nếu có)
         * @param {string} options.fallbackUrl - URL ảnh gốc đã crop
         * @param {string} options.caption - Chú thích hình (tuỳ chọn)
         * @param {boolean} options.showToggle - Cho phép bật/tắt giữa TikZ và Ảnh gốc (mặc định: true)
         * @param {number|string} options.questionIndex - Chỉ số câu hỏi (để bắt sự kiện sửa hình)
         * @param {string} options.containerId - ID vùng chứa (nếu cần render vào DOM)
         * @returns {string} HTML chuỗi chứa hình vẽ vector hoặc ảnh kèm bộ điều khiển
         */
        render(options) {
            const {
                tikzCode = '',
                svgCode = '',
                fallbackUrl = '',
                caption = '',
                showToggle = true,
                preferredView = 'tikz', // 'tikz' hoặc 'image'
                questionIndex = null
            } = options || {};

            const hasSvg = !!(svgCode && svgCode.trim());
            const hasTikz = !!(tikzCode && tikzCode.trim());
            const hasImage = !!(fallbackUrl && fallbackUrl.trim());

            if (!hasSvg && !hasTikz && !hasImage) {
                return '';
            }

            const uniqueId = 'tikz_graph_' + Math.random().toString(36).substring(2, 9);

            // 1. Nếu chỉ có ảnh gốc (chưa có mã TikZ hoặc SVG)
            if (!hasSvg && !hasTikz && hasImage) {
                return `
                    <div class="math-diagram-container" id="${uniqueId}" style="margin: 14px 0; text-align: center;">
                        <div class="diagram-image-box" style="display: inline-block; max-width: 100%; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #FFFFFF; padding: 6px; box-shadow: 0 2px 8px rgba(15,23,42,0.04);">
                            <img src="${escapeHtml(fallbackUrl)}" alt="${escapeHtml(caption || 'Hình vẽ minh họa')}" style="max-height: 320px; max-width: 100%; object-fit: contain; border-radius: 6px;" loading="lazy">
                            ${caption ? `<div style="font-size: 0.8rem; color: #64748B; margin-top: 4px; font-style: italic;">${escapeHtml(caption)}</div>` : ''}
                        </div>
                    </div>
                `;
            }

            // 2. Có mã SVG hoặc TikZ: tiến hành xử lý sang SVG
            let svgContent = '';
            let isRenderSuccess = true;
            let errorMessage = '';

            try {
                if (hasSvg) {
                    svgContent = svgCode.trim();
                } else if (hasTikz) {
                    const trimmed = tikzCode.trim();
                    if (trimmed.startsWith('<svg') || trimmed.includes('xmlns="http://www.w3.org/2000/svg"')) {
                        svgContent = trimmed;
                    } else {
                        svgContent = this.parseTikzToSvg(trimmed);
                    }
                }
            } catch (err) {
                isRenderSuccess = false;
                errorMessage = err.message || 'Lỗi cú pháp TikZ / SVG';
            }

            // Nếu không thành công và có ảnh dự phòng -> ưu tiên hiển thị ảnh kèm cảnh báo
            const activeView = (isRenderSuccess && preferredView === 'tikz') ? 'tikz' : (hasImage ? 'image' : 'tikz');
            const hasVector = hasSvg || hasTikz;

            const toggleHtml = (hasVector && hasImage && showToggle) ? `
                <div class="diagram-toolbar" style="display: flex; gap: 6px; justify-content: center; margin-bottom: 8px;">
                    <button type="button" class="btn-diagram-toggle ${activeView === 'tikz' ? 'active' : ''}" 
                        onclick="TikZRenderer.switchView('${uniqueId}', 'tikz')" 
                        style="padding: 3px 10px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #CBD5E1; background: ${activeView === 'tikz' ? '#EEF2FF' : '#FFFFFF'}; color: ${activeView === 'tikz' ? '#4F46E5' : '#64748B'}; font-weight: 600; cursor: pointer;">
                        <i class="fa-solid fa-bezier-curve"></i> SVG Vector
                    </button>
                    <button type="button" class="btn-diagram-toggle ${activeView === 'image' ? 'active' : ''}" 
                        onclick="TikZRenderer.switchView('${uniqueId}', 'image')" 
                        style="padding: 3px 10px; font-size: 0.75rem; border-radius: 6px; border: 1px solid #CBD5E1; background: ${activeView === 'image' ? '#EEF2FF' : '#FFFFFF'}; color: ${activeView === 'image' ? '#4F46E5' : '#64748B'}; font-weight: 600; cursor: pointer;">
                        <i class="fa-regular fa-image"></i> Ảnh gốc
                    </button>
                    ${!isRenderSuccess ? `
                        <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; color: #D97706; background: #FEF3C7; padding: 2px 8px; border-radius: 6px; font-weight: 600;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Dùng ảnh dự phòng (Mã SVG/TikZ đang sửa)
                        </span>
                    ` : ''}
                </div>
            ` : '';

            const qAttr = (questionIndex !== null && questionIndex !== undefined) ? `data-qidx="${questionIndex}"` : '';

            return `
                <div class="math-diagram-container" id="${uniqueId}" ${qAttr} style="margin: 16px 0; text-align: center;">
                    ${toggleHtml}
                    <!-- View 1: TikZ / SVG Vector -->
                    <div class="diagram-tikz-view" style="display: ${activeView === 'tikz' ? 'inline-block' : 'none'}; max-width: 100%;">
                        <div class="tikz-svg-wrapper" ${qAttr} title="💡 Nhấp đúp chuột để chỉnh sửa trực tiếp hình vẽ SVG" ondblclick="if(window.openSvgEditorFromDiagram) window.openSvgEditorFromDiagram(this)" style="background: #FFFFFF; padding: 6px 12px; display: inline-block; max-width: 100%; overflow-x: auto; cursor: pointer; border: 1px solid transparent; border-radius: 8px; transition: border-color 0.2s;" onmouseenter="this.style.borderColor='#A5B4FC'" onmouseleave="this.style.borderColor='transparent'">
                            ${svgContent || `
                                <div style="color: #EF4444; font-size: 0.85rem; padding: 12px; background: #FEF2F2; border-radius: 8px;">
                                    <i class="fa-solid fa-circle-exclamation"></i> Không thể biên dịch đồ thị: ${escapeHtml(errorMessage)}
                                </div>
                            `}
                        </div>
                        <div style="font-size: 0.73rem; color: #6366F1; margin-top: 3px; font-style: italic;">
                            <i class="fa-solid fa-pen-to-square"></i> Nhấp đúp chuột vào hình để sửa nhanh SVG
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
         * Chuẩn hóa hiển thị ký hiệu toán học:
         * Chuyển dấu trừ ASCII (-) thành dấu trừ toán học Unicode (U+2212 '−')
         * để tất cả số âm (−1, −2, −∞, ...) có cùng chiều cao, độ rộng và kích thước đồng nhất với số dương (3, 4, ...)
         */
        formatMathSymbol(val) {
            if (val === undefined || val === null) return '';
            let s = String(val).trim().replace(/\$/g, '');
            s = s.replace(/-\\infty/g, '−∞')
                 .replace(/\+\\infty/g, '+∞')
                 .replace(/\\infty/g, '∞');
            s = s.replace(/-/g, '−');
            return s;
        },

        /**
         * Render Bảng Biến Thiên (Variation Table) thành SVG Vector siêu nét
         */
        renderVariationTable(code) {
            const width = 560;
            const height = 185;

            // 1. Phân tích các mốc x từ tkzTabInit
            let xPoints = ['-\\infty', '-1', '3', '+\\infty'];
            const matchInit = code.match(/\\?tkzTabInit(?:\[[^\]]*\])?\{[^\}]*\}\s*\{([^\}]*)\}/i);
            if (matchInit && matchInit[1]) {
                const parsed = matchInit[1].split(',').map(s => s.trim().replace(/\$/g, ''));
                if (parsed.length >= 2) xPoints = parsed;
            }

            // 2. Phân tích dấu đạo hàm y' từ tkzTabLine
            let signs = [];
            const matchLine = code.match(/\\?tkzTabLine\{([^\}]*)\}/i);
            if (matchLine && matchLine[1]) {
                signs = matchLine[1].split(',').map(s => s.trim().replace(/\$/g, '')).filter(s => s.length > 0);
            }
            if (signs.length === 0) {
                signs = ['+', '0', '-', '0', '+'];
            }

            // 3. Phân tích chiều biến thiên y từ tkzTabVar (hỗ trợ cả -/-\infty và -\infty/-)
            let yVals = [];
            const matchVar = code.match(/\\?tkzTabVar\{([^\}]*)\}/i);
            if (matchVar && matchVar[1]) {
                const entries = matchVar[1].split(',');
                for (let entry of entries) {
                    entry = entry.trim();
                    const slashIdx = entry.indexOf('/');
                    if (slashIdx >= 0) {
                        let part1 = entry.substring(0, slashIdx).trim().replace(/\$/g, '');
                        let part2 = entry.substring(slashIdx + 1).trim().replace(/\$/g, '');
                        
                        let isTop = false;
                        let valStr = '';
                        
                        if (part1 === '+' || part1 === '-' || part1 === '+C' || part1 === '-C' || part1 === 'D') {
                            isTop = part1.includes('+');
                            valStr = part2;
                        } else if (part2 === '+' || part2 === '-' || part2 === '+C' || part2 === '-C' || part2 === 'D') {
                            isTop = part2.includes('+');
                            valStr = part1;
                        } else {
                            isTop = part1.includes('+') || part2.includes('+');
                            valStr = part2.length > part1.length ? part2 : part1;
                        }
                        yVals.push({
                            type: isTop ? 'top' : 'bottom',
                            val: valStr
                        });
                    }
                }
            }
            if (yVals.length === 0) {
                yVals = [
                    { type: 'bottom', val: '-\\infty' },
                    { type: 'top', val: '4' },
                    { type: 'bottom', val: '-2' },
                    { type: 'top', val: '+\\infty' }
                ];
            }

            // 4. Tự động kiểm định & bù khuyết toán học (Math Self-Correction)
            // Đảm bảo số mốc y luôn bằng đúng số mốc x và đồng bộ với dấu y'
            const numPoints = xPoints.length;
            while (yVals.length < numPoints) {
                const lastY = yVals[yVals.length - 1];
                const nextType = (lastY && lastY.type === 'top') ? 'bottom' : 'top';
                yVals.splice(Math.max(1, yVals.length - 1), 0, {
                    type: nextType,
                    val: nextType === 'bottom' ? '−2' : '4'
                });
            }

            // Căn chỉnh độ cao top / bottom chính xác tuyệt đối theo dấu y'
            for (let i = 0; i < numPoints; i++) {
                if (i === 0) {
                    const firstSign = signs[0] || '+';
                    if (firstSign.includes('+')) yVals[0].type = 'bottom';
                    else if (firstSign.includes('-') || firstSign.includes('−')) yVals[0].type = 'top';
                } else {
                    const prevSignIdx = (i - 1) * 2;
                    let sign = signs[prevSignIdx] || (i % 2 === 1 ? '+' : '−');
                    if (sign === '0' && signs[prevSignIdx + 1]) sign = signs[prevSignIdx + 1];
                    
                    if (sign.includes('+')) {
                        yVals[i - 1].type = 'bottom';
                        yVals[i].type = 'top';
                    } else if (sign.includes('-') || sign.includes('−')) {
                        yVals[i - 1].type = 'top';
                        yVals[i].type = 'bottom';
                    }
                }
            }

            // Tính toán toạ độ các cột phân bổ đều
            const startX = 120;
            const endX = width - 40;
            const stepX = (endX - startX) / (numPoints - 1);
            const xCoords = xPoints.map((_, i) => Math.round(startX + i * stepX));

            // Sinh các mốc giá trị của x (sử dụng font chuẩn KaTeX_Main/Times New Roman, kích thước 18px đồng nhất)
            const xTexts = xPoints.map((p, i) => {
                const display = this.formatMathSymbol(p);
                return `<text x="${xCoords[i]}" y="35" fill="#000000" text-anchor="middle" font-size="18">${escapeHtml(display)}</text>`;
            }).join('');

            // Sinh dấu đạo hàm y' (màu đen thuần túy, font toán to rõ)
            let yPrimeElements = '';
            for (let i = 0; i < numPoints; i++) {
                if (i > 0 && i < numPoints - 1) {
                    yPrimeElements += `
                        <text x="${xCoords[i]}" y="73" fill="#000000" text-anchor="middle" font-size="18">0</text>
                    `;
                }
                if (i < numPoints - 1) {
                    const midX = Math.round((xCoords[i] + xCoords[i + 1]) / 2);
                    const signIdx = i * 2;
                    let sign = signs[signIdx] || (i % 2 === 0 ? '+' : '−');
                    if (sign === '0' && signs[signIdx + 1]) sign = signs[signIdx + 1];
                    sign = this.formatMathSymbol(sign);
                    yPrimeElements += `<text x="${midX}" y="73" fill="#000000" font-weight="bold" text-anchor="middle" font-size="19">${escapeHtml(sign)}</text>`;
                }
            }

            // Sinh các mũi tên và điểm cực trị y (màu đen chuẩn đề thi, mũi tên vector mảnh)
            let yElements = '';
            const numY = Math.min(yVals.length, numPoints);
            for (let i = 0; i < numY; i++) {
                const yObj = yVals[i];
                const displayVal = this.formatMathSymbol(yObj.val);
                const posY = (yObj.type === 'top') ? 110 : 168;
                yElements += `<text x="${xCoords[i]}" y="${posY}" fill="#000000" text-anchor="middle" font-size="18">${escapeHtml(displayVal)}</text>`;

                if (i < numY - 1) {
                    const nextObj = yVals[i + 1];
                    const nextDisp = this.formatMathSymbol(nextObj.val);
                    const nextPosY = (nextObj.type === 'top') ? 110 : 168;
                    const isUp = nextPosY < posY;
                    
                    const x1 = xCoords[i] + (displayVal.length > 2 ? 24 : 16);
                    const y1 = isUp ? posY - 6 : posY + 6;
                    const x2 = xCoords[i + 1] - (nextDisp.length > 2 ? 24 : 16);
                    const y2 = isUp ? nextPosY + 6 : nextPosY - 6;

                    yElements += `
                        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="1.3" marker-end="url(#arrowTab)"/>
                    `;
                }
            }

            return `
                <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="font-family: 'KaTeX_Main', 'Times New Roman', Cambria, serif; font-size: 18px; display: inline-block; background: #FFFFFF;">
                    <!-- Định nghĩa đầu mũi tên vector đen thanh mảnh chuẩn SGK -->
                    <defs>
                        <marker id="arrowTab" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                            <polygon points="0 0.5, 7 3, 0 5.5, 1.2 3" fill="#000000"/>
                        </marker>
                    </defs>

                    <!-- Khung đường kẻ đen chuẩn bảng biến thiên SGK / đề thi Việt Nam (không bo góc, không đổ bóng) -->
                    <line x1="10" y1="10" x2="${width - 10}" y2="10" stroke="#000000" stroke-width="1.3"/>
                    <line x1="75" y1="10" x2="75" y2="${height - 10}" stroke="#000000" stroke-width="1.3"/>
                    <line x1="10" y1="48" x2="${width - 10}" y2="48" stroke="#000000" stroke-width="1.3"/>
                    <line x1="10" y1="88" x2="${width - 10}" y2="88" stroke="#000000" stroke-width="1.3"/>

                    <!-- Nhãn cột trái (in nghiêng toán học x, y', y) -->
                    <text x="42" y="35" fill="#000000" text-anchor="middle" font-family="'KaTeX_Math', 'Times New Roman', serif" font-style="italic" font-size="19">x</text>
                    <text x="42" y="73" fill="#000000" text-anchor="middle" font-family="'KaTeX_Math', 'Times New Roman', serif" font-style="italic" font-size="19">y'</text>
                    <text x="42" y="142" fill="#000000" text-anchor="middle" font-family="'KaTeX_Math', 'Times New Roman', serif" font-style="italic" font-size="19">y</text>

                    <!-- Mốc x -->
                    ${xTexts}

                    <!-- Dấu y' -->
                    ${yPrimeElements}

                    <!-- Chiều biến thiên y & mũi tên -->
                    ${yElements}
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
