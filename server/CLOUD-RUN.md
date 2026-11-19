# EduYuz backend — Google Cloud Run'ga ko'chirish (bepul)

Sayt (frontend) **Vercel**da, baza **Supabase**da qoladi. Faqat backend server Render'dan Google Cloud Run'ga ko'chadi.

```
Foydalanuvchi → www.eduyuz.uz (Vercel) → eduyuz-api-…run.app (Cloud Run) → Supabase
```

**Narxi.** Cloud Run'ning har oylik bepul limiti bor. Taxminan: 2 million so'rov, 180 000 vCPU-soniya va 360 000 GiB-soniya.
Bitta o'quv markazi uchun bu yetarli.
Ro'yxatdan o'tishda Visa yoki Mastercard so'raladi. Karta faqat tasdiqlash uchun. Pastdagi 2-qadamda xarajat chegarasi va ogohlantirish qo'yamiz.

---

## 1. Google Cloud hisobini ochish

1. https://console.cloud.google.com ga Gmail bilan kiring.
2. Tepada **Select a project → New project** ni bosing. Nom: `eduyuz` → **Create**.
3. Chap menyudan **Billing**ni oching va karta qo'shib hisobni faollashtiring.
   Yangi hisobga odatda bepul sinov krediti ham beriladi.

## 2. Xarajat ogohlantirishi (xavfsizlik uchun, 1 daqiqa)

**Billing → Budgets & alerts → Create budget** ni oching.
- Nom: `eduyuz`.
- Amount: **1 USD**.
- Ogohlantirishlar: 50%, 90%, 100%.

Shunda biror narsa pullik bo'la boshlasa, emailingizga darhol xabar keladi.

## 3. Serverni yaratish (GitHub'dan avtomatik)

1. Qidiruvga **Cloud Run** deb yozing → **Deploy container** (yoki **Create service**).
2. **Continuously deploy from a repository (source or function)** → **Set up with Cloud Build**.
3. **Repository provider: GitHub** → GitHub'ga ulang → `Tursunov006/EduYuz` → **Next**.
4. Sozlamalar:
   - **Branch:** `^main$`
   - **Build type:** **Dockerfile**
   - **Source location:** `/edyuz-backend/Dockerfile`
   - → **Save**
5. Xizmat sozlamalari:
   - **Service name:** `eduyuz-api`
   - **Region:** `europe-west1 (Belgium)`
   - **Authentication:** **Allow public access** (sayt va Telegram ulanishi uchun shart)
   - **Billing:** **Request-based**. Server faqat so'rov kelganda pul hisoblaydi.
   - **Service scaling / Auto scaling:** Min **0**, Max **2**
   - **Ingress:** All
6. **Container(s), Volumes, Networking, Security** bo'limini oching:
   - **Container port:** `8080` qoldiring.
   - **Memory:** `512 MiB`, **CPU:** `1`.
   - **Startup CPU boost:** yoqing (server tezroq uyg'onadi).
   - **Variables & Secrets** → **Add variable**. Render → eduyuz → **Environment** dagi qiymatlarni **aynan** ko'chiring:

     | Nom | Izoh |
     |---|---|
     | `DATABASE_URL` | Supabase baza manzili |
     | `JWT_SECRET` | **Render'dagi bilan bir xil bo'lishi shart** |
     | `ENCRYPTION_KEY` | **Render'dagi bilan bir xil bo'lishi shart** |
     | `TELEGRAM_BOT_TOKEN` | bot tokeni |
     | `SUPERADMIN_PHONE`, `SUPERADMIN_PASSWORD` | Render'da bo'lsa |
     | `TELEGRAM_DEFAULT_CENTER_ID`, `TELEGRAM_WEBAPP_URL`, `WEB_APP_URL`, `CORS_ORIGINS` | Render'da bo'lsa |
     | SMS / AI / to'lov kalitlari (`ESKIZ_*`, `GEMINI_API_KEY`, `CLICK_*` …) | Render'da bo'lsa |

     `RENDER_EXTERNAL_URL` ni ko'chirmang.
     > ⚠️ `JWT_SECRET` yoki `ENCRYPTION_KEY` Render'dagidan farq qilsa, hech kim tizimga kira olmaydi va shifrlangan ma'lumotlar o'qilmaydi.
7. **Create** ni bosing. Birinchi build 5–10 daqiqa davom etadi.

Tayyor bo'lgach, tepada server manzili chiqadi, masalan `https://eduyuz-api-abc123-ew.a.run.app`.
Tekshirish uchun brauzerda shu manzilni oching: `…run.app/api/v1/health` → `{"status":"ok","db":"up"}` chiqishi kerak.

## 4. Telegram botni yangi serverga ulash

**Cloud Run → eduyuz-api → Edit & deploy new revision → Variables & Secrets** → yangi o'zgaruvchi qo'shing:
```
TELEGRAM_WEBHOOK_URL = https://<sizning-manzilingiz>.run.app/api/v1/telegram/webhook
```
Keyin **Deploy** ni bosing. Server ishga tushganda botni o'zi shu manzilga ulaydi.

## 5. Saytni yangi serverga ulash

**Vercel → edu-yuz → Settings → Environment Variables** ni oching:
```
NEXT_PUBLIC_API_URL = https://<sizning-manzilingiz>.run.app/api/v1
```
So'ng **Deployments → oxirgisi → Redeploy** ni bosing.

## 6. Serverni ish vaqtida uyg'oq saqlash (ixtiyoriy, tavsiya)

**GitHub → EduYuz → Settings → Secrets and variables → Actions → Variables → New repository variable**:
```
BACKEND_HEALTH_URL = https://<sizning-manzilingiz>.run.app/api/v1/health
```
Bu Toshkent vaqti bilan 06:00–23:59 oralig'ida har 10 daqiqada serverni tekshirib turadi. Natijada:
- server tez javob beradi;
- Supabase bazasi uxlab qolmaydi.

Kechasi server uxlaydi. Birinchi ochilishda 10–20 soniya kutiladi.

## 7. Render'ni o'chirish (MUHIM)

Render keyingi oy boshida o'zi qayta yoqiladi. Shunda u Telegram botni o'ziga tortib oladi va bot ishlamay qoladi.
Shuning uchun **Render → eduyuz → Settings → Delete Web Service** qiling.
Zaxira kerak bo'lsa, o'chirish o'rniga **Environment** dan `TELEGRAM_BOT_TOKEN` ni olib tashlang.

---

## Keyinchalik
- **Yangi kod:** `main` ga birlashtirilgan har bir o'zgarish Cloud Run'ga **avtomatik** chiqadi. Manual Deploy bosish shart emas.
- **Loglar:** Cloud Run → eduyuz-api → **Logs**.
- **Xarajat:** Billing → Reports. Odatda 0 so'm bo'ladi.
