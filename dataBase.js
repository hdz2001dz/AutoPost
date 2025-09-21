const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false } });

function validateUser(user) {
    if (!user || typeof user !== 'object') {
        throw new Error('بيانات المستخدم غير صالحة');
    }

    if (!user.name || typeof user.name !== 'string') {
        throw new Error('اسم المستخدم مطلوب ويجب أن يكون نصًا');
    }

    // يمكن إضافة المزيد من الشروط حسب الحاجة
    return true;
}

function database(tableName) {
    // التحقق من صحة اسم الجدول
    if (!tableName || typeof tableName !== 'string') {
        throw new Error('اسم الجدول مطلوب ويجب أن يكون نصًا');
    }

    return {
        async createUser(user) {
            try {
                validateUser(user);

                const { data, error } = await supabase
                    .from(tableName)
                    .insert([user])
                    .select();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('خطأ في إنشاء المستخدم:', error.message);
                throw new Error(`فشل في إنشاء المستخدم: ${error.message}`);
            }
        },

        async updateUser(id, update) {
            try {
                if (!id) throw new Error('معرف المستخدم مطلوب');

                const { data, error } = await supabase
                    .from(tableName)
                    .update(update)
                    .eq('id', id)
                    .select();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('خطأ في تحديث المستخدم:', error.message);
                throw new Error(`فشل في تحديث المستخدم: ${error.message}`);
            }
        },

        async userDb(userId) {
            try {
                if (!userId) throw new Error('معرف المستخدم مطلوب');

                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(); // استخدام maybeSingle بدلاً من single للتعامل مع الحالات الفارغة

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('خطأ في جلب بيانات المستخدم:', error.message);
                throw new Error(`فشل في جلب بيانات المستخدم: ${error.message}`);
            }
        },

        async usersDb() {
            try {
                const { data, error } = await supabase
                    .from(tableName)
                    .select('*');

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('خطأ في جلب قائمة المستخدمين:', error.message);
                throw new Error(`فشل في جلب قائمة المستخدمين: ${error.message}`);
            }
        },

        subscribe(callback) {
            try {
                const channel = supabase
                    .channel(`${tableName}-changes`)
                    .on(
                        "postgres_changes",
                        { event: "*", schema: "public", table: tableName },
                        (payload) => callback(payload)
                    )
                    .subscribe();

                return channel;
            } catch (error) {
                console.error('خطأ في إنشاء الاشتراك:', error.message);
                throw new Error(`فشل في إنشاء الاشتراك: ${error.message}`);
            }
        },

        async userDbByName(name) {
            try {
                if (!name || typeof name !== 'string') {
                    throw new Error('اسم المستخدم مطلوب ويجب أن يكون نصًا');
                }

                const { data, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq('name', name)
                    .maybeSingle(); // استخدام maybeSingle للتعامل مع الحالات الفارغة

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('خطأ في البحث بالاسم:', error.message);
                throw new Error(`فشل في البحث بالاسم: ${error.message}`);
            }
        },

        async updateUserByName(name, update) {
            try {
                if (!name || typeof name !== 'string') {
                    throw new Error('اسم المستخدم مطلوب ويجب أن يكون نصًا');
                }

                const { data, error } = await supabase
                    .from(tableName)
                    .update(update)
                    .eq('name', name)
                    .select();

                if (error) throw error;

                if (!data || data.length === 0) {
                    console.log(`⚠️ لم يتم العثور على مستخدم بالاسم: ${name}`);
                    return null;
                }

                console.log(`✅ تم تحديث المستخدم:`, data[0]);
                return data;
            } catch (error) {
                console.error('خطأ في التحديث بالاسم:', error.message);
                throw new Error(`فشل في التحديث بالاسم: ${error.message}`);
            }
        }
    };
}

module.exports = database;