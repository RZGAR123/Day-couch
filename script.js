"use strict";

// ======================================================
// ۱. داده‌های اصلی
// ======================================================

let activities = [];
let score = 0;

try {
    const savedActivities = localStorage.getItem("daycoach_activities");
    if (savedActivities) {
        const parsed = JSON.parse(savedActivities);
        if (Array.isArray(parsed)) activities = parsed;
    }
} catch (e) { console.error("خطا در بازیابی فعالیت‌ها:", e); }

try {
    const savedScore = localStorage.getItem("daycoach_score");
    score = Number(savedScore) || 0;
} catch (e) { console.error("خطا در بازیابی امتیاز:", e); }

// ======================================================
// ۲. ابزارهای تاریخ و زمان
// ======================================================

function getTodayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMinutes(time) {
    if (!time) return 0;
    const parts = time.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
}

function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ======================================================
// ۳. ذخیره‌سازی
// ======================================================

function saveData() {
    try {
        localStorage.setItem("daycoach_activities", JSON.stringify(activities));
        localStorage.setItem("daycoach_score", String(score));
        return true;
    } catch (e) {
        console.error("خطا در ذخیره:", e);
        return false;
    }
}

// ======================================================
// ۴. توابع کمکی
// ======================================================

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function randomPick(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
}

function setElementText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setElementWidth(id, width) {
    const el = document.getElementById(id);
    if (el) el.style.width = width;
}

// ======================================================
// ۵. محاسبه درصد موفقیت (بر اساس زمان)
// ======================================================

function getActivityDuration(activity) {
    const start = getMinutes(activity.start);
    const end = getMinutes(activity.end);
    return Math.max(0, end - start);
}

function calculateSuccessRate(activitiesList) {
    if (!activitiesList || activitiesList.length === 0) return 0;
    let total = 0, earned = 0;
    activitiesList.forEach(function(act) {
        const duration = getActivityDuration(act);
        total += duration;
        if (act.status === 'completed') earned += duration;
        else if (act.status === 'partial') earned += duration * 0.5;
    });
    if (total === 0) return 0;
    return Math.round((earned / total) * 100);
}

// ======================================================
// ۶. دریافت فعالیت‌های بازه‌ها
// ======================================================

function getTodayActivities() {
    const today = getTodayDate();
    return activities.filter(act => act.date === today);
}

function getWeeklyActivities() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday
    const daysFromSaturday = (dayOfWeek + 1) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - daysFromSaturday);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23,59,59,999);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    return activities.filter(act => act.date >= startStr && act.date <= endStr);
}

function getMonthlyActivities() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    return activities.filter(act => act.date >= startStr && act.date <= endStr);
}

// ======================================================
// ۷. لیست‌های جایزه/تنبیه (مطابق درخواست شما)
// ======================================================

