const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const database = require("./dataBase");
const idCatcher = require("./getID");
const AliExpressHelper = require("./generateLink");
const extractPriceAndLink = require("./getMessage");
const readlineSync = require("readline-sync");
const { Telegraf } = require("telegraf");
const express = require("express");
const https = require("https");

// =======================
// إعدادات عامة
// =======================
const app = express();
const port = 3000;
const bot = new Telegraf(process.env.token);

const apiId = process.env.idapp;
const apiHash = process.env.hashapp;
const SESSION_FILE = "session.txt";
const stringSession = new StringSession(process.env.stringSession);

const channels = database("channel");
const products = database("products");

let channelList = [];

// =======================
// Helpers
// =======================

function removeLeadingNumber(str) {
    return str.replace(/^\d+\s*/, ""); // يشيل الأرقام والمسافة في البداية
}

function formatChannelName(name) {
    const clean = removeLeadingNumber(name);
    return clean.startsWith("@") ? clean : "@" + clean;
}

async function getLastPost(client, channel) {
    const result = await client.getMessages(channel, { limit: 1 });
    return result?.[0]?.message || "[لا يوجد نص]";
}

function savePost(channel, postText) {
    const cleanName = channel.replace("@", "");
    return channels.updateUserByName(cleanName, { text: postText })
        .then(() => console.log(`✅ آخر بوست محفوظ (${cleanName})`))
        .catch(err => console.error("⚠️ خطأ في الحفظ:", err.message));
}

async function readLastSaved(channel) {
    const cleanName = channel.replace("@", "");
    const msg = await channels.userDbByName(cleanName);
    return msg?.text || "";
}

function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log("Ping successful");
            } else {
                console.error("Ping failed");
            }
        });
    }, 5 * 60 * 1000);
}

// =======================
// Monitor Channels
// =======================

async function monitorChannels(client) {
    await client.start({
        phoneNumber: () => readlineSync.question("📱 رقم الهاتف: "),
        password: () => readlineSync.question("🔑 كلمة المرور (2FA): "),
        phoneCode: () => readlineSync.question("📩 رمز OTP: "),
        onError: (err) => console.error("❌ خطأ:", err.message),
    });

    // حفظ السيشن
    fs.writeFileSync(SESSION_FILE, client.session.save(), "utf-8");
    console.log("✅ تم حفظ الجلسة");

    const aliHelper = new AliExpressHelper();
    const prod = await products.userDb(10);

    while (true) {
        for (const channel of channelList) {
            try {
                const latestPost = await getLastPost(client, channel);
                const lastSaved = await readLastSaved(channel);

                if (latestPost !== lastSaved) {
                    const postInfo = await extractPriceAndLink(latestPost);
                    const getID = await idCatcher(postInfo.link);

                    let productList = Array.isArray(prod.idProduct) ? prod.idProduct : [];
                    if (productList.includes(getID.id)) {
                        console.log(`⚠️ المنتج موجود بالفعل (id=${getID.id})`);
                        continue;
                    }

                    // تحديث قاعدة البيانات
                    productList.push(getID.id);
                    await products.updateUser(10, { idProduct: productList });

                    // جلب بيانات المنتج
                    const productData = await aliHelper.getProductData(getID.id);
                    const generate = await aliHelper.generateLink(
                        process.env.cook,
                        getID.id,
                        getID.meta.type
                    );
                    console.log(`generate ===>${generate}`) 

                    const message = `
🔥 تخفيض⚡️

☑️ المنتج :
${productData.title}

✅ السعر : ${postInfo.price}
${generate}

☑️ قناتنا : @Choice_Deals
✅ البوت : @Alishoppingdz20_bot
                    `;

                    if (productData.image_url?.startsWith("http")) {
                        await bot.telegram.sendPhoto(
                            "@err0rchannel1",
                            { url: productData.image_url },
                            { caption: message }
                        );
                    }

                    await savePost(channel, latestPost);
                } else {
                    console.log(`⏳ لا جديد في: ${channel}`);
                }
            } catch (err) {
                console.error(`❌ خطأ في ${channel}:`, err.message);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 20000));
    }
}

// =======================
// Main
// =======================

(async () => {
    const users = await channels.usersDb();
    channelList = users.map(u => formatChannelName(u.name));

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    app.get("/ok", (req, res) => res.send("Hello World!"));

    app.listen(port, () => {
        console.log(`🚀 السيرفر يعمل على المنفذ ${port}`);
        monitorChannels(client);
        keepAppRunning();
    });
})();

