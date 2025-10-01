// const extractPriceAndLink = (text) => {
//     // helper: arabic-Indic -> latin digits
//     const arabicToLatin = (s) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

//     // normalize
//     let t = arabicToLatin(String(text || ''));
//     t = t.replace(/\u00A0/g, ' '); // non-breaking
//     t = t.replace(/\s+/g, ' ');

//     // 1) استخراج روابط علي اكسبرس (مع أو بدون https)
//     let aliLinks = [...t.matchAll(/(https?:\/\/[^\s"]*aliexpress\.[^\s"]+|https?:\/\/[^\s"]*s\.click\.aliexpress\.com\/[^\s"]+|s\.click\.aliexpress\.com\/[^\s"]+|aliexpress\.[^\s"]+\/[^\s"]+)/gi)]
//         .map(m => m[0]);

//     // تنظيف الروابط واضافة https اذا ناقص
//     aliLinks = aliLinks.map(link => {
//         link = link.trim().replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=%]+$/g, '');
//         if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
//         return link;
//     });

//     // 2) استخراج السعر بشكل ذكي
//     let price = 'null';

//     // small util: normalize number string -> parseable
//     const normalizeNumberStr = (s) => {
//         s = String(s).trim();
//         s = s.replace(/\s+/g, '');        // remove spaces
//         // if commas used as decimal (e.g., 3,5) -> convert to dot
//         // but if there are thousands separators like 1.234,56 we try to keep last separator as decimal
//         // Strategy: replace commas with dots, then if multiple dots, keep last as decimal:
//         s = s.replace(/,/g, '.');
//         const parts = s.split('.');
//         if (parts.length === 1) return parts[0];
//         if (parts.length === 2) return parts.join('.');
//         // more than 2 parts -> join all but last as integer part
//         const last = parts.pop();
//         return parts.join('') + '.' + last;
//     };

//     // try 1: إذا وجدنا كلمة "السعر" ناخذ أول رقم بعدها (نبحث داخل نافذة صغيرة)
//     const priceIndicatorMatch = t.match(/السعر/i);
//     if (priceIndicatorMatch) {
//         const idx = t.search(/السعر/i);
//         const windowText = t.slice(idx, idx + 120); // نافذة 120 حرف بعد كلمة السعر
//         const m = windowText.match(/(\d{1,3}(?:[.,]\d+)?)/);
//         if (m && m[1]) {
//             const num = normalizeNumberStr(m[1]);
//             const n = parseFloat(num);
//             if (!Number.isNaN(n)) {
//                 price = n;
//             }
//         }
//     }

//     // try 2: نبحث عن أرقام في النص ونفضل الرقم اللي حوله علامة عملة
//     if (price === 'null') {
//         const numRegex = /(\d{1,3}(?:[.,]\d+)?)/g;
//         const all = [...t.matchAll(numRegex)].map(m => ({ val: m[1], idx: m.index }));
//         if (all.length > 0) {
//             // look for near-currency candidates
//             let chosen = null;
//             for (const item of all) {
//                 const start = Math.max(0, item.idx - 6);
//                 const end = item.idx + item.val.length + 6;
//                 const ctx = t.slice(start, end);
//                 if (/[€$]|دولار|USD|دينار|DA|د\.ج|دج|دينار تونسي|د.ت/i.test(ctx)) {
//                     chosen = item.val;
//                     break;
//                 }
//             }
//             if (!chosen) chosen = all[0].val; // fallback: أول رقم في النص
//             const num = normalizeNumberStr(chosen);
//             const n = parseFloat(num);
//             if (!Number.isNaN(n)) price = n;
//         }
//     }

//     // 3) إذا لم نجد رابط نحاول استخراج من رموز مثل "رابط: ..." أو emoji
//     if (aliLinks.length === 0) {
//         aliLinks = [...t.matchAll(/(?:📎|🔗|رابط|link|url)\s*[:\-]?\s*(https?:\/\/[^\s"]+|[^\s"]+)/gi)]
//             .map(m => m[1])
//             .filter(Boolean)
//             .map(l => {
//                 if (!/^https?:\/\//i.test(l)) return 'https://' + l;
//                 return l;
//             });
//     }

//     return {
//         link: aliLinks.length ? aliLinks[0] : 'null',
//         price
//     };
// };

