
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyD4O4T6AsBHPMCRYWV-5hd1n1x0PAddpoc");

async function extractPriceAndLink(text) {
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. استخراج الروابط
    let aliLinks = [...text.matchAll(
        /(?:https?:\/\/(?:www\.)?(?:s\.click\.aliexpress\.com|aliexpress\.\w+)\/[^\s"]+)/g
    )].map(m => m[0]);

    // 2. استخراج السعر
    let price = "null";

    // 2.1 محاولة إيجاد "السعر النهائي" مباشرة
    const finalPriceRegex = /(?:السعر النهائي)[:\s-]*\$?\s*([\d,.]+)/i;
    const finalPriceMatch = text.match(finalPriceRegex);

    if (finalPriceMatch) {
        try {
            price = parseFloat(finalPriceMatch[1].replace(",", ""));
        } catch { price = "null"; }
    } else {
        // 2.2 إذا ما لقيناش → ناخذ آخر رقم من كل الأسعار
        const priceRegex = /(?:السعر النهائي|💵|سعر|price|💲|💰)[:\s-]*\$?\s*([\d,.]+)|\$?\s*([\d,.]+)\s*(?:دولار|\$|د\.|USD)/gi;
        const priceMatches = [...text.matchAll(priceRegex)];

        if (priceMatches.length > 0) {
            const lastMatch = priceMatches[priceMatches.length - 1];
            const priceValue = lastMatch[1] || lastMatch[2];
            try {
                price = parseFloat(priceValue.replace(",", ""));
            } catch { price = "null"; }
        }
    }

    // 3. محاولة ثانية لاستخراج الروابط إذا ما لقيناش
    if (aliLinks.length === 0) {
        aliLinks = [...text.matchAll(/(?:📎|🔗|رابط|link|url)[\s:]*([^\s]+)/gi)]
            .map(m => m[1])
            .filter(link => link.includes("aliexpress") || link.includes("s.click"));
    }

    // 4. تنظيف الروابط
    aliLinks = aliLinks.map(link => link.replace(/[^\w\/\-\.\:]+$/, ""));

    // 5. إذا ما لقيناش السعر أو الرابط → نسأل Gemini
    if ((aliLinks.length === 0 || price === "null") && modelInstance) {
        const prompt = `
        استخرج السعر بالدولار ورابط الإحالة من النص التالي.
        أعد النتيجة فقط بهذا الشكل:
        PRICE: <السعر>
        LINK: <الرابط>

        النص:
        ${text}
      `;

        try {
            const result = await modelInstance.generateContent(prompt);
            const aiText = result.response.text().trim();

            // سعر من رد Gemini
            const aiPriceMatch = aiText.match(/PRICE:\s*([\d\.,]+)/);
            if (aiPriceMatch) {
                try {
                    price = parseFloat(aiPriceMatch[1].replace(",", "."));
                } catch { }
            }

            // رابط من رد Gemini
            const aiLinkMatch = aiText.match(/LINK:\s*(https?:\/\/[^\s]+)/);
            if (aiLinkMatch) {
                aliLinks = [aiLinkMatch[1]];
            }
        } catch (err) {
            console.log("⚠️ خطأ في Gemini:", err.message);
        }
    }

    // 6. إرجاع النتيجة
    return {
        link: aliLinks.length > 0 ? aliLinks[0] : "null",
        price
    };
}

module.exports = extractPriceAndLink;

// (async () => {
//     const text = `
// لافااااااااااااااااااااااااااااااار SSD🔥
// 📍أختر بلد الحساب الجزائر 🇩🇿
// ✔️ضف 4 قطع ثم أدفع

// ©️4️⃣ WALRAM SSD (128G)

// 💲السعر النهائي: $24
// 💲سعر القطعة $6

// 📎 s.click.aliexpress.com/e/_c4Cqczgx
// 👋   أفضل العروض تجدونها هنا @cpndcc
// 🤖استخدم البوت للشراء بأفضل الأسعار🤖
// http://t.me/Crowbotbot
// http://t.me/Crowbotbot
//   `;

//     const result = await extractPriceAndLink(text);
//     console.log(result);
// })();