const rewardPools = {
    daily: {
        ranges: [
            { min:0, max:10, type:'punish', texts:['🍽️ امشب ظرف‌ها رو بشور.','📱 یک ساعت بدون گوشی باش.','🧹 یه گوشه خونه رو جارو کن.'], motivations:['دیسپلین رو بیار تو زندگیت...','نظم، کلید موفقیت پایدار است.','با یک کار کوچک امروز، فردا را می‌سازی.'] },
            { min:11, max:20, type:'punish', texts:['میز شام رو بعد از غذا تمیز کن.','🍃 ۱۵ دقیقه پیاده‌روی اجباری.','🧠 یه صفحه از یه کتاب غیردرسی بخون.'], motivations:['بی‌احساس شو!','قدرت در عمل است.','هر کار کوچک، قدمی به سوی نظم است.'] },
            { min:21, max:30, type:'punish', texts:['کف زمین رو بعد از شام تمیز کن.','🚶 ۲۰ دقیقه پیاده‌روی سریع.','💧 یک لیوان آب اضافه بنوش و ۵ دقیقه نفس عمیق بکش.'], motivations:['قدرت واقعی این نیست که وزنه بلند کنی؛ این که ذهنت را کنترل کنی.','ذهن قوی، زندگی قوی می‌سازد.','تمرکز بر کارهای کوچک، قدرت بزرگ می‌آورد.'] },
            { min:31, max:40, type:'punish', texts:['به جای فیلم دیدن، روزت رو بنویس.','📝 لیست کارهای فردا رو با اولویت‌بندی بنویس.','🧘 ۱۰ دقیقه مدیتیشن کن.'], motivations:['هر روز ادامه بده تا حسرت خواسته‌هات تو قلبت نمونه.','نوشتن، ذهن را سازماندهی می‌کند.','قدم‌های کوچک روزانه، کوه‌های بزرگ را جابه‌جا می‌کنند.'] },
            { min:41, max:50, type:'neutral', texts:['📊 عملکردت قابل قبول بود، ولی می‌تونی بهتر باشی.','⚖️ امروز نه خوب نه بد، فردا رو قوی شروع کن.','🧩 یه معما حل کن تا ذهنت فعال بشه.'], motivations:['نیمه راه، بهتر از نقطه صفر است.','فردا با برنامه‌ریزی بهتر، موفق‌تر خواهی بود.','هر روز فرصت تازه‌ای برای پیشرفت است.'] },
            { min:51, max:60, type:'reward', texts:['🎉 امروز خوب بودی! یه لیوان آب میوه تازه به خودت هدیه بده.','🎈 ۲۰ دقیقه گوشی به دست استراحت کن.','🌿 یه پیاده‌روی کوتاه در هوای آزاد.'], motivations:['پیشرفت کوچک، پیروزی بزرگ است.','به راهت ادامه بده، داری به هدف نزدیک می‌شی.','ثبات در عملکرد، رمز موفقیت است.'] },
            { min:61, max:70, type:'reward', texts:['🎉 عالی! امروز یه فیلم کوتاه یا یه مستند جذاب ببین.','🍫 یه شکلات تلخ به خودت جایزه بده.','📖 نیم ساعت کتاب غیردرسی بخون.'], motivations:['داری پیشرفت می‌کنی، به خودت افتخار کن.','این مسیر رو ادامه بده، نتیجه‌اش رو می‌بینی.','عملکرد خوب امروز، فردای بهتری می‌سازد.'] },
            { min:71, max:80, type:'reward', texts:['🎉 بسیار عالی! امروز یه قهوه یا چای خاص به خودت هدیه بده.','🏆 یه فعالیت دلخواه (مثلاً یه بازی یا موسیقی) انجام بده.','🌟 یه پیام مثبت به یکی از دوستانت بفرست.'], motivations:['تو یک قهرمانی، امروز روز تو بود.','به توانایی‌هایت ایمان داشته باش.','هر روز بهتر از دیروز، این یعنی رشد.'] },
            { min:81, max:90, type:'reward', texts:['🎉 فوق‌العاده! امروز یه غذای موردعلاقه سفارش بده.','🏅 یه پیاده‌روی طولانی در طبیعت یا پارک.','🎁 یه هدیه کوچک برای خودت بخر.'], motivations:['به خودت افتخار کن، این روز رو به خاطر بسپار.','تو توانایی شگفت‌انگیزی داری.','این عملکرد نشان می‌دهد که می‌توانی هر کاری کنی.'] },
            { min:91, max:100, type:'reward', texts:['🎉 بی‌نظیر! امروز یه جشن کوچک برای خودت بگیر.','🏆 یه روز استراحت کامل یا یه تفریح خاص.','🌟 به خودت بگو: "من بهترین هستم".'], motivations:['امروز روز تو بود، این بهترین عملکردته.','هیچ‌کس نمی‌تونه متوقف‌ت کنه وقتی اینطور باشی.','این موفقیت رو جشن بگیر و برای فردا برنامه‌ریزی کن.'] }
        ]
    },
    weekly: {
        ranges: [
            { min:0, max:40, type:'punish', texts:['📉 هفته ضعیفی داشتی، این هفته یه کار اضافه رو تقبل کن.','🧹 کل خونه رو یه بار جارو کن.','📝 لیست کارهایی که این هفته انجام ندادی رو بنویس.'], motivations:['هفته بعد می‌تونی جبران کنی، از همون امروز شروع کن.','هر شکست، درس بزرگی است.','هفته جدید، فرصت جدید.'] },
            { min:41, max:44, type:'punish', texts:['📉 نزدیک بود موفق شی! این هفته یه کار اضافه (مثل مرتب کردن کمد) انجام بده.','⏰ یه روز زودتر بیدار شو و کارهای عقب‌افتاده رو انجام بده.','📖 یه کتاب انگیزشی بخون.'], motivations:['فقط یک قدم دیگه، هفته بعد حتماً می‌رسی.','نزدیک بودی، پس می‌تونی.','ناامید نشو، موفقیت در یک قدمی توست.'] },
            { min:45, max:50, type:'reward', texts:['🎁 هفته خوب بود! یه فیلم یا سریال موردعلاقه ببین.','🍕 یه پیتزا یا غذای خاص سفارش بده.','🌳 یه پیاده‌روی طولانی در آخر هفته.'], motivations:['به همین روال ادامه بده، هفته بعد بهتر می‌شه.','این هفته خوب بود، با قدرت ادامه بده.','پیشرفت مداوم، کلید موفقیت است.'] },
            { min:51, max:60, type:'reward', texts:['🎁 عالی! این هفته یه روز استراحت کامل به خودت بده.','🎮 یه بازی یا سرگرمی دلخواه.','☕ یه قهوه یا چای خاص در کافه‌ای دنج.'], motivations:['هفته خوبی داشتی، به خودت افتخار کن.','ادامه بده، داری عالی پیش می‌ری.','موفقیت، حاصل تکرار کارهای درست است.'] },
            { min:61, max:70, type:'reward', texts:['🎁 خیلی خوب! این هفته یه خرید کوچک یا یه هدیه به خودت بده.','🎬 یه فیلم سینمایی برو ببین.','🍽️ یه رستوران خوب برو.'], motivations:['داری عالی پیش می‌ری، این هفته رو جشن بگیر.','این یکی از بهترین هفته‌های تو بود.','با این روند، به همه اهداف‌ت می‌رسی.'] },
            { min:71, max:80, type:'reward', texts:['🎁 عالی‌ترین! این هفته یه سفر یک‌روزه یا طبیعت‌گردی برو.','🏆 یه جایزه بزرگ برای خودت در نظر بگیر.','🎉 یه مهمونی کوچک با دوستان نزدیک.'], motivations:['هفته‌ات بی‌نظیر بود، تو یک قهرمانی.','این موفقیت رو با دیگران تقسیم کن.','هیچ محدودیتی برای تو وجود نداره.'] },
            { min:81, max:100, type:'reward', texts:['🎁 افسانه‌ای! این هفته یه سفر یا تفریح خاص برنامه‌ریزی کن.','🏅 یه جایزه ویژه (مثلاً یه وسیله‌ای که دوست داری) بخر.','🌟 این هفته رو به‌عنوان بهترین هفته‌ات ثبت کن.'], motivations:['هفته‌ای که هیچ‌وقت فراموش نمی‌کنی، تو افسانه‌ای.','تو توانایی هر کاری رو داری، این رو به خاطر بسپار.','این بهترین عملکردته، حالا برای هفته بعد هم برنامه‌ریزی کن.'] }
        ]
    }
};