// module.exports = extractPriceAndLink;


const extractPriceAndLink = (text) => {
    // تحويل الأرقام العربية إلى لاتينية
    const arabicToLatin = (s) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // تنظيف النص من المسافات غير الاعتيادية
    let t = arabicToLatin(String(text || ''));
    t = t.replace(/[\u00A0\u200C\u200B\u200E\u200F\u202A-\u202E]/g, ' ');
    t = t.replace(/\s+/g, ' ').trim();

    // 1) استخراج روابط علي اكسبرس
    let aliLinks = [...t.matchAll(/(https?:\/\/[^\s"]*aliexpress\.[^\s"]+|https?:\/\/[^\s"]*s\.click\.aliexpress\.com\/[^\s"]+|s\.click\.aliexpress\.com\/[^\s"]+|aliexpress\.[^\s"]+\/[^\s"]+)/gi)]
        .map(m => m[0]);

    // تنظيف الروابط
    aliLinks = aliLinks.map(link => {
        link = link.trim().replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=%]+$/g, '');
        if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
        return link;
    });

    // 2) استخراج السعر بشكل ذكي
    let price = 'null';

    const normalizeNumberStr = (s) => {
        s = String(s).trim();
        s = s.replace(/\s+/g, '');
        s = s.replace(/,/g, '.');

        const dotCount = (s.match(/\./g) || []).length;
        if (dotCount > 1) {
            const firstDotIndex = s.indexOf('.');
            const beforeDot = s.substring(0, firstDotIndex).replace(/\./g, '');
            const afterDot = s.substring(firstDotIndex + 1).replace(/\./g, '');
            return beforeDot + '.' + afterDot;
        }
        return s;
    };

    // قوائم الكلمات المفتاحية المحسنة
    const excludeKeywords = ['كوبون', 'خصم', 'coupon', 'تخفيض', 'نقاط', 'عملات', '🪙', 'قسيمة', 'كود', 'قطع'];
    const productKeywords = ['سماعات', 'هاتف', 'ساعة', 'معالج', 'لابتوب', 'كمبيوتر', 'بلوتوث', 'SSD', 'GB', 'TB', 'Ryzen', 'Intel', 'iPhone', 'Samsung', 'HAYLOU', 'Black Shark', 'IQOO', 'Lexar', 'NVMe', 'Webcam', 'كاميرا', 'Lenovo', 'SH1'];
    const priceIndicators = ['سعر', 'السعر', 'نهائي', 'بـ', '💲', '💰', '$', '💵', 'السعر هو', 'الـــسعـر'];

    // كلمات تقنية يجب استبعادها (ليست أسعار)
    const techSpecs = ['SH1', 'M2', 'M.2', 'MB/s', 'GB', 'TB', 'RAM', 'ROM', 'FHD', '1080P', '8MP'];

    // المحاولة الأولى: البحث بأنماط محددة جداً
    const specificPatterns = [
        // أنماط دقيقة مع السياق الكامل
        /سعر\s+\d+\s+قطع\s*:\s*(\d+[.,]\d+)\s*💲/gi,
        /💰\s*سعر\s+\d+\s+قطع\s*:\s*(\d+[.,]\d+)\s*💲/gi,
        /سعر[^:]*:\s*(\d+[.,]\d+)\s*[💲$\$]/gi,
        /السعر[^:]*:\s*(\d+[.,]\d+)\s*[💲$\$]/gi,
        /(\d+[.,]\d+)\s*[💲$\$]\s*[🔥😍🥲]/gi,
        /(\d+[.,]\d+)\s*[💲$\$]/gi
    ];

    for (const pattern of specificPatterns) {
        const matches = [...t.matchAll(pattern)];
        for (const match of matches) {
            if (match && match[1]) {
                const cleanNumber = match[1].replace(/\s+/g, '');
                const context = t.substring(Math.max(0, match.index - 50), Math.min(t.length, match.index + 50));

                // استبعاد السياقات غير المرغوبة
                const isExcluded = excludeKeywords.some(keyword => context.includes(keyword));
                const hasTechSpec = techSpecs.some(spec =>
                    context.includes(spec) && !context.includes('$') && !context.includes('💲')
                );

                if (!isExcluded && !hasTechSpec) {
                    const num = normalizeNumberStr(cleanNumber);
                    const n = parseFloat(num);
                    if (!Number.isNaN(n) && n > 1 && n < 1000) {
                        price = n;
                        break;
                    }
                }
            }
        }
        if (price !== 'null') break;
    }

    // المحاولة الثانية: نظام النقاط المتقدم
    if (price === 'null') {
        const allNumbersWithContext = [];

        // البحث عن جميع الأرقام مع السياق
        const numberMatches = [...t.matchAll(/(\d+[.,]\d+|\d+)/g)];

        for (const match of numberMatches) {
            const cleanNumber = match[0].replace(/\s+/g, '');
            const num = normalizeNumberStr(cleanNumber);
            const n = parseFloat(num);
            const context = t.substring(Math.max(0, match.index - 30), Math.min(t.length, match.index + 30));

            if (!Number.isNaN(n) && n > 0.5 && n < 1000) {
                let score = 0;

                // نقاط إيجابية قوية
                if (context.includes('سعر') && context.includes('💲')) score += 40;
                if (context.includes('💰') && context.includes('💲')) score += 35;
                if (cleanNumber.includes('.') || cleanNumber.includes(',')) score += 20;
                if (context.includes('قطع') && context.includes('سعر')) score += 15;

                // نقاط إيجابية متوسطة
                if (priceIndicators.some(indicator => context.includes(indicator))) score += 10;
                if (productKeywords.some(product => context.includes(product))) score += 8;
                if (context.includes('🔥') || context.includes('😍') || context.includes('🥲')) score += 5;

                // نطاق السعر المنطقي
                if (n > 5 && n < 50) score += 12;
                if (n > 50 && n < 300) score += 10;

                // نقاط سلبية قوية
                if (excludeKeywords.some(keyword => context.includes(keyword))) score -= 30;
                if (techSpecs.some(spec => context.includes(spec))) score -= 25;
                if (context.includes('كوبون البائع') || context.includes('قسيمة')) score -= 20;

                // نقاط سلبية متوسطة
                if (context.includes('عملات') || context.includes('🪙')) score -= 15;
                if (n < 2) score -= 10; // عقوبة للأرقام الصغيرة جداً

                if (score > 10) {
                    allNumbersWithContext.push({
                        value: n,
                        score: score,
                        context: context,
                        isDecimal: cleanNumber.includes('.') || cleanNumber.includes(',')
                    });
                }
            }
        }

        // تفضيل الأرقام العشرية ذات النقاط العالية
        const decimalCandidates = allNumbersWithContext.filter(item => item.isDecimal && item.score > 20);
        if (decimalCandidates.length > 0) {
            price = decimalCandidates.sort((a, b) => b.score - a.score)[0].value;
        } else if (allNumbersWithContext.length > 0) {
            price = allNumbersWithContext.sort((a, b) => b.score - a.score)[0].value;
        }
    }

    // المحاولة الثالثة: البحث في الأسطر التي تحتوي على مؤشرات سعر
    if (price === 'null') {
        const lines = t.split('\n');
        for (const line of lines) {
            if (line.includes('سعر') || line.includes('💰') || line.includes('💲')) {
                // البحث عن الأرقام العشرية أولاً
                const decimalMatch = line.match(/(\d+[.,]\d+)\s*[💲$\$]/);
                if (decimalMatch) {
                    const cleanNumber = decimalMatch[1].replace(/\s+/g, '');
                    const num = normalizeNumberStr(cleanNumber);
                    const n = parseFloat(num);
                    if (!Number.isNaN(n) && n > 1 && n < 1000) {
                        price = n;
                        break;
                    }
                }

                // إذا لم نجد أرقام عشرية، نبحث عن أرقام عادية
                const numberMatch = line.match(/(\d+)\s*[💲$\$]/);
                if (numberMatch && !price !== 'null') {
                    const cleanNumber = numberMatch[1].replace(/\s+/g, '');
                    const num = normalizeNumberStr(cleanNumber);
                    const n = parseFloat(num);
                    if (!Number.isNaN(n) && n > 1 && n < 1000) {
                        price = n;
                        break;
                    }
                }
            }
        }
    }

    return {
        link: aliLinks.length ? aliLinks[0] : 'null',
        price
    };
};
module.exports = extractPriceAndLink;

