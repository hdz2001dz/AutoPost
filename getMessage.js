const extractPriceAndLink = (text) => {
    // helper: arabic-Indic -> latin digits
    const arabicToLatin = (s) => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // normalize
    let t = arabicToLatin(String(text || ''));
    t = t.replace(/\u00A0/g, ' '); // non-breaking
    t = t.replace(/\s+/g, ' ');

    // 1) استخراج روابط علي اكسبرس (مع أو بدون https)
    let aliLinks = [...t.matchAll(/(https?:\/\/[^\s"]*aliexpress\.[^\s"]+|https?:\/\/[^\s"]*s\.click\.aliexpress\.com\/[^\s"]+|s\.click\.aliexpress\.com\/[^\s"]+|aliexpress\.[^\s"]+\/[^\s"]+)/gi)]
        .map(m => m[0]);

    // تنظيف الروابط واضافة https اذا ناقص
    aliLinks = aliLinks.map(link => {
        link = link.trim().replace(/[^\w\-._~:/?#[\]@!$&'()*+,;=%]+$/g, '');
        if (!/^https?:\/\//i.test(link)) link = 'https://' + link;
        return link;
    });

    // 2) استخراج السعر بشكل ذكي
    let price = 'null';

    // small util: normalize number string -> parseable
    const normalizeNumberStr = (s) => {
        s = String(s).trim();
        s = s.replace(/\s+/g, '');        // remove spaces
        // if commas used as decimal (e.g., 3,5) -> convert to dot
        // but if there are thousands separators like 1.234,56 we try to keep last separator as decimal
        // Strategy: replace commas with dots, then if multiple dots, keep last as decimal:
        s = s.replace(/,/g, '.');
        const parts = s.split('.');
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return parts.join('.');
        // more than 2 parts -> join all but last as integer part
        const last = parts.pop();
        return parts.join('') + '.' + last;
    };

    // try 1: إذا وجدنا كلمة "السعر" ناخذ أول رقم بعدها (نبحث داخل نافذة صغيرة)
    const priceIndicatorMatch = t.match(/السعر/i);
    if (priceIndicatorMatch) {
        const idx = t.search(/السعر/i);
        const windowText = t.slice(idx, idx + 120); // نافذة 120 حرف بعد كلمة السعر
        const m = windowText.match(/(\d{1,3}(?:[.,]\d+)?)/);
        if (m && m[1]) {
            const num = normalizeNumberStr(m[1]);
            const n = parseFloat(num);
            if (!Number.isNaN(n)) {
                price = n;
            }
        }
    }

    // try 2: نبحث عن أرقام في النص ونفضل الرقم اللي حوله علامة عملة
    if (price === 'null') {
        const numRegex = /(\d{1,3}(?:[.,]\d+)?)/g;
        const all = [...t.matchAll(numRegex)].map(m => ({ val: m[1], idx: m.index }));
        if (all.length > 0) {
            // look for near-currency candidates
            let chosen = null;
            for (const item of all) {
                const start = Math.max(0, item.idx - 6);
                const end = item.idx + item.val.length + 6;
                const ctx = t.slice(start, end);
                if (/[€$]|دولار|USD|دينار|DA|د\.ج|دج|دينار تونسي|د.ت/i.test(ctx)) {
                    chosen = item.val;
                    break;
                }
            }
            if (!chosen) chosen = all[0].val; // fallback: أول رقم في النص
            const num = normalizeNumberStr(chosen);
            const n = parseFloat(num);
            if (!Number.isNaN(n)) price = n;
        }
    }

    // 3) إذا لم نجد رابط نحاول استخراج من رموز مثل "رابط: ..." أو emoji
    if (aliLinks.length === 0) {
        aliLinks = [...t.matchAll(/(?:📎|🔗|رابط|link|url)\s*[:\-]?\s*(https?:\/\/[^\s"]+|[^\s"]+)/gi)]
            .map(m => m[1])
            .filter(Boolean)
            .map(l => {
                if (!/^https?:\/\//i.test(l)) return 'https://' + l;
                return l;
            });
    }

    return {
        link: aliLinks.length ? aliLinks[0] : 'null',
        price
    };
};

module.exports = extractPriceAndLink;