function getRewardDecision(period, rate) {
    const pool = period === 'weekly' ? rewardPools.weekly : rewardPools.daily;
    let found = pool.ranges.find(range => rate >= range.min && rate <= range.max);
    if (!found) {
        found = { type:'reward', texts:['🎉 عالی!'], motivations:['به راهت ادامه بده.'] };
    }
    return {
        type: found.type,
        text: randomPick(found.texts),
        motivation: randomPick(found.motivations)
    };
}

// ======================================================
// ۸. بروزرسانی صفحه جوایز
// ======================================================

function updateRewardsPage() {
    try {
        const todayActs = getTodayActivities();
        const weeklyActs = getWeeklyActivities();
        const monthlyActs = getMonthlyActivities();

        const dailyRate = calculateSuccessRate(todayActs);
        const weeklyRate = calculateSuccessRate(weeklyActs);
        const monthlyRate = calculateSuccessRate(monthlyActs);

        setElementText('dailyRewardPercent', dailyRate + '٪');
        setElementText('weeklyRewardPercent', weeklyRate + '٪');
        setElementText('monthlyRewardPercent', monthlyRate + '٪');

        setElementWidth('dailyRewardProgress', dailyRate + '%');
        setElementWidth('weeklyRewardProgress', weeklyRate + '%');
        setElementWidth('monthlyRewardProgress', monthlyRate + '%');

        const total = todayActs.length;
        const completed = todayActs.filter(a => a.status === 'completed').length;
        const partial = todayActs.filter(a => a.status === 'partial').length;
        const failed = todayActs.filter(a => a.status === 'failed').length;
        const scoreToday = todayActs.reduce((sum, a) => sum + (Number(a.score) || 0), 0);

        setElementText('rewardTotal', total);
        setElementText('rewardScore', scoreToday);
        setElementText('rewardCompleted', completed);
        setElementText('rewardPartial', partial);
        setElementText('rewardFailed', failed);

        const decision = getRewardDecision('daily', dailyRate);
        const decisionEl = document.getElementById('rewardDecisionText');
        const motivationEl = document.getElementById('rewardMotivationText');
        if (decisionEl) {
            decisionEl.textContent = decision.text;
            decisionEl.style.color = decision.type === 'reward' ? 'var(--success)' : 'var(--danger)';
        }
        if (motivationEl) {
            motivationEl.textContent = decision.motivation;
        }
    } catch (e) {
        console.error('خطا در updateRewardsPage:', e);
    }
}

// ======================================================
// ۹. توابع اصلی برنامه (رندر، شروع، پایان، حذف و ...)
// ======================================================

function render() {
    const list = document.getElementById('activityList');
    if (!list) return;
    list.innerHTML = '';
    const today = getTodayDate();
    const todayActivities = activities.filter(act => act.date === today);
    // حذف تکراری‌ها بر اساس id
    const unique = todayActivities.filter((act, index, self) =>
        index === self.findIndex(a => a.id === act.id)
    );
    if (unique.length === 0) {
        list.innerHTML = `<div class="empty-state">📭 هنوز هیچ فعالیتی برای امروز اضافه نکردی.</div>`;
        updateStats();
        updateRewardsPage();
        return;
    }
    const sorted = [...unique].sort((a,b) => getMinutes(a.start) - getMinutes(b.start));
    sorted.forEach(function(act) {
        const item = document.createElement('div');
        item.className = 'activity-item';
        if (act.status === 'completed') item.classList.add('activity-done');
        if (act.status === 'in_progress') item.classList.add('activity-running');

        let actionButton = '';
        if (act.status === 'pending') {
            actionButton = `<button class="done-btn" onclick="startActivityById(${act.id})">▶️</button>`;
        } else if (act.status === 'in_progress') {
            actionButton = `<button class="done-btn" onclick="openResultModal(${act.id})">🏁</button>`;
        } else if (act.status === 'completed') {
            actionButton = '✅';
        } else if (act.status === 'partial') {
            actionButton = '⚠️';
        } else if (act.status === 'failed') {
            actionButton = '❌';
        }

        let statusText = '';
        if (act.status === 'in_progress') statusText = '<small>🟢 در حال انجام</small>';
        else if (act.status === 'completed') statusText = '<small>✅ کامل انجام شد</small>';
        else if (act.status === 'partial') statusText = '<small>⚠️ ناقص انجام شد</small>';
        else if (act.status === 'failed') statusText = '<small>❌ انجام نشد</small>';
        else if (act.status === 'pending') statusText = '<small>⏳ در انتظار</small>';

        item.innerHTML = `
            <div class="activity-info">
                <h3>${escapeHTML(act.title)}</h3>
                <p>📅 ${act.date} | 🕐 ${act.start} تا ${act.end}</p>
                ${statusText}
            </div>
            <div>
                ${actionButton}
                <button class="delete-btn" onclick="deleteActivity(${act.id})">🗑</button>
            </div>
        `;
        list.appendChild(item);
    });
    updateStats();
    updateRewardsPage();
}

