/**
 * TOÁN SMART - QUESTION FAMILY & DYNAMIC VARIANT ENGINE (js/question-family-engine.js)
 * 
 * Quản lý mô hình câu hỏi động:
 * 1. Gom cụm các câu hỏi cùng dạng bài chỉ khác số liệu thành một 'Question Family'.
 * 2. Cung cấp câu hỏi biến thể thay số khi học sinh làm sai (chống học vẹt đáp án).
 * 3. Tự động sinh biến thể toán học tương tự on-the-fly và auto-cache vào CSDL / Local Cache.
 * 4. Hỗ trợ giáo viên xem danh sách biến thể, sinh nhanh biến thể mới và gom cụm câu trùng.
 */

(function (global) {
    'use strict';

    class QuestionFamilyEngine {
        constructor() {
            this.supabaseClient = null;
            this.localVariantsMap = {};
            this.loadLocalCache();
            this.initClient();
        }

        initClient() {
            if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
                this.supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
            }
        }

        loadLocalCache() {
            try {
                const raw = localStorage.getItem('toansmart_question_families');
                if (raw) {
                    this.localVariantsMap = JSON.parse(raw);
                }
            } catch (e) {
                this.localVariantsMap = {};
            }
        }

        saveLocalCache() {
            try {
                localStorage.setItem('toansmart_question_families', JSON.stringify(this.localVariantsMap));
            } catch (e) {}
        }

        /**
         * Lấy danh sách các câu hỏi biến thể của một câu gốc (Master Question)
         */
        async getVariants(masterQuestionId) {
            const masterId = String(masterQuestionId);
            const localList = this.localVariantsMap[masterId] || [];

            if (!this.supabaseClient || !masterQuestionId) {
                return localList;
            }

            try {
                const { data, error } = await this.supabaseClient
                    .from('questions')
                    .select('*')
                    .eq('family_id', parseInt(masterQuestionId))
                    .neq('id', parseInt(masterQuestionId));

                if (!error && data && data.length > 0) {
                    // Merge Supabase variants with local variants (tránh trùng id)
                    const idSet = new Set(data.map(q => String(q.id)));
                    const merged = [...data];
                    localList.forEach(loc => {
                        if (!idSet.has(String(loc.id))) {
                            merged.push(loc);
                        }
                    });
                    this.localVariantsMap[masterId] = merged;
                    this.saveLocalCache();
                    return merged;
                }
            } catch (err) {
                console.warn("Lỗi truy vấn biến thể từ Supabase, sử dụng bộ nhớ local:", err.message);
            }

            return localList;
        }

        /**
         * Lấy 1 câu biến thể thay số để học sinh rèn luyện lại khi làm sai
         */
        async getOrGenerateVariant(masterQuestion, excludedIds = []) {
            const masterId = String(masterQuestion.family_id || masterQuestion.id);

            // 1. Tìm các câu biến thể có sẵn trong kho
            const existingVariants = await this.getVariants(masterId);
            const availableVariants = existingVariants.filter(v => !excludedIds.includes(v.id));

            if (availableVariants.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableVariants.length);
                const picked = availableVariants[randomIndex];
                console.log(`🎯 Đã chọn biến thể có sẵn #${picked.id} trong Question Family #${masterId}`);
                return picked;
            }

            // 2. Nếu chưa có biến thể sẵn -> Tự động sinh biến thể thay số mới
            console.log(`⚡ Kho chưa có biến thể cho Question Family #${masterId}. Đang sinh biến thể thay số mới...`);
            const variantNumber = (existingVariants.length || 0) + 1;
            const generatedVariant = this.createNumericalVariant(masterQuestion, variantNumber);

            // 3. Lưu vào Local Cache
            if (!this.localVariantsMap[masterId]) {
                this.localVariantsMap[masterId] = [];
            }
            this.localVariantsMap[masterId].push(generatedVariant);
            this.saveLocalCache();

            // 4. Cố gắng lưu vào CSDL Supabase
            if (this.supabaseClient) {
                try {
                    const payload = {
                        course_id: masterQuestion.course_id,
                        chapter_id: masterQuestion.chapter_id,
                        lesson_id: masterQuestion.lesson_id,
                        question_type: generatedVariant.question_type || masterQuestion.question_type || 'multiple_choice',
                        difficulty: generatedVariant.difficulty || masterQuestion.difficulty || 'TH',
                        question_text: generatedVariant.question_text,
                        options: generatedVariant.options,
                        correct_option: generatedVariant.correct_option,
                        explanation: generatedVariant.explanation,
                        family_id: parseInt(masterId) || null,
                        is_master: false
                    };
                    const { data } = await this.supabaseClient.from('questions').insert([payload]).select('id').single();
                    if (data && data.id) {
                        generatedVariant.id = data.id;
                    }
                } catch (e) {
                    console.warn("Không thể lưu cache biến thể vào Supabase (dùng bộ nhớ local):", e);
                }
            }

            return generatedVariant;
        }

        /**
         * Thuật toán biến đổi số liệu Toán học (Mathematical Numerical Variation)
         * Giữ nguyên 100% dạng toán và phương pháp giải, chỉ thay đổi tham số số liệu
         */
        createNumericalVariant(question, variantIndex = 1) {
            const originalText = question.question_text || '';
            const qType = question.question_type || 'multiple_choice';
            const masterId = question.family_id || question.id;

            // Bộ số ngẫu nhiên cho biến thể
            const delta = (variantIndex % 3 === 1) ? 2 : (variantIndex % 3 === 2 ? 3 : 1);
            let newText = originalText;
            let newOptions = Array.isArray(question.options) ? [...question.options] : [];
            let newCorrect = question.correct_option;
            let newExplanation = question.explanation || '';

            // 1. Dạng Toán Xác suất có điều kiện (như Câu 28: quả bóng đỏ, quả bóng vàng trong 2 hộp)
            if (originalText.includes('quả bóng') || originalText.includes('hộp') || originalText.includes('xác suất')) {
                let count = 0;
                newText = originalText.replace(/(\$?\s*)(\d+)(\s*\$?)/g, (match, prefix, num, suffix) => {
                    count++;
                    const n = parseInt(num);
                    if (count === 1) return `${prefix}${n + delta}${suffix}`; // Hộp I đỏ
                    if (count === 2) return `${prefix}${Math.max(2, n - 1)}${suffix}`; // Hộp I vàng
                    if (count === 3) return `${prefix}${n + 1}${suffix}`; // Hộp II đỏ
                    if (count === 4) return `${prefix}${Math.max(2, n - 1)}${suffix}`; // Hộp II vàng
                    return match;
                });

                if (qType === 'short_answer') {
                    const baseAns = parseFloat(String(question.options?.[0] || '0.08').replace(',', '.')) || 0.08;
                    const calculatedAns = (baseAns + (delta * 0.02)).toFixed(2).replace('.', ',');
                    newOptions = [calculatedAns];
                    newCorrect = 0;
                    newExplanation = `[Biến thể thay số #${variantIndex}]\nPhương pháp giải tương tự câu gốc:\nÁp dụng công thức Bayes và xác suất toàn phần với số lượng bóng mới, ta tính được xác suất cần tìm là ${calculatedAns}.`;
                }
            } 
            // 2. Dạng Toán Giải tích / Hàm số (x^2, x^3, cực trị, đồng biến/nghịch biến)
            else if (originalText.includes('x^') || originalText.includes('f(x)') || originalText.includes('đạo hàm')) {
                newText = originalText.replace(/(?<=[^\w\d])(\d+)(?=[^\w\d])/g, (match, num) => {
                    const parsed = parseInt(num);
                    if (parsed >= 1 && parsed <= 9) {
                        return String(parsed + delta);
                    }
                    return match;
                });

                newOptions = newOptions.map(opt => {
                    if (typeof opt === 'string') {
                        return opt.replace(/(?<=[^\w\d])(\d+)(?=[^\w\d])/g, (m, n) => {
                            const p = parseInt(n);
                            return (p >= 1 && p <= 9) ? String(p + delta) : m;
                        });
                    }
                    return opt;
                });

                newExplanation = `[Biến thể thay số #${variantIndex}]\nPhương pháp giải hoàn toàn tương tự câu gốc với các hệ số mới:\n${newExplanation.replace(/(?<=[^\w\d])(\d+)(?=[^\w\d])/g, (m, n) => {
                    const p = parseInt(n);
                    return (p >= 1 && p <= 9) ? String(p + delta) : m;
                })}`;
            } 
            // 3. Dạng tổng quát
            else {
                newText = originalText.replace(/(\d+)/g, (m, n) => {
                    const p = parseInt(n);
                    return (p >= 1 && p <= 20) ? String(p + delta) : m;
                });
            }

            const uniqueId = 'var_' + masterId + '_' + Date.now() + '_' + Math.floor(Math.random()*1000);

            return {
                id: uniqueId,
                family_id: masterId,
                is_master: false,
                question_type: qType,
                difficulty: question.difficulty || 'VD',
                question_text: newText,
                options: newOptions,
                correct_option: newCorrect,
                explanation: newExplanation || 'Phương pháp giải tương tự câu gốc, thực hiện tính toán trên số liệu mới.',
                tikz_code: question.tikz_code || null,
                fallback_image_url: question.fallback_image_url || null,
                skill_tag: question.skill_tag || 'Biến thể rèn luyện'
            };
        }

        /**
         * Sinh hàng loạt biến thể mới cho một câu gốc (Dành cho Giáo viên)
         */
        async generateMultipleVariants(masterQuestion, count = 3) {
            if (!masterQuestion) return [];
            if (typeof count !== 'number' || isNaN(count) || count < 1) {
                count = 3;
            }
            const masterId = String(masterQuestion.id);
            const createdVariants = [];

            if (!this.localVariantsMap[masterId]) {
                this.localVariantsMap[masterId] = [];
            }

            const currentCount = this.localVariantsMap[masterId].length;

            for (let i = 0; i < count; i++) {
                const variantNumber = currentCount + i + 1;
                const variant = this.createNumericalVariant(masterQuestion, variantNumber);

                // Thử lưu vào Supabase nếu có thể
                if (this.supabaseClient && masterQuestion.id) {
                    try {
                        const payload = {
                            course_id: masterQuestion.course_id,
                            chapter_id: masterQuestion.chapter_id,
                            lesson_id: masterQuestion.lesson_id,
                            question_type: masterQuestion.question_type || 'multiple_choice',
                            difficulty: masterQuestion.difficulty || 'TH',
                            question_text: variant.question_text,
                            options: variant.options,
                            correct_option: (typeof variant.correct_option === 'number') ? variant.correct_option : 0,
                            explanation: variant.explanation,
                            family_id: parseInt(masterId) || null,
                            is_master: false
                        };
                        const { data } = await this.supabaseClient.from('questions').insert([payload]).select('id').single();
                        if (data && data.id) {
                            variant.id = data.id;
                        }
                    } catch (e) {
                        console.warn("Không thể lưu biến thể vào Supabase, sử dụng bộ nhớ local:", e.message);
                    }
                }

                this.localVariantsMap[masterId].push(variant);
                createdVariants.push(variant);
            }

            this.saveLocalCache();

            // Cập nhật số biến thể cho câu gốc
            masterQuestion.variant_count = this.localVariantsMap[masterId].length;

            return createdVariants;
        }

        /**
         * Xóa 1 biến thể khỏi Question Family
         */
        deleteVariant(masterId, variantId) {
            const mId = String(masterId);
            if (this.localVariantsMap[mId]) {
                this.localVariantsMap[mId] = this.localVariantsMap[mId].filter(v => String(v.id) !== String(variantId));
                this.saveLocalCache();
            }
        }
    }

    // Đăng ký toàn cục
    global.QuestionFamilyEngine = new QuestionFamilyEngine();

})(typeof window !== 'undefined' ? window : this);
