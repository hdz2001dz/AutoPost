const axios = require("axios");
const cheerio = require("cheerio");

class AliExpressHelper {
 
    async generateLink(cook ,idProduct, typeurl,trackID = "default") {
        // رابط affiliate
    
   
        const url = typeurl ? `https://portals.aliexpress.com/tools/linkGenerate/generatePromotionLink.htm?trackId=default&targetUrl=https://m.aliexpress.com/p/coin-index/index.html?_immersiveMode=true&from=syicon&productIds=${idProduct}&aff_fcid=`:`https://portals.aliexpress.com/tools/linkGenerate/generatePromotionLink.htm?trackId=default&targetUrl=https%3A%2F%2Fstar.aliexpress.com%2Fshare%2Fshare.htm%3FredirectUrl%3Dhttps%253A%252F%252Fvi.aliexpress.com%252Fi%252F${idProduct}.html%253FsourceType%253D620%2526channel%253Dcoin&afSmartRedirect=y`;

        try {
            const response = await axios.get(url, {
                headers: {
                    Cookie: `ali_apache_id=33.27.129.163.1739743329203.668185.3; e_id=pt90; _hvn_login=13; x_router_us_f=x_alimid=2712923869; aep_common_f=h13xYy1MQHdhtyh/ADiTpMembNbrX6lOxtFraB/7CCnEcVaGWNf4YQ==; af_ss_a=1; af_ss_b=1; join_status=; _gcl_au=1.1.1560875671.1746483157; _ga=GA1.1.957321428.1746483158; cna=BlCgIGCvRDcCAZr3fU1y9U4P; lwrid=AgGWooQrK7x7R7RJ3CmCX39uI1Bs; havana_tgc=NTGC_25a9bd605a537c8b0edf8bd797fecc2f; xman_us_t=x_lid=dz1112650869oyvae&sign=y&rmb_pp=salahfde8@gmail.com&x_user=p+iA4PwFMs7XnHWcf7/34boyEwe3RELkn1duvvbSs9I=&ctoken=1722tosc4r6iv&l_source=aliexpress; sgcookie=E100q5UWVXG33qtm7rg0UbYRSi5vTXaaRThY+OgeGu386maWmpQt2oW7Pd4SmljAQG32kXPNAKtUjq4mYQGF7L8wlgxdhNpJOukopDbe8bX1ftk=; xman_t=${cook}; xman_f=SIsiYurW5wOUHsm6DKkynfWwiG/XwJm1bGhMyUsfpvwlyXaxnGgsoHoTl+C4Mbxh5SLqVn+7bQiNpy0uN1EDlccSoccc1qm9uJ8mlMQSg+doN/3EdlJ4kFPcd+xXIDoEIK3f2bMU0SaYC94AQZsTLYOANy85ZUtVbWNSU8x3Q7Xh3cJOSCPhqNkfpa1IB1c7w8pIiepky0pmv6yYX+zNm7LUnk7t0mL1MP8wCcyKUifM+yeKtnqixl3JH+KqDaDLC9/vgKmSV8v/4XTr2R3k7GtFlj+QKIp2zHuSIsUWcVrMvlaMMl87sDasEDZIHVPHv/TsdSLyleSYnoq0EIp7uNKAMgUYxIGIdGffTJa7di1GW94AyGW3qJAgC+2TfddlbulPUSP73m37BrIS02OWrA==; ali_apache_track=mt=1|ms=|mid=dz1112650869oyvae; _history_login_user_info={"userName":"Salah","avatar":"https://ae-pic-a1.aliexpress-media.com/kf/Add27803905c54551b919a8b6b021b9b7t.jpg_100x100.jpg","accountNumber":"salahfde8@gmail.com","phonePrefix":"","hasPwd":true,"expiresTime":1749112214698}; aeu_cid=48cd12dd56384b80b01f3362de099a37-1746677762697-08511-_opSYljd; aep_history=keywords%5E%0Akeywords%09%0A%0Aproduct_selloffer%5E%0Aproduct_selloffer%091005008833518907%091005008923318756; xman_us_f=x_locale=ar_MA&x_l=0&x_user=DZ|Salah|Lkt|ifm|2712923869&x_lid=dz1112650869oyvae&x_c_chg=0&x_as_i=%7B%22aeuCID%22%3A%2248cd12dd56384b80b01f3362de099a37-1746677762697-08511-_opSYljd%22%2C%22affiliateKey%22%3A%22_opSYljd%22%2C%22channel%22%3A%22AFFILIATE%22%2C%22cv%22%3A%221%22%2C%22isCookieCache%22%3A%22N%22%2C%22ms%22%3A%221%22%2C%22pid%22%3A%224717308131%22%2C%22tagtime%22%3A1746677762697%7D&acs_rt=64c183e93d994882b24773e66dd01e73; AB_DATA_TRACK=112185_8922; AB_ALG=global_union_ab_exp_4%3D0; AB_STG=st_SE_1736852788277%23stg_4159; lwrtk=AAIEaCIjcdYw8dWzNYJluWIDSquZLrekJ/Qo40rK0isx9VBKDz8QDW8=; lwrtk=AAIEaCIjcdYw8dWzNYJluWIDSquZLrekJ/Qo40rK0isx9VBKDz8QDW8=; intl_locale=ar_MA; _m_h5_tk=a1977a8b05b6a29846d73f44cfe08d58_1747055216814; _m_h5_tk_enc=c9aebb1c48055cbefc5ebd20bd83b0a1; intl_common_forever=i4RzD0Ky+chDxb28TanXD/pGdZjpAE5GWcSsFXf+4GocsnchyQ+3fQ==; acs_usuc_t=x_csrf=j_h9qlz2hflf&acs_rt=a7cb13d089f54efbb8e63bdc516051fc; _ga_VED1YSGNC7=GS2.1.s1747053055$o9$g0$t1747053055$j60$l0$h0; aep_usuc_f=site=ara&province=null&city=null&c_tp=DZD&x_alimid=2712923869&isfb=y&isb=y&region=DZ&b_locale=ar_SA&ae_u_p_s=2; epssw=9*mmCdymJd5HvjCITm3ASURR33jG9mmimmmmF7nwse3tZ7utV73tQammjeWPlmpc_IgzImILC16cyR4awvmqJmm5-R0uyHmTj-9hf0tutIBAbwLaoVsUHceFFd639R9memmmLuuzeUTBmtuV3emA0ZCbDQmbuctIs9aMnOCTrQvMyZHaHhIuSyGXNj1umutdCyuRrm3ATozommuARmmmmm3mPX-ZMnuSl2VAM4wcgJPKlKama2LEHBiPfsDrSSOjbgommLl4a8s7POEV6j5rBXyCld0BCwxPFywg9.; isg=BNvb9yK6N0Mz9ksPip5GgCODaj9FsO-yTN0wj80Yt1rxrPuOVYB_AvmsQhQijEeq; x-hng=lang=ar-SA; JSESSIONID=A9DC9B8A64F479BB8E85C10B425EAC0F`,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                }
            });

            if (response.status === 200 && response.data) {
                return response.data.data;
            }
            return null;
        } catch (err) {
            console.error(`❌ Error generateLink: ${err.message}`);
            return null;
        }
    }

    async getProductData(id,lang) {
        const url = `https://${lang || 'vi'}.aliexpress.com/item/${id}.html`;

        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                timeout: 10000,
            });

            if (response.status !== 200) {
                console.log(`❌ فشل في تحميل الصفحة: ${response.status}`);
                return null;
            }

            const $ = cheerio.load(response.data);
            const imageUrl = $("meta[property='og:image']").attr("content");
            const title = $("meta[property='og:title']").attr("content");

            if (!title || !imageUrl) {
                console.log("⚠️ لم يتم العثور على العنوان أو الصورة");
                return null;
            }

            return { title, image_url: imageUrl };
        } catch (err) {
            console.error(`❌ خطأ أثناء جلب بيانات المنتج: ${err.message}`);
            return null;
        }
    }
}

module.exports = AliExpressHelper;
