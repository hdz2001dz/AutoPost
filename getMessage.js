
async function extractPriceAndLink(text) {
    // 1. استخراج الروابط (مع أو بدون https://)
    let aliLinks = [...text.matchAll(
        /(?:https?:\/\/)?(?:www\.)?(?:s\.click\.aliexpress\.com|aliexpress\.\w+)\/[^\s"]+/gi
    )].map(m => m[0]);

    // 2. استخراج السعر
    let price = "null";

    // 2.1 أولوية: أي جملة فيها "السعر"
    const mainPriceRegex = /(?:السعر(?: النهائي| بعد التخفيض)?)\s*[:\-]?\s*\$?\s*([\d.,]+)/i;
    const mainPriceMatch = text.match(mainPriceRegex);

    if (mainPriceMatch) {
        try {
            price = parseFloat(mainPriceMatch[1].replace(",", "."));
        } catch { price = "null"; }
    } else {
        // 2.2 fallback: آخر رقم في النص
        const priceRegex = /\$?\s*([\d.,]+)\s*(?:دولار|\$|USD)?/gi;
        const priceMatches = [...text.matchAll(priceRegex)];

        if (priceMatches.length > 0) {
            const firstMatch = priceMatches[0]; // نقدر نخليها أول أو آخر حسب اختيارك
            try {
                price = parseFloat(firstMatch[1].replace(",", "."));
            } catch { price = "null"; }
        }
    }

    // 3. محاولة ثانية لاستخراج الروابط إذا ما لقيناش
    if (aliLinks.length === 0) {
        aliLinks = [...text.matchAll(/(?:📎|🔗|رابط|link|url)\s*:?([^\s]+)/gi)]
            .map(m => m[1])
            .filter(link => link.includes("aliexpress") || link.includes("s.click"));
    }

    // 4. تنظيف الروابط + إضافة https:// إذا ناقص
    aliLinks = aliLinks.map(link => {
        link = link.replace(/[^\w\/\-\.\:]+$/, "");
        if (!link.startsWith("http")) {
            link = "https://" + link;
        }
        return link;
    });

    // 5. إرجاع النتيجة
    return {
        link: aliLinks.length > 0 ? aliLinks[0] : "null",
        price
    };
}
module.exports = extractPriceAndLink;

// // test
// (async () => {
//     const text = `
// تخفيض لـ Lenovo Xiaoxin Pad 11 6/128GB
// السعر : 131.66$ (111.72€) 🔥
// رابط s.click.aliexpress.com/e/_c4Vgv9c7
// خصم النقاط

// لا تنسى استخدام البوت للشراء بأقل الأسعار :
// t.me/LodyCouponsBot
// `;

//     const result = await extractPriceAndLink(text);
//     console.log(result);
// })();