// شروع فعالیت
// ======================================================
// سیستم ثبت نتیجه فعالیت
// ======================================================

let selectedActivityId = null;

// باز کردن پنجره نتیجه
function openResultModal(id) {
    const activity = activities.find(a => a.id === id);
    if (!activity || activity.status !== 'in_progress') {
        return;
    }
    selectedActivityId = id;
    const titleEl = document.getElementById('resultActivityTitle');
    if (titleEl) {
        titleEl.textContent = 'فعالیت: ' + activity.title;
    }
    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// ثبت نتیجه فعالیت
function finishActivity(result, points) {
    const activity = activities.find(a => a.id === selectedActivityId);
    if (!activity || activity.status !== 'in_progress') {
        const modal = document.getElementById('resultModal');
        if (modal) modal.classList.add('hidden');
        selectedActivityId = null;
        return;
    }

    // اعمال تغییرات
    activity.status = result;
    activity.score = points;
    score += points;
    activity.finishedAt = new Date().toISOString();
    
    // ذخیره و بروزرسانی
    saveData();
    
    // بستن مودال
    const modal = document.getElementById('resultModal');
    if (modal) modal.classList.add('hidden');
    selectedActivityId = null;
    
    // رندر مجدد
    render();
    updateCurrentActivity();
    updateRewardsPage();
    
    // پیام مناسب
    const messages = {
        completed: '🎉 عالی! +' + points + ' امتیاز گرفتی.',
        partial: '⚠️ فعالیت ناقص انجام شد. +' + points + ' امتیاز گرفتی.',
        failed: '❌ این فعالیت انجام نشد.'
    };
    alert(messages[result] || 'نتیجه ثبت شد.');
}

// ======================================================
// اتصال دکمه‌های نتیجه (حتماً بعد از بارگذاری DOM)
// ======================================================

document.addEventListener('DOMContentLoaded', function() {
    const completeBtn = document.getElementById('completeResult');
    const partialBtn = document.getElementById('partialResult');
    const failedBtn = document.getElementById('failedResult');
    
    if (completeBtn) {
        completeBtn.addEventListener('click', function() {
            finishActivity('completed', 15);
        });
    }
    
    if (partialBtn) {
        partialBtn.addEventListener('click', function() {
            finishActivity('partial', 5);
        });
    }
    
    if (failedBtn) {
        failedBtn.addEventListener('click', function() {
            finishActivity('failed', 0);
        });
    }
});
// اتصال دکمه‌های نتیجه
document.getElementById('completeResult')?.addEventListener('click', function() { finishActivity('completed', 15); });
document.getElementById('partialResult')?.addEventListener('click', function() { finishActivity('partial', 5); });
document.getElementById('failedResult')?.addEventListener('click', function() { finishActivity('failed', 0); });

// ======================================================
// ۱۰. فعالیت فعلی و برنامه بعدی
// ======================================================

function updateCurrentActivity() {
    const today = getTodayDate();
    const now = getCurrentMinutes();
    const todayActs = activities.filter(act => act.date === today);
    let current = null, next = null;
    for (const act of todayActs) {
        const start = getMinutes(act.start);
        const end = getMinutes(act.end);
        if (now >= start && now < end && act.status !== 'completed' && act.status !== 'partial' && act.status !== 'failed') {
            current = act;
            break;
        }
        if (start > now && act.status !== 'completed' && act.status !== 'partial' && act.status !== 'failed') {
            if (!next || start < getMinutes(next.start)) next = act;
        }
    }
    const currentTask = document.getElementById('currentTask');
    const currentTime = document.getElementById('currentTime');
    const nextTask = document.getElementById('nextTask');
    const nextTime = document.getElementById('nextTime');
    const startButton = document.getElementById('startButton');

    if (current) {
        if (currentTask) currentTask.textContent = '🟢 ' + current.title;
        if (currentTime) currentTime.textContent = `${current.start} تا ${current.end}`;
        if (startButton) {
            startButton.disabled = false;
            if (current.status === 'in_progress') {
                startButton.textContent = '🏁 پایان فعالیت';
                startButton.onclick = function() { openResultModal(current.id); };
            } else {
                startButton.textContent = '▶️ شروع فعالیت';
                startButton.onclick = startCurrentActivity;
            }
        }
    } else {
        if (currentTask) currentTask.textContent = 'فعلاً فعالیتی در حال اجرا نیست';
        if (currentTime) currentTime.textContent = 'منتظر برنامه بعدی هستیم';
        if (startButton) {
            startButton.textContent = '▶️ شروع فعالیت';
            startButton.disabled = false;
            startButton.onclick = startCurrentActivity;
        }
    }
    if (next) {
        if (nextTask) nextTask.textContent = next.title;
        if (nextTime) nextTime.textContent = `${next.start} تا ${next.end}`;
    } else {
        if (nextTask) nextTask.textContent = 'برنامه بعدی وجود ندارد';
        if (nextTime) nextTime.textContent = '—';
    }
}

// ======================================================
// ۱۱. آمار
// ======================================================

function updateStats() {
    const today = getTodayDate();
    const todayActs = activities.filter(act => act.date === today);
    const unique = todayActs.filter((act, idx, self) => idx === self.findIndex(a => a.id === act.id));
    const total = unique.length;
    const completed = unique.filter(a => a.status === 'completed').length;
    const partial = unique.filter(a => a.status === 'partial').length;
    const failed = unique.filter(a => a.status === 'failed').length;
    const scoreToday = unique.reduce((sum, a) => sum + (Number(a.score) || 0), 0);

    setElementText('score', scoreToday);
    setElementText('completed', completed);
    setElementText('total', total);
    setElementText('reportTotal', total);
    setElementText('reportCompleted', completed);
    setElementText('reportPartial', partial);
    setElementText('reportFailed', failed);

    let rate = 0;
    if (total > 0) rate = Math.round((completed / total) * 100);
    setElementText('successRate', rate + '٪');

    const progress = document.getElementById('dailyProgress');
    if (progress) {
        progress.style.width = rate + '%';
        progress.setAttribute('aria-valuenow', rate);
    }
    updateRewardsPage();
}

// ======================================================
// ۱۲. تاریخ امروز در هدر
// ======================================================

function updateHeaderDate() {
    const el = document.getElementById('todayDate');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString('fa-IR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ======================================================
// ۱۳. مدیریت منوی پایین
// ======================================================

const todayPage = document.getElementById('todayPage');
const reportPage = document.getElementById('reportPage');
const rewardsPage = document.getElementById('rewardsPage');
const settingsPage = document.getElementById('settingsPage');
const navButtons = document.querySelectorAll('.bottom-nav button');

function showPage(page) {
    if (todayPage) todayPage.classList.add('hidden');
    if (reportPage) reportPage.classList.add('hidden');
    if (rewardsPage) rewardsPage.classList.add('hidden');
    if (settingsPage) settingsPage.classList.add('hidden');

    if (page === 'today' && todayPage) todayPage.classList.remove('hidden');
    else if (page === 'report' && reportPage) reportPage.classList.remove('hidden');
    else if (page === 'rewards' && rewardsPage) {
        rewardsPage.classList.remove('hidden');
        updateRewardsPage();
    } else if (page === 'settings' && settingsPage) settingsPage.classList.remove('hidden');
}

if (navButtons.length >= 4) {
    navButtons[0].addEventListener('click', function() {
        showPage('today');
        navButtons.forEach(b => b.classList.remove('nav-active'));
        navButtons[0].classList.add('nav-active');
    });
    navButtons[1].addEventListener('click', function() {
        showPage('report');
        navButtons.forEach(b => b.classList.remove('nav-active'));
        navButtons[1].classList.add('nav-active');
        updateReportPage();
    });
    navButtons[2].addEventListener('click', function() {
        showPage('rewards');
        navButtons.forEach(b => b.classList.remove('nav-active'));
        navButtons[2].classList.add('nav-active');
    });
    navButtons[3].addEventListener('click', function() {
        showPage('settings');
        navButtons.forEach(b => b.classList.remove('nav-active'));
        navButtons[3].classList.add('nav-active');
    });
}

// ======================================================
// ۱۴. گزارش (هفتگی/ماهانه)
// ======================================================

function updateReportPage() {
    try {
        const mode = localStorage.getItem('daycoach_report_mode') || 'weekly';
        const now = new Date();
        let startDate, endDate;
        if (mode === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
        } else {
            const dayOfWeek = now.getDay();
            const daysFromSaturday = (dayOfWeek + 1) % 7;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - daysFromSaturday);
            startDate.setHours(0,0,0,0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
        }
        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);
        const reportActs = activities.filter(act => act.date >= startStr && act.date <= endStr);
        const total = reportActs.length;
        const completed = reportActs.filter(a => a.status === 'completed').length;
        const partial = reportActs.filter(a => a.status === 'partial').length;
        const failed = reportActs.filter(a => a.status === 'failed').length;
        const scoreReport = reportActs.reduce((sum, a) => sum + (Number(a.score) || 0), 0);
        let success = 0;
        if (total > 0) success = Math.round((completed / total) * 100);

        setElementText('reportPageTotal', total);
        setElementText('reportPageCompleted', completed);
        setElementText('reportPagePartial', partial);
        setElementText('reportPageFailed', failed);
        setElementText('reportPageScore', scoreReport);
        setElementText('reportPageSuccess', success + '٪');

        const weeklyBtn = document.getElementById('weeklyReportBtn');
        const monthlyBtn = document.getElementById('monthlyReportBtn');
        if (weeklyBtn) weeklyBtn.classList.toggle('active', mode === 'weekly');
        if (monthlyBtn) monthlyBtn.classList.toggle('active', mode === 'monthly');
    } catch (e) {
        console.error('خطا در updateReportPage:', e);
    }
}

document.getElementById('weeklyReportBtn')?.addEventListener('click', function() {
    localStorage.setItem('daycoach_report_mode', 'weekly');
    updateReportPage();
});
document.getElementById('monthlyReportBtn')?.addEventListener('click', function() {
    localStorage.setItem('daycoach_report_mode', 'monthly');
    updateReportPage();
});

// ======================================================
// ۱۵. تقویم شمسی
// ======================================================

let calendarYear, calendarMonth;

function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
    let jy = (gy > 1600) ? 979 : 0;
    if (gy > 1600) gy -= 1600;
    else gy -= 621;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days = 365*gy + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400) - 80 + gd + g_d_m[gm-1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
        jy += Math.floor((days-1)/365);
        days = (days-1) % 365;
    }
    let jm, jd;
    if (days < 186) {
        jm = 1 + Math.floor(days/31);
        jd = 1 + (days % 31);
    } else {
        jm = 7 + Math.floor((days-186)/30);
        jd = 1 + ((days-186) % 30);
    }
    return [jy, jm, jd];
}

