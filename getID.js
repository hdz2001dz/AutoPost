const axios = require("axios");
const { chromium } = require("playwright");
const { parse } = require("url");


async function trackShortUrlPlaywright(shortUrl) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(shortUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(3000); 
        const finalUrl = page.url();
        const typeurl = checkUrl(finalUrl);

        return { url: finalUrl, type: typeurl };
    } catch (e) {
        console.error("❌ Playwright error:", e.message);
        return null;
    } finally {
        await browser.close();
    }
}

function checkUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const fromParam = parsedUrl.searchParams.get("from");
        const productIdsParam = parsedUrl.searchParams.get("productIds");
        return fromParam === "syicon" && !!productIdsParam;
    } catch {
        return false;
    }
}

async function idCatcher(urlOrId) {
    const regex = /\/item\/(\d+)\.html/;

    if (/^\d+$/.test(urlOrId)) return { url: urlOrId, type: false };

    if (urlOrId.includes("aliexpress.com") || urlOrId.includes("s.click.aliexpress.com") || urlOrId.includes("star.aliexpress.com")) {
        try {
            if (!urlOrId.startsWith("http")) {
                urlOrId = "https://" + urlOrId;
            }

            const headers = {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117.0.0.0 Safari/537.36",
            };

            let finalUrl;
            try {
                const response = await axios.get(urlOrId, {
                    headers,
                    maxRedirects: 5,
                    timeout: 10000,
                });
                finalUrl =
                    response.request?.res?.responseUrl ||
                    response.config.url ||
                    urlOrId;
            } catch {
                const result = await trackShortUrlPlaywright(urlOrId);
                if (!result) return null;
                finalUrl = result.url;
            }

            if (typeof finalUrl === "object" && finalUrl.url) {
                finalUrl = finalUrl.url;
            }

            const parsedUrl = parse(finalUrl);
            const queryParams = new URLSearchParams(parsedUrl.query);

            if (queryParams.has("productIds")) {
                const productId = queryParams.get("productIds");
                return { url: productId, type: checkUrl(finalUrl) };
            }

            if (queryParams.has("redirectUrl")) {
                const redirectUrl = decodeURIComponent(queryParams.get("redirectUrl"));

                const matchRedirect = regex.exec(redirectUrl);
                if (matchRedirect) {
                    return { url: matchRedirect[1], type: checkUrl(redirectUrl) };
                }
            }

            const match = regex.exec(finalUrl);
            if (match) return { url: match[1], type: checkUrl(finalUrl) };

            return { url: finalUrl, type: false };

        } catch (e) {
            console.error("Error in idCatcher:", e.message);
        }
    }

    return null;
}

module.exports = idCatcher;

// (async () => {
//     try {
//         const url1 = "s.click.aliexpress.com/e/_c4Cqczgx";
//         const id1 = await idCatcher(url1);

//         console.log("🔹 ID1:", id1);
//     } catch (err) {
//         console.error("❌ خطأ في التجربة:", err.message);
//     }
// })();

// مثال استخدام
// const url = "https://m.aliexpress.com/p/coin-index/index.html?_immersiveMode=true&from=syicon&productIds=1005007394031248&aff_fcid=4dd7f1743acc4e718909b676fbd3ecf2-1758409694366-09351-_c3X9INL1&tt=CPS_NORMAL&aff_fsk=_c3X9INL1&aff_platform=portals-tool&sk=_c3X9INL1&aff_trace_key=4dd7f1743acc4e718909b676fbd3ecf2-1758409694366-09351-_c3X9INL1&terminal_id=0439e331b7c74148baf5018fc3dfcb98";
// console.log(checkUrl(url)); // 👉 true
