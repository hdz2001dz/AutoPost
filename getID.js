const { chromium } = require("playwright");
const axios = require("axios");

// 🔹 المحاولة الأولى: axios يجيب أول redirect فقط
async function getFirstRedirect(shortUrl) {
    try {
        const res = await axios.get(shortUrl, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });
        return res.headers.location || null;
    } catch (e) {
        console.error("❌ Axios error:", e.message);
        return null;
    }
}

// 🔹 المحاولة الثانية: Playwright يجيب URL النهائي
async function trackShortUrlPlaywright(shortUrl) {
    const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    try {
        await page.goto(shortUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(3000);
        const finalUrl = page.url();
        return { url: finalUrl, type: checkUrl(finalUrl) };
    } catch (e) {
        console.error("❌ Playwright error:", e.message);
        return null;
    } finally {
        await browser.close();
    }
}

// 🔹 استخراج النوع + productId
function checkUrl(url) {
    try {
        const u = new URL(url);
        let productId = null;

        // حالة productIds في الـ query
        if (u.searchParams.has("productIds")) {
            productId = u.searchParams.get("productIds");
        }

        // حالة redirectUrl (مثلا star.aliexpress.com/share/share.htm?redirectUrl=...)
        if (u.searchParams.has("redirectUrl")) {
            const redirectUrl = decodeURIComponent(u.searchParams.get("redirectUrl"));
            const match = redirectUrl.match(/item\/(\d+)\.html/);
            if (match) productId = match[1];
        }

        // حالة الرابط العادي /item/xxxx.html
        if (!productId) {
            const match = u.pathname.match(/item\/(\d+)\.html/);
            if (match) productId = match[1];
        }

        // تحديد النوع
        let type = "product";
        if (u.pathname.includes("/coin-index/")) {
            type = "syicon";
        } else if (u.pathname.includes("/BundleDeals")) {
            type = "bundle";
        }

        return {
            valid: !!productId,
            type,
            productId,
            originalUrl: url
        };
    } catch {
        return { valid: false, type: null, productId: null, originalUrl: url };
    }
}

// 🔹 الدالة الرئيسية
async function idCatcher(urlOrId) {
    if (/^\d+$/.test(urlOrId)) {
        return { id: urlOrId, meta: { valid: true, type: "product", productId: urlOrId, originalUrl: urlOrId } };
    }

    if (urlOrId.includes("aliexpress.com") || urlOrId.includes("s.click.aliexpress.com") || urlOrId.includes("star.aliexpress.com")) {
        if (!urlOrId.startsWith("http")) {
            urlOrId = "https://" + urlOrId;
        }

        // 1️⃣ جرّب Playwright
        let result = await trackShortUrlPlaywright(urlOrId);
        let finalUrl = result?.url || null;
        let meta = finalUrl ? checkUrl(finalUrl) : null;

        // 2️⃣ إذا ما لقى ID → جرّب axios
        if (!meta?.productId) {
            const firstRedirect = await getFirstRedirect(urlOrId);
            if (firstRedirect) {
                finalUrl = firstRedirect;
                meta = checkUrl(finalUrl);
            }
        }

        if (!finalUrl) return null;

        if (meta.productId) {
            return { id: meta.productId, meta };
        }

        return { id: null, meta };
    }

    return null;
}
module.exports = idCatcher;