function jalaliToGregorian(jy, jm, jd) {
    let gy = (jy > 979) ? 1600 : 621;
    if (jy > 979) jy -= 979;
    const days = 365*jy + Math.floor(jy/33)*8 + Math.floor(((jy%33)+3)/4) + 78 + jd + (jm<7 ? (jm-1)*31 : (jm-7)*30+186);
    gy += 400 * Math.floor(days / 146097);
    let d = days % 146097;
    if (d > 36524) {
        gy += 100 * Math.floor(--d / 36524);
        d %= 36524;
        if (d >= 365) d++;
    }
    gy += 4 * Math.floor(d / 1461);
    d %= 1461;
    if (d > 365) {
        gy += Math.floor((d-1)/365);
        d = (d-1) % 365;
    }
    const gd = d + 1;
    const sal_a = [0,31, (gy%4===0 && (gy%100!==0 || gy%400===0)) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
    let gm = 0;
    let day = gd;
    while (day > sal_a[gm]) { day -= sal_a[gm]; gm++; }
    return [gy, gm, day];
}

function getJalaliMonthDays(year, month) {
    if (month <= 6) return 31;
    if (month <= 11) return 30;
    const nextYear = year + 1;
    const first = new Date(jalaliToGregorian(year, 12, 1)[0], jalaliToGregorian(year, 12, 1)[1]-1, jalaliToGregorian(year, 12, 1)[2]);
    const second = new Date(jalaliToGregorian(nextYear, 1, 1)[0], jalaliToGregorian(nextYear, 1, 1)[1]-1, jalaliToGregorian(nextYear, 1, 1)[2]);
    return Math.round((second - first) / 86400000);
}

function getFirstDayOfJalaliMonth(year, month) {
    const g = jalaliToGregorian(year, month, 1);
    const date = new Date(g[0], g[1]-1, g[2]);
    return (date.getDay() + 1) % 7;
}

function getTodayJalali() {
    const now = new Date();
    return gregorianToJalali(now.getFullYear(), now.getMonth()+1, now.getDate());
}

function toPersianNumber(num) {
    return String(num).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function renderJalaliCalendar() {
    const title = document.getElementById('calendarTitle');
    const daysContainer = document.getElementById('calendarDays');
    if (!title || !daysContainer) return;
    const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    title.textContent = monthNames[calendarMonth-1] + ' ' + toPersianNumber(calendarYear);
    daysContainer.innerHTML = '';
    const firstDay = getFirstDayOfJalaliMonth(calendarYear, calendarMonth);
    const daysInMonth = getJalaliMonthDays(calendarYear, calendarMonth);
    const today = getTodayJalali();

    for (let i=0; i<firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        daysContainer.appendChild(empty);
    }
    for (let d=1; d<=daysInMonth; d++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'calendar-day';
        btn.textContent = toPersianNumber(d);
        btn.dataset.day = d;
        if (today[0]===calendarYear && today[1]===calendarMonth && today[2]===d) {
            btn.classList.add('today');
        }
        const g = jalaliToGregorian(calendarYear, calendarMonth, d);
        const dateStr = `${g[0]}-${String(g[1]).padStart(2,'0')}-${String(g[2]).padStart(2,'0')}`;
        if (activities.some(a => a.date === dateStr)) {
            btn.classList.add('has-activity');
        }
        btn.addEventListener('click', function() {
            showSelectedDayReport(calendarYear, calendarMonth, d);
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
        });
        daysContainer.appendChild(btn);
    }
}

function showSelectedDayReport(year, month, day) {
    const container = document.getElementById('selectedDayReport');
    if (!container) return;
    const g = jalaliToGregorian(year, month, day);
    const dateStr = `${g[0]}-${String(g[1]).padStart(2,'0')}-${String(g[2]).padStart(2,'0')}`;
    const dayActs = activities.filter(a => a.date === dateStr);
    const completed = dayActs.filter(a => a.status === 'completed').length;
    const partial = dayActs.filter(a => a.status === 'partial').length;
    const failed = dayActs.filter(a => a.status === 'failed').length;
    const pending = dayActs.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
    const scoreDay = dayActs.reduce((s, a) => s + (Number(a.score) || 0), 0);
    const finished = completed + partial + failed;
    let successRate = 0;
    if (finished > 0) successRate = Math.round((completed / finished) * 100);
    const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    const title = monthNames[month-1] + ' ' + toPersianNumber(day) + ' ' + toPersianNumber(year);

    if (dayActs.length === 0) {
        container.innerHTML = `<div class="selected-report-header"><strong>📅 ${title}</strong></div><div class="selected-report-empty">📭 در این روز هیچ فعالیتی ثبت نشده است.</div>`;
        return;
    }
    let html = `<div class="selected-report-header"><strong>📅 ${title}</strong></div>
        <div class="selected-report-stats">
            <div><strong>${toPersianNumber(dayActs.length)}</strong><small>کل</small></div>
            <div><strong>${toPersianNumber(completed)}</strong><small>کامل</small></div>
            <div><strong>${toPersianNumber(partial)}</strong><small>ناقص</small></div>
            <div><strong>${toPersianNumber(failed)}</strong><small>انجام‌نشده</small></div>
        </div>
        <div class="selected-report-extra">
            <p>⏳ در انتظار: <strong>${toPersianNumber(pending)}</strong></p>
            <p>⭐ امتیاز: <strong>${toPersianNumber(scoreDay)}</strong></p>
            <p>🎯 موفقیت: <strong>${toPersianNumber(successRate)}٪</strong></p>
        </div>
        <div class="selected-report-activities">`;
    dayActs.forEach(a => {
        let icon = '⏳';
        if (a.status === 'completed') icon = '✅';
        else if (a.status === 'partial') icon = '⚠️';
        else if (a.status === 'failed') icon = '❌';
        html += `<div class="selected-activity"><span>${icon}</span><div><strong>${escapeHTML(a.title)}</strong><small>🕐 ${a.start} تا ${a.end}</small></div></div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

// مقداردهی اولیه تقویم
const todayJ = getTodayJalali();
calendarYear = todayJ[0];
calendarMonth = todayJ[1];
renderJalaliCalendar();

document.getElementById('prevMonth')?.addEventListener('click', function() {
    calendarMonth--;
    if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
    renderJalaliCalendar();
});
document.getElementById('nextMonth')?.addEventListener('click', function() {
    calendarMonth++;
    if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
    renderJalaliCalendar();
});
document.getElementById('calendarToday')?.addEventListener('click', function() {
    const t = getTodayJalali();
    calendarYear = t[0];
    calendarMonth = t[1];
    renderJalaliCalendar();
});

// ======================================================
// ۱۶. مدیریت مودال‌ها (افزودن فعالیت)
// ======================================================

const modal = document.getElementById('modal');
document.getElementById('addActivity')?.addEventListener('click', function() {
    if (modal) modal.classList.remove('hidden');
});
document.getElementById('cancelActivity')?.addEventListener('click', function() {
    if (modal) modal.classList.add('hidden');
});

document.getElementById('saveActivity')?.addEventListener('click', function() {
    const title = document.getElementById('activityTitle')?.value?.trim();
    const date = document.getElementById('activityDate')?.value;
    const start = document.getElementById('startTime')?.value;
    const end = document.getElementById('endTime')?.value;
    const reminder = Number(document.getElementById('reminder')?.value || 0);
    if (!title) { alert('لطفاً عنوان فعالیت را وارد کن.'); return; }
    if (!date) { alert('لطفاً تاریخ را انتخاب کن.'); return; }
    if (!start || !end) { alert('زمان شروع و پایان را وارد کن.'); return; }
    if (getMinutes(end) <= getMinutes(start)) { alert('زمان پایان باید بعد از زمان شروع باشد.'); return; }
    const activity = {
        id: Date.now(),
        title: title,
        date: date,
        start: start,
        end: end,
        reminder: reminder,
        status: 'pending',
        score: 0,
        startedAt: null,
        finishedAt: null,
        delayMinutes: 0
    };
    activities.push(activity);
    saveData();
    document.getElementById('activityTitle').value = '';
    document.getElementById('activityDate').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    if (modal) modal.classList.add('hidden');
    render();
    updateCurrentActivity();
    updateRewardsPage();
});

// تنظیم تاریخ امروز در فرم
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('activityDate');
    if (dateInput) dateInput.value = getTodayDate();
});

// ======================================================
// ۱۷. نوتیفیکیشن‌های چندباره
// ======================================================

// ======================================================
// درخواست مجوز اعلان در شروع برنامه
// ======================================================

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('مرورگر از Notification پشتیبانی نمی‌کند.');
        return;
    }
    if (Notification.permission === 'granted') {
        console.log('✅ مجوز اعلان قبلاً داده شده.');
        return;
    }
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                console.log('✅ مجوز اعلان دریافت شد.');
            } else {
                console.log('❌ مجوز اعلان رد شد.');
            }
        });
    }
}

// اجرا در شروع برنامه (این خط را در بخش اجرای اولیه قرار دهید)
// requestNotificationPermission();


// ======================================================
// سیستم یادآوری چندباره (با Notification)
// ======================================================

function checkMultiReminders() {
    const today = getTodayDate();
    const now = getCurrentMinutes();
    
    activities.forEach(function(act) {
        // فقط فعالیت‌های امروز که هنوز تمام نشده‌اند
        if (act.date !== today) return;
        if (['completed','partial','failed'].includes(act.status)) return;
        if (!act.reminder || act.reminder === 0) return;
        
        const start = getMinutes(act.start);
        const reminderTimes = [
            { offset: 10, label: '۱۰ دقیقه قبل' },
            { offset: 5, label: '۵ دقیقه قبل' },
            { offset: 2.5, label: '۲.۵ دقیقه قبل' },
            { offset: 0, label: 'زمان شروع' }
        ];
        
        reminderTimes.forEach(function(item) {
            const remindMin = start - item.offset;
            // بازه نیم دقیقه برای جلوگیری از تکرار
            if (now >= remindMin && now < remindMin + 0.5) {
                const key = 'daycoach_reminded_' + act.id + '_' + item.offset;
                if (localStorage.getItem(key)) return;
                localStorage.setItem(key, 'true');

                // ---------- نمایش اعلان حرفه‌ای ----------
                if ('Notification' in window && Notification.permission === 'granted') {
                    // اعلان با صدای پیش‌فرض گوشی و لرزش
                    new Notification('🔔 DayCoach', {
                        body: `${act.title}\n⏰ ساعت ${act.start}\n${item.label}`,
                        icon: 'icons/icon-192.png',  // اگر آیکون ندارید، این خط را پاک کنید
                        vibrate: [200, 100, 200],     // لرزش
                        requireInteraction: true,     // تا وقتی کاربر کلیک نکند، بسته نمی‌شود
                        actions: [
                            { action: 'open', title: '📱 باز کردن' }
                        ]
                    });
                } else {
                    // اگر مجوز نداشت، همان alert قبلی (برای اطمینان)
                    alert(
                        `🔔 یادآوری DayCoach\n\n` +
                        `${act.title}\n` +
                        `⏰ ساعت ${act.start}\n` +
                        `${item.label}`
                    );
                }
            }
        });
    });
}


// ======================================================
// ۱۸. دارک مود
// ======================================================

const darkToggle = document.getElementById('darkModeToggle');
let darkMode = localStorage.getItem('daycoach_dark') === 'true';

function applyDarkMode(enable) {
    if (enable) {
        document.body.classList.add('dark-mode');
        if (darkToggle) { darkToggle.textContent = 'فعال'; darkToggle.classList.add('dark-active'); }
    } else {
        document.body.classList.remove('dark-mode');
        if (darkToggle) { darkToggle.textContent = 'غیرفعال'; darkToggle.classList.remove('dark-active'); }
    }
    localStorage.setItem('daycoach_dark', String(enable));
    darkMode = enable;
}

if (darkToggle) {
    darkToggle.addEventListener('click', function() {
        applyDarkMode(!darkMode);
    });
}
applyDarkMode(darkMode);

// ======================================================
// ۱۹. بروزرسانی دوره‌ای
// ======================================================

setInterval(function() {
    updateExpiredActivities();
    updateCurrentActivity();
    updateStats();
    updateRewardsPage();
}, 30000);

function updateExpiredActivities() {
    const today = getTodayDate();
    const now = getCurrentMinutes();
    let changed = false;
    activities.forEach(function(act) {
        if (act.date !== today) return;
        if (act.status !== 'pending') return;
        if (now >= getMinutes(act.end)) {
            act.status = 'failed';
            act.score = 0;
            act.finishedAt = new Date().toISOString();
            changed = true;
        }
    });
    if (changed) {
        saveData();
        render();
        updateCurrentActivity();
        updateRewardsPage();
    }
}

// ======================================================
// ۲۰. اجرای اولیه
// ======================================================

updateHeaderDate();
updateExpiredActivities();
render();
updateCurrentActivity();
updateStats();
updateReportPage();
updateRewardsPage();
checkMultiReminders();

// ======================================================
// ۲۱. اتصال کلیک برای نمایش نتیجه (در صورت نیاز)
// ======================================================

// دکمه startButton در updateCurrentActivity تعریف شده، ولی برای اطمینان:
document.getElementById('startButton')?.addEventListener('click', function() {
    // این رویداد در updateCurrentActivity بازنویسی می‌شود، فعلاً کاری نمی‌کنیم.
});

console.log('✅ DayCoach با موفقیت بارگذاری شد.');
// ======================================================
// راه‌اندازی مجدد انیمیشن نوارها هنگام تغییر
// ======================================================

function triggerProgressAnimation(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    // حذف و اضافه مجدد کلاس برای اجرای دوباره انیمیشن
    el.style.animation = 'none';
    setTimeout(() => {
        el.style.animation = '';
    }, 10);
}

// نظارت بر تغییرات نوارها و اجرای انیمیشن
const originalSetWidth = setElementWidth;
setElementWidth = function(id, width) {
    originalSetWidth(id, width);
    if (id === 'dailyRewardProgress' || id === 'weeklyRewardProgress' || 
        id === 'monthlyRewardProgress' || id === 'dailyProgress') {
        setTimeout(() => {
            triggerProgressAnimation(id);
        }, 50);
    }
};

// همچنین هنگام بارگذاری صفحه، انیمیشن نوارها را فعال می‌کند
document.addEventListener('DOMContentLoaded', function() {
    ['dailyProgress', 'dailyRewardProgress', 'weeklyRewardProgress', 'monthlyRewardProgress'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.width !== '0%' && el.style.width !== '') {
            triggerProgressAnimation(id);
        }
    });
});
