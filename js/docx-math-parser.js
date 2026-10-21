/**
 * docx-math-parser.js
 * Bộ giải mã file Word (.docx) chuyên dụng cho đề thi Toán học - Toán Smart
 * Hỗ trợ:
 * - Trích xuất ảnh sơ đồ, đồ thị nhúng trong file (.png, .jpg, .jpeg, .gif, .wmf)
 * - Chuyển đổi Equation Office Math (OMML) sang KaTeX LaTeX (\frac, \sqrt, \int, \vec, ...)
 * - Nhận diện định dạng gạch chân <u> để xác định đáp án đúng
 * - Nhận diện ký tự '#' để cố định vị trí phương án khi xáo trộn đề
 * - Phân loại 3 dạng câu hỏi chuẩn Bộ GD&ĐT:
 *   1. multiple_choice (Trắc nghiệm 4 lựa chọn)
 *   2. true_false (Trắc nghiệm Đúng/Sai 4 ý a, b, c, d)
 *   3. short_answer (Trắc nghiệm trả lời ngắn [[đáp án]])
 * - Nhận diện mức độ nhận thức: [NB], [TH], [VD], [VDC] (mặc định NB)
 * - Hỗ trợ trường Dạng bài / Chuyên đề (skill_tag)
 */

(function (global) {
    'use strict';

    const DocxMathParser = {};

    // 1. CHUYỂN ĐỔI OFFICE MATH (OMML) SANG LATEX
    function ommlToLatex(node) {
        if (!node) return '';
        let result = '';
        const children = node.childNodes;

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.nodeType === 3) { // Text node
                result += child.nodeValue;
                continue;
            }
            if (child.nodeType !== 1) continue;

            const localName = child.localName || child.nodeName.split(':').pop();

            switch (localName) {
                case 'f': { // Phân số
                    const num = findSubNode(child, 'num');
                    const den = findSubNode(child, 'den');
                    result += `\\frac{${ommlToLatex(num)}}{${ommlToLatex(den)}}`;
                    break;
                }
                case 'rad': { // Căn thức
                    const deg = findSubNode(child, 'deg');
                    const e = findSubNode(child, 'e');
                    const degText = ommlToLatex(deg).trim();
                    if (degText) {
                        result += `\\sqrt[${degText}]{${ommlToLatex(e)}}`;
                    } else {
                        result += `\\sqrt{${ommlToLatex(e)}}`;
                    }
                    break;
                }
                case 'sSup': { // Số mũ
                    const e = findSubNode(child, 'e');
                    const sup = findSubNode(child, 'sup');
                    result += `{${ommlToLatex(e)}}^{${ommlToLatex(sup)}}`;
                    break;
                }
                case 'sSub': { // Chỉ số dưới
                    const e = findSubNode(child, 'e');
                    const sub = findSubNode(child, 'sub');
                    result += `{${ommlToLatex(e)}}_{${ommlToLatex(sub)}}`;
                    break;
                }
                case 'sSubSup': { // Chỉ số trên và dưới đồng thời
                    const e = findSubNode(child, 'e');
                    const sub = findSubNode(child, 'sub');
                    const sup = findSubNode(child, 'sup');
                    result += `{${ommlToLatex(e)}}_{${ommlToLatex(sub)}}^{${ommlToLatex(sup)}}`;
                    break;
                }
                case 'd': { // Dấu ngoặc, dấu trị tuyệt đối, ngoặc nhọn
                    const dPr = findSubNode(child, 'dPr');
                    let begChr = '(';
                    let endChr = ')';
                    if (dPr) {
                        const begNode = findSubNode(dPr, 'begChr');
                        if (begNode) begChr = begNode.getAttribute('m:val') || begNode.getAttribute('val') || '(';
                        const endNode = findSubNode(dPr, 'endChr');
                        if (endNode) endChr = endNode.getAttribute('m:val') || endNode.getAttribute('val') || ')';
                    }
                    let leftDelim = begChr;
                    let rightDelim = endChr;
                    if (begChr === '{') leftDelim = '\\{';
                    if (endChr === '}') rightDelim = '\\}';
                    if (!begChr) leftDelim = '.';
                    if (!endChr) rightDelim = '.';

                    const eNodes = getSubNodes(child, 'e');
                    const inner = eNodes.map(en => ommlToLatex(en)).join('; ');
                    result += `\\left${leftDelim} ${inner} \\right${rightDelim}`;
                    break;
                }
                case 'nary': { // Tích phân, Tổng sigma
                    const naryPr = findSubNode(child, 'naryPr');
                    let chr = '∫';
                    if (naryPr) {
                        const chrNode = findSubNode(naryPr, 'chr');
                        if (chrNode) chr = chrNode.getAttribute('m:val') || chrNode.getAttribute('val') || '∫';
                    }
                    const sub = findSubNode(child, 'sub');
                    const sup = findSubNode(child, 'sup');
                    const e = findSubNode(child, 'e');

                    let op = '\\int';
                    if (chr === '∑' || chr === 'Σ') op = '\\sum';
                    else if (chr === '∏' || chr === 'Π') op = '\\prod';

                    const subText = ommlToLatex(sub).trim();
                    const supText = ommlToLatex(sup).trim();
                    let opFull = op;
                    if (subText) opFull += `_{${subText}}`;
                    if (supText) opFull += `^{${supText}}`;
                    result += `${opFull} {${ommlToLatex(e)}}`;
                    break;
                }
                case 'limLow': { // Giới hạn lim
                    const lim = findSubNode(child, 'lim');
                    const e = findSubNode(child, 'e');
                    result += `\\lim_{${ommlToLatex(lim)}} {${ommlToLatex(e)}}`;
                    break;
                }
                case 'acc': { // Vectơ, mũ, gạch đầu
                    const accPr = findSubNode(child, 'accPr');
                    let chr = '→';
                    if (accPr) {
                        const chrNode = findSubNode(accPr, 'chr');
                        if (chrNode) chr = chrNode.getAttribute('m:val') || chrNode.getAttribute('val') || '→';
                    }
                    const e = findSubNode(child, 'e');
                    if (chr === '→' || chr === '⃗') {
                        result += `\\vec{${ommlToLatex(e)}}`;
                    } else if (chr === '^' || chr === '̂') {
                        result += `\\hat{${ommlToLatex(e)}}`;
                    } else if (chr === '¯' || chr === '̄') {
                        result += `\\overline{${ommlToLatex(e)}}`;
                    } else {
                        result += `\\vec{${ommlToLatex(e)}}`;
                    }
                    break;
                }
                case 'bar': { // Gạch ngang trên đầu
                    const e = findSubNode(child, 'e');
                    result += `\\overline{${ommlToLatex(e)}}`;
                    break;
                }
                case 'box':
                case 'e':
                case 'num':
                case 'den':
                case 'sup':
                case 'sub':
                case 'lim':
                case 'r': {
                    result += ommlToLatex(child);
                    break;
                }
                case 't': { // Text trong công thức
                    let text = child.textContent || '';
                    text = text.replace(/≤/g, ' \\le ')
                               .replace(/≥/g, ' \\ge ')
                               .replace(/≠/g, ' \\ne ')
                               .replace(/±/g, ' \\pm ')
                               .replace(/∈/g, ' \\in ')
                               .replace(/∉/g, ' \\notin ')
                               .replace(/⊂/g, ' \\subset ')
                               .replace(/∪/g, ' \\cup ')
                               .replace(/∩/g, ' \\cap ')
                               .replace(/∞/g, ' \\infty ')
                               .replace(/→/g, ' \\to ')
                               .replace(/⇒/g, ' \\Rightarrow ')
                               .replace(/⇔/g, ' \\Leftrightarrow ')
                               .replace(/⊥/g, ' \\perp ')
                               .replace(/[Δ∆]/g, ' \\Delta ')
                               .replace(/π/g, ' \\pi ')
                               .replace(/α/g, ' \\alpha ')
                               .replace(/β/g, ' \\beta ')
                               .replace(/γ/g, ' \\gamma ')
                               .replace(/θ/g, ' \\theta ')
                               .replace(/λ/g, ' \\lambda ')
                               .replace(/[•·]/g, ' \\cdot ')
                               .replace(/×/g, ' \\times ');
                    result += text;
                    break;
                }
                default: {
                    result += ommlToLatex(child);
                    break;
                }
            }
        }
        return result;
    }

    function findSubNode(parent, name) {
        if (!parent) return null;
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i];
            if (child.nodeType === 1) {
                const local = child.localName || child.nodeName.split(':').pop();
                if (local === name) return child;
            }
        }
        return null;
    }

    function getSubNodes(parent, name) {
        if (!parent) return [];
        const res = [];
        for (let i = 0; i < parent.childNodes.length; i++) {
            const child = parent.childNodes[i];
            if (child.nodeType === 1) {
                const local = child.localName || child.nodeName.split(':').pop();
                if (local === name) res.push(child);
            }
        }
        return res;
    }

    // 2. PARSE FILE .DOCX BẰNG JSZip
    DocxMathParser.parseFile = async function (file) {
        if (!window.JSZip) {
            throw new Error("Thư viện JSZip chưa được tải. Vui lòng kiểm tra kết nối mạng hoặc CDN JSZip.");
        }

        const zip = await JSZip.loadAsync(file);

        // Đọc relationships để map rId -> ảnh trong word/media/
        const relsMap = {};
        const relsFile = zip.file("word/_rels/document.xml.rels");
        if (relsFile) {
            const relsXmlText = await relsFile.async("text");
            const parser = new DOMParser();
            const relsDoc = parser.parseFromString(relsXmlText, "text/xml");
            const relNodes = relsDoc.getElementsByTagName("Relationship");
            for (let i = 0; i < relNodes.length; i++) {
                const rId = relNodes[i].getAttribute("Id");
                const target = relNodes[i].getAttribute("Target");
                relsMap[rId] = target;
            }
        }

        // Tải các ảnh media trong file zip và chuyển thành base64 Data URL
        const imageMap = {};
        for (const rId in relsMap) {
            const target = relsMap[rId];
            if (target && target.startsWith("media/")) {
                const fullPath = "word/" + target;
                const imgFile = zip.file(fullPath);
                if (imgFile) {
                    const ext = target.split('.').pop().toLowerCase();
                    let mime = "image/png";
                    if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
                    else if (ext === "gif") mime = "image/gif";
                    else if (ext === "svg") mime = "image/svg+xml";

                    const base64 = await imgFile.async("base64");
                    imageMap[rId] = `data:${mime};base64,${base64}`;
                }
            }
        }

        // Đọc document.xml
        const docFile = zip.file("word/document.xml");
        if (!docFile) {
            throw new Error("File Word không hợp lệ hoặc không tìm thấy word/document.xml.");
        }

        const docXmlText = await docFile.async("text");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(docXmlText, "text/xml");

        // Duyệt toàn bộ khối văn bản trong body
        const bodyNode = xmlDoc.getElementsByTagName("w:body")[0] || xmlDoc.querySelector("body");
        if (!bodyNode) {
            throw new Error("Không tìm thấy nội dung văn bản (w:body) trong file Word.");
        }

        const htmlBlocks = [];
        for (let i = 0; i < bodyNode.childNodes.length; i++) {
            const node = bodyNode.childNodes[i];
            if (node.nodeType !== 1) continue;
            const nodeName = node.localName || node.nodeName.split(':').pop();

            if (nodeName === 'p') {
                const pHTML = parseParagraph(node, imageMap);
                if (pHTML && pHTML.trim()) {
                    htmlBlocks.push(pHTML.trim());
                }
            } else if (nodeName === 'tbl') {
                const tblHTML = parseTable(node, imageMap);
                if (tblHTML) {
                    htmlBlocks.push(tblHTML);
                }
            }
        }

        // Phân tích danh sách các khối HTML thành danh sách câu hỏi cấu trúc 3 phần
        return parseHtmlBlocksToQuestions(htmlBlocks);
    };

    // 3. PARSE PARAGRAPH <w:p>
    function parseParagraph(pNode, imageMap) {
        let pHtml = '';

        for (let i = 0; i < pNode.childNodes.length; i++) {
            const child = pNode.childNodes[i];
            if (child.nodeType !== 1) continue;
            const localName = child.localName || child.nodeName.split(':').pop();

            if (localName === 'r') { // Text run
                const rHtml = parseRun(child, imageMap);
                pHtml += rHtml;
            } else if (localName === 'oMath' || localName === 'oMathPara') { // Word Equation
                const latex = ommlToLatex(child).trim();
                if (latex) {
                    pHtml += ` $${latex}$ `;
                }
            } else if (localName === 'hyperlink') { // Liên kết
                for (let j = 0; j < child.childNodes.length; j++) {
                    const hChild = child.childNodes[j];
                    if (hChild.nodeType === 1 && (hChild.localName || hChild.nodeName.split(':').pop()) === 'r') {
                        pHtml += parseRun(hChild, imageMap);
                    }
                }
            } else if (localName === 'drawing' || localName === 'pict') { // Ảnh ngoài run
                pHtml += extractImageFromNode(child, imageMap);
            }
        }

        return pHtml;
    }

    // 4. PARSE RUN <w:r> (Xử lý chữ gạch chân và ảnh)
    function parseRun(rNode, imageMap) {
        let rHtml = '';
        let isUnderlined = false;

        const rPr = findSubNode(rNode, 'rPr');
        if (rPr) {
            const uNode = findSubNode(rPr, 'u');
            if (uNode) {
                const uVal = uNode.getAttribute('w:val') || uNode.getAttribute('val');
                if (uVal !== 'none') {
                    isUnderlined = true;
                }
            }
        }

        for (let i = 0; i < rNode.childNodes.length; i++) {
            const child = rNode.childNodes[i];
            if (child.nodeType !== 1) continue;
            const local = child.localName || child.nodeName.split(':').pop();

            if (local === 't') { // Chữ bình thường
                rHtml += child.textContent;
            } else if (local === 'tab') {
                rHtml += '\t';
            } else if (local === 'br') {
                rHtml += '<br/>';
            } else if (local === 'drawing' || local === 'pict') { // Ảnh nhúng trong run
                rHtml += extractImageFromNode(child, imageMap);
            }
        }

        if (isUnderlined && rHtml.trim()) {
            return `<u>${rHtml}</u>`;
        }
        return rHtml;
    }

    // 5. TRÍCH XUẤT ẢNH TỪ DRAWING HOẶC PICT
    function extractImageFromNode(node, imageMap) {
        // Tìm thẻ a:blip hoặc v:imagedata
        const blipNodes = node.getElementsByTagNameNS ? node.getElementsByTagNameNS('*', 'blip') : node.querySelectorAll('blip');
        if (blipNodes && blipNodes.length > 0) {
            for (let i = 0; i < blipNodes.length; i++) {
                const rEmbed = blipNodes[i].getAttribute('r:embed') || blipNodes[i].getAttribute('embed');
                if (rEmbed && imageMap[rEmbed]) {
                    return `<img src="${imageMap[rEmbed]}" class="q-inline-img" style="max-width: 100%; max-height: 380px; display: block; margin: 12px auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">`;
                }
            }
        }

        const vImgNodes = node.getElementsByTagNameNS ? node.getElementsByTagNameNS('*', 'imagedata') : node.querySelectorAll('imagedata');
        if (vImgNodes && vImgNodes.length > 0) {
            for (let i = 0; i < vImgNodes.length; i++) {
                const rId = vImgNodes[i].getAttribute('r:id') || vImgNodes[i].getAttribute('id');
                if (rId && imageMap[rId]) {
                    return `<img src="${imageMap[rId]}" class="q-inline-img" style="max-width: 100%; max-height: 380px; display: block; margin: 12px auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">`;
                }
            }
        }
        return '';
    }

    // 6. PARSE BẢNG BIỂU <w:tbl> SANG HTML TABLE
    function parseTable(tblNode, imageMap) {
        let tableHTML = '<table class="q-inline-table" style="border-collapse: collapse; margin: 14px auto; border: 1.5px solid #CBD5E1; text-align: center; font-size: 0.9rem; width: auto; max-width: 100%;">';
        const trNodes = getSubNodes(tblNode, 'tr');
        trNodes.forEach(tr => {
            tableHTML += '<tr>';
            const tcNodes = getSubNodes(tr, 'tc');
            tcNodes.forEach(tc => {
                let cellContent = '';
                const pNodes = getSubNodes(tc, 'p');
                pNodes.forEach(p => {
                    cellContent += parseParagraph(p, imageMap) + ' ';
                });
                tableHTML += `<td style="border: 1px solid #CBD5E1; padding: 6px 14px; background: #FFFFFF;">${cellContent.trim()}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</table>';
        return tableHTML;
    }

    // 7. PHÂN TÍCH CÁC KHỐI HTML THÀNH DANH SÁCH CÂU HỎI
    function parseHtmlBlocksToQuestions(blocks) {
        let currentSection = 'multiple_choice';
        const questions = [];
        let currentQ = null;

        for (let i = 0; i < blocks.length; i++) {
            const rawBlock = blocks[i];
            const cleanText = rawBlock.replace(/<[^>]*>/g, '').trim();

            // 7.1 Kiểm tra tiêu đề phân đoạn (Phần 1, Phần 2, Phần 3)
            if (/Phần\s*(1|I)\b|Trắc\s*nghiệm\s*nhiều\s*lựa\s*chọn/i.test(cleanText)) {
                currentSection = 'multiple_choice';
                continue;
            }
            if (/Phần\s*(2|II)\b|Trắc\s*nghiệm\s*đúng\s*[\/\-]?\s*sai/i.test(cleanText)) {
                currentSection = 'true_false';
                continue;
            }
            if (/Phần\s*(3|III)\b|Trắc\s*nghiệm\s*trả\s*lời\s*ngắn/i.test(cleanText)) {
                currentSection = 'short_answer';
                continue;
            }

            // 7.2 Kiểm tra bắt đầu câu hỏi mới: "Câu X.", "Câu X:", "Câu X -"
            const qHeaderMatch = rawBlock.match(/^(?:<[^>]+>)*\s*Câu\s*(\d+)[\.\:\-]\s*([\s\S]*)/i);
            if (qHeaderMatch) {
                if (currentQ) {
                    finalizeQuestion(currentQ);
                    questions.push(currentQ);
                }

                let remainingHTML = qHeaderMatch[2].replace(/^(?:<\/[^>]+>\s*)+/, '').trim();
                let diff = 'NB';
                let skillTag = '';

                // Bóc tách nhãn độ khó [NB], [TH], [VD], [VDC]
                const diffMatch = remainingHTML.match(/\[(NB|TH|VD|VDC)\]/i);
                if (diffMatch) {
                    diff = diffMatch[1].toUpperCase();
                    remainingHTML = remainingHTML.replace(diffMatch[0], '').trim();
                }

                // Bóc tách nhãn Dạng bài / Chuyên đề nếu có: [Dạng: ...] hoặc [Chuyên đề: ...]
                const skillMatch = remainingHTML.match(/\[(?:Dạng|Chuyên đề|Kỹ năng)\s*[\:\=]\s*([^\]]+)\]/i);
                if (skillMatch) {
                    skillTag = skillMatch[1].trim();
                    remainingHTML = remainingHTML.replace(skillMatch[0], '').trim();
                }

                currentQ = {
                    number: parseInt(qHeaderMatch[1]),
                    type: currentSection,
                    difficulty: diff,
                    skill_tag: skillTag,
                    contentBlocks: remainingHTML ? [remainingHTML] : [],
                    rawOptionsText: '',
                    options: [],
                    correct_option: null, // multiple_choice index 0..3
                    sub_items: [], // true_false items [{ label, text, is_correct, is_pinned }]
                    short_answer: '', // short_answer string
                    explanation: '',
                    is_pinned: false
                };
                continue;
            }

            if (!currentQ) continue;

            // 7.3 Kiểm tra nếu khối này chứa lời giải chi tiết
            if (/(?:Lời\s*giải|Hướng\s*dẫn\s*giải|HDG)[\s\:]/i.test(cleanText)) {
                const expClean = rawBlock.replace(/(?:<b>|<strong>)?(?:Lời\s*giải|Hướng\s*dẫn\s*giải|HDG)[\s\:]*(?:<\/b>|<\/strong>)?/i, '').trim();
                currentQ.explanation = (currentQ.explanation ? currentQ.explanation + '<br/>' : '') + expClean;
                continue;
            }

            // Nếu câu hỏi đã phát hiện lời giải thì gom các khối sau vào lời giải
            if (currentQ.explanation) {
                currentQ.explanation += '<br/>' + rawBlock;
                continue;
            }

            // 7.4 Tích lũy các khối nội dung của câu hỏi
            currentQ.contentBlocks.push(rawBlock);
        }

        if (currentQ) {
            finalizeQuestion(currentQ);
            questions.push(currentQ);
        }

        // Thống kê tổng hợp kết quả
        const stats = {
            total: questions.length,
            multiple_choice: questions.filter(q => q.type === 'multiple_choice').length,
            true_false: questions.filter(q => q.type === 'true_false').length,
            short_answer: questions.filter(q => q.type === 'short_answer').length
        };

        return {
            questions: questions,
            stats: stats
        };
    }

    // 8. HOÀN THIỆN & PHÂN TÁCH PHƯƠNG ÁN / ĐÁP ÁN CHO TỪNG CÂU HỎI
    function finalizeQuestion(q) {
        const fullContent = q.contentBlocks.join('\n');

        if (q.type === 'multiple_choice') {
            // Tách các phương án A, B, C, D
            const optResult = extractMultipleChoiceOptions(fullContent);
            if (optResult && optResult.options.length >= 2) {
                q.question_text = optResult.questionText.trim();
                q.options = optResult.options.map(o => o.text);
                q.options_meta = optResult.options;
                
                // Xác định đáp án đúng (từ thẻ <u>)
                const correctIdx = optResult.options.findIndex(o => o.is_correct);
                q.correct_option = correctIdx !== -1 ? correctIdx : 0;
            } else {
                q.question_text = fullContent.trim();
                q.options = ["Phương án A", "Phương án B", "Phương án C", "Phương án D"];
                q.correct_option = 0;
            }
        } else if (q.type === 'true_false') {
            // Tách 4 ý a), b), c), d)
            const tfResult = extractTrueFalseItems(fullContent);
            if (tfResult && tfResult.items.length >= 2) {
                q.question_text = tfResult.questionText.trim();
                q.sub_items = tfResult.items;
                q.options = tfResult.items.map(it => it.text);
                q.correct_option = null;
            } else {
                q.question_text = fullContent.trim();
                q.sub_items = [];
            }
        } else if (q.type === 'short_answer') {
            // Nhận diện đáp án ngắn trong [[...]]
            const ansMatch = fullContent.match(/\[\[(.*?)\]\]/);
            if (ansMatch) {
                q.short_answer = ansMatch[1].trim();
                // Xóa cụm "Trả lời: [[...]]" hoặc "Đáp án: [[...]]" ra khỏi đề bài
                q.question_text = fullContent.replace(/(?:Trả\s*lời|Đáp\s*án)?\s*[\:\=]?\s*\[\[.*?\]\]/gi, '').trim();
            } else {
                q.question_text = fullContent.trim();
                q.short_answer = '';
            }
            q.options = [];
            q.correct_option = q.short_answer;
        }

        // Chuẩn hóa và làm sạch KaTeX / LaTeX inline
        q.question_text = formatMathText(q.question_text);
        if (q.options) {
            q.options = q.options.map(opt => formatMathText(opt));
        }
        if (q.sub_items) {
            q.sub_items.forEach(it => {
                it.text = formatMathText(it.text);
            });
        }
        if (q.explanation) {
            q.explanation = formatMathText(q.explanation);
        }
    }

    // 9. BÓC TÁCH PHƯƠNG ÁN TRẮC NGHIỆM (A, B, C, D)
    function extractMultipleChoiceOptions(text) {
        const markerRegex = /(?:^|[\r\n\t]|\s{2,}|<br\s*\/?>|\s(?=#?<?u?[^>]*>?[A-D]\s*(?:<\/u>)?\s*[\.\:\)]))\s*(#?)\s*(<u[^>]*>)?\s*([A-D])\s*(?:<\/u>)?\s*[\.\:\)]\s*(?:<\/u>)?\s*/gi;
        let match;
        const markers = [];
        while ((match = markerRegex.exec(text)) !== null) {
            markers.push({
                index: match.index,
                length: match[0].length,
                isPinned: match[1] === '#' || match[0].includes('#'),
                hasUnderline: !!match[2] || match[0].includes('<u'),
                letter: match[3].toUpperCase()
            });
        }

        if (markers.length < 2) return null;

        const questionText = text.substring(0, markers[0].index);
        const options = [];

        for (let i = 0; i < markers.length; i++) {
            const cur = markers[i];
            const next = markers[i + 1];
            const start = cur.index + cur.length;
            const end = next ? next.index : text.length;
            let optText = text.substring(start, end).trim();

            let isCorrect = cur.hasUnderline || /<u[^>]*>/i.test(optText);
            optText = optText.replace(/<\/?u[^>]*>/gi, '').trim();

            let isPinned = cur.isPinned;
            if (optText.startsWith('#')) {
                isPinned = true;
                optText = optText.substring(1).trim();
            }

            options.push({
                letter: cur.letter,
                text: optText,
                is_correct: isCorrect,
                is_pinned: isPinned
            });
        }

        return {
            questionText: questionText,
            options: options
        };
    }

    // 10. BÓC TÁCH MỆNH ĐỀ ĐÚNG/SAI (a, b, c, d)
    function extractTrueFalseItems(text) {
        const markerRegex = /(?:^|[\r\n\t]|\s{2,}|<br\s*\/?>|\s(?=#?<?u?[^>]*>?[a-d]\s*(?:<\/u>)?\s*[\)\.\:]))\s*(#?)\s*(<u[^>]*>)?\s*([a-d])\s*(?:<\/u>)?\s*[\)\.\:]\s*(?:<\/u>)?\s*(#?)\s*/gi;
        let match;
        const markers = [];
        while ((match = markerRegex.exec(text)) !== null) {
            markers.push({
                index: match.index,
                length: match[0].length,
                isPinned: match[1] === '#' || match[4] === '#' || match[0].includes('#'),
                hasUnderline: !!match[2] || match[0].includes('<u'),
                letter: match[3].toLowerCase()
            });
        }

        if (markers.length < 2) return null;

        const questionText = text.substring(0, markers[0].index);
        const items = [];

        for (let i = 0; i < markers.length; i++) {
            const cur = markers[i];
            const next = markers[i + 1];
            const start = cur.index + cur.length;
            const end = next ? next.index : text.length;
            let itemText = text.substring(start, end).trim();

            let isCorrect = cur.hasUnderline || /<u[^>]*>/i.test(itemText);
            if (/\[(Đ|Đúng)\]/i.test(itemText)) {
                isCorrect = true;
                itemText = itemText.replace(/\[(Đ|Đúng)\]/gi, '').trim();
            } else if (/\[(S|Sai)\]/i.test(itemText)) {
                isCorrect = false;
                itemText = itemText.replace(/\[(S|Sai)\]/gi, '').trim();
            }

            itemText = itemText.replace(/<\/?u[^>]*>/gi, '').trim();

            let isPinned = cur.isPinned;
            if (itemText.startsWith('#')) {
                isPinned = true;
                itemText = itemText.substring(1).trim();
            }

            items.push({
                label: cur.letter,
                text: itemText,
                is_correct: isCorrect,
                is_pinned: isPinned
            });
        }

        return {
            questionText: questionText,
            items: items
        };
    }

    // 11. CHUẨN HÓA KÝ HIỆU TOÁN & LATEX
    function formatMathText(str) {
        if (!str) return '';
        // Chuẩn hóa khoảng trắng và gộp các thẻ span rỗng
        let s = str.replace(/&nbsp;/g, ' ');
        // Chuẩn hóa dấu phẩy trong số thập phân và các khoảng toán nếu cần
        return s.trim();
    }

    // 12. CHUẨN HÓA ĐÁP ÁN TRẢ LỜI NGẮN (Hỗ trợ cả dấu chấm '.' và phẩy ',')
    DocxMathParser.normalizeShortAnswer = function (ans) {
        if (ans === undefined || ans === null) return '';
        let s = String(ans).trim();
        // Thay thế dấu chấm thành dấu phẩy chuẩn của Việt Nam để đối sánh
        s = s.replace(/\s+/g, '');
        return s;
    };

    DocxMathParser.isShortAnswerMatch = function (userInput, expectedKey) {
        const u = DocxMathParser.normalizeShortAnswer(userInput).replace(/\./g, ',');
        const e = DocxMathParser.normalizeShortAnswer(expectedKey).replace(/\./g, ',');
        return u === e;
    };

    // Xuất ra toàn cục
    global.DocxMathParser = DocxMathParser;

})(typeof window !== 'undefined' ? window : this);
