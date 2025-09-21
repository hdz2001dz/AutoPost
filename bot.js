
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const database = require("./dataBase");
const idCatcher = require("./getID");
const AliExpressHelper = require("./generateLink");
const extractPriceAndLink = require("./getMessage");
const readlineSync = require("readline-sync");
const channels = database("channel");
const products = database("products");
const { Telegraf } = require('telegraf')
const express = require('express');
const app = express();
const port = 3000;
const bot = new Telegraf(process.env.token)
let listchannels = [];
function keepAppRunning() {
    setInterval(() => {
        https.get(`${process.env.RENDER_EXTERNAL_URL}/ping`, (resp) => {
            if (resp.statusCode === 200) {
                console.log('Ping successful');
            } else {
                console.error('Ping failed');
            }
        });
    }, 5 * 60 * 1000);
}
(async () => {

    const users = await channels.usersDb();
    const prod = await products.userDb(10);
    users.map(user => listchannels.push(user.name));


    const apiId = process.env.idapp;
    const apiHash =   process.env.hashapp;

    const SESSION_FILE = "session.txt";

    // let stringSession = new StringSession(
    //     fs.existsSync(SESSION_FILE) ? fs.readFileSync(SESSION_FILE, "utf-8") : ""
    // );

    let stringSession = new StringSession(
       
        process.env.stringSession
    );

    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    function removeLeadingNumber(str) {
        let i = 0;
        while (i < str.length && !isNaN(str[i]) && str[i] !== " ") {
            i++;
        }
        return str.slice(i);
    }

    const channelUsernames = listchannels.map(ch => {
        const cleanName = removeLeadingNumber(ch);
        return cleanName.startsWith("@") ? cleanName : "@" + cleanName;
    });

    // -------------

    async function getLastPost(channel) {
        const result = await client.getMessages(channel, { limit: 1 });
        if (result && result.length > 0) {
            return result[0].message || "[لا يوجد نص]";
        }
        return "[لا يوجد نص]";
    }

    function getLeadingNumber(str) {
        const match = str.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    function savePost(channel, postText) {
        const getid = channel.replace("@", "");// getLeadingNumber(channel);
        // console.log(`=============>${postText}`)

        // if (getid) {
        //     // عندها رقم معرف
        //     channels.updateUser(getid, { text: postText })
        //         .then(() => console.log(`✅ تم تحديث آخر بوست في الداتا بيس (id=${getid})`))
        //         .catch(err => console.error("⚠️ خطأ في الحفظ:", err.message));
        // } else {
        //     // ماعندهاش رقم → نستعمل الاسم بلا @
            const cleanName = channel.replace("@", "");
            channels.updateUserByName(cleanName, { text: postText })
                .then(() => console.log(`✅ تم تحديث آخر بوست بالاسم (${cleanName})`))
                .catch(err => console.error("⚠️ خطأ في الحفظ بالاسم:", err.message));
        // }
    }

    async function readLastSaved(channel) {
        const getid = getLeadingNumber(channel);

        if (getid) {
            const msg = await channels.userDb(getid);
            return msg && msg["text"] ? msg["text"] : "";
        } else {
            const cleanName = channel.replace("@", "");
            const msg = await channels.userDbByName(cleanName);
            return msg && msg["text"] ? msg["text"] : "";
        }
    }


    // -----------------

    async function monitorChannels() {
        await client.start({
            phoneNumber: async () => readlineSync.question("📱 NumberPhone: "),
            password: async () => readlineSync.question("🔑 Password (2FA): "),
            phoneCode: async () => readlineSync.question("📩 OTP: "),
            onError: (err) => console.log(err),
        });

        // بعد تسجيل الدخول نخزن السيشن
        fs.writeFileSync(SESSION_FILE, client.session.save(), "utf-8");
        console.log("✅ تم حفظ الجلسة في الملف");

        while (true) {
            for (const channel of channelUsernames) {
                try {
                
                    const latestPost = await getLastPost(channel);
                    const lastSaved = await readLastSaved(channel);

                    if (latestPost !== lastSaved) {
                        const getinfolastpost = await extractPriceAndLink(latestPost);
                        const gener = new AliExpressHelper();
                        const getID = await idCatcher(getinfolastpost.link);
                        
                        let list_products = prod.idProduct
                        if (!Array.isArray(list_products)) {
                            list_products = [];
                        }
                        if (list_products.includes(getID.url)) {
                            console.log('id found')
                        } else {
                   
                            list_products.push(getID.url);
                            await products.updateUser(10, { idProduct: list_products });
                       
                 
                            const ProductData = await gener.getProductData(getID.url);
                            console.log(getID.type)
                        const generate = await gener.generateLink(
                            process.env.cook,
                            getID.url,
                            getID.type
                        );

                        const messa = `
🔥 تخفيض⚡️

☑️ المنتج :
${ProductData.title}

✅ رابط العملات : ${getinfolastpost.price}
${generate}

☑️ قناتنا : @Choice_Deals
✅ البوت :  @Alishoppingdz20_bot
                        `;

                        const imageUrl = ProductData.image_url;
                        console.log(imageUrl)
                        
                        if (imageUrl && imageUrl.startsWith("http")) {
                            bot.telegram.sendPhoto("@err0rchannel1"
                                , { url: imageUrl }, { caption: messa })

                        }

                            savePost(channel, latestPost);
                        }
                    } else {
                        console.log(`⏳ لا يوجد جديد في القناة: ${channel}`);
                    }
                } catch (err) {
                    console.log(`❌ خطأ في ${channel}: ${err.message}`);
                }
            }
            await new Promise((resolve) => setTimeout(resolve, 20000));
        }
    }

    app.get('/ok', (req, res) => {
        res.send('Hello World!');
    });



    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
        monitorChannels();
        keepAppRunning()
    });
})();
