# EduYuz backend — Vercel'ga ko'chirish (bepul)

Hozir sayt (frontend) Vercel'da, baza Supabase'da turibdi. Endi backend server ham Render'dan **Vercel**ga ko'chadi.
Vercel serverni doim yoqiq ushlab turmaydi: har bir so'rov kelganda kodni qisqa vaqtga ishga tushiradi.
Shuning uchun Render'dagidek "oyiga 750 soat" cheklovi yo'q.

```
Foydalanuvchi → www.eduyuz.uz (Vercel) → eduyuz-api.vercel.app (Vercel) → Supabase
```

**Eslatmalar:**
- Vercel'ning bepul (Hobby) tarifi rasman shaxsiy, notijorat loyihalar uchun mo'ljallangan.
- Server bir muddat ishlatilmasa, birinchi so'rov 3–10 soniya kutishi mumkin.
- Bitta so'rov hajmi 4.5 MB dan oshmasligi kerak (masalan, katta rasm yuklash).

---

## 1. Yangi Vercel loyihasi

1. https://vercel.com/new ni oching → **Import Git Repository** → `Tursunov006/EduYuz` → **Import**.
2. Sozlamalar:
   - **Project Name:** `eduyuz-api`
   - **Framework Preset:** **Other**
   - **Root Directory:** **Edit** → `edyuz-backend` → **Continue**
   - **Build and Output Settings:** tegmang. Ular `edyuz-backend/vercel.json` faylidan olinadi.
3. **Environment Variables** bo'limiga Render → eduyuz → **Environment** dagi qiymatlarni **aynan** ko'chiring:

   | Nom | Izoh |
   |---|---|
   | `DATABASE_URL` | Supabase baza manzili |
   | `JWT_SECRET` | **Render'dagi bilan bir xil bo'lishi shart** |
   | `ENCRYPTION_KEY` | **Render'dagi bilan bir xil bo'lishi shart** |
   | `TELEGRAM_BOT_TOKEN` | bot tokeni |
   | `SUPERADMIN_PHONE`, `SUPERADMIN_PASSWORD` | Render'da bo'lsa |
   | `TELEGRAM_DEFAULT_CENTER_ID`, `TELEGRAM_WEBAPP_URL`, `WEB_APP_URL`, `CORS_ORIGINS` | Render'da bo'lsa |
   | SMS / AI / to'lov kalitlari (`ESKIZ_*`, `GEMINI_API_KEY`, `CLICK_*` …) | Render'da bo'lsa |

   `RENDER_EXTERNAL_URL` va `PORT` ni ko'chirmang.
   > ⚠️ `JWT_SECRET` yoki `ENCRYPTION_KEY` farq qilsa, hech kim tizimga kira olmaydi va shifrlangan ma'lumotlar o'qilmaydi.
4. **Deploy** ni bosing. 2–4 daqiqa kutasiz.

## 2. Faqat Production uchun (xavfsizlik)

**eduyuz-api → Settings → Environment Variables** ni oching. Har bir o'zgaruvchi faqat **Production** uchun belgilangan bo'lsin, Preview va Development'dan belgini olib tashlang.

Sababi: GitHub'dagi har bir PR uchun sinov (preview) nusxa yaratiladi. Bu sinov nusxalari haqiqiy bazangizga ulanmasligi kerak.

## 3. Tekshirish

Brauzerda shu manzilni oching: `https://eduyuz-api.vercel.app/api/v1/health`
Natija `{"status":"ok","db":"up"}` bo'lishi kerak.

Shu birinchi ochilishda server Telegram botni o'zi yangi manzilga ulaydi.

## 4. Saytni yangi serverga ulash

**Vercel → edu-yuz (sayt loyihasi) → Settings → Environment Variables** ni oching:
```
NEXT_PUBLIC_API_URL = https://eduyuz-api.vercel.app/api/v1
```
So'ng **Deployments → oxirgisi → ⋯ → Redeploy** ni bosing.

## 5. Render'ni o'chirish (MUHIM)

Render keyingi oy boshida o'zi qayta yoqiladi. Shunda u Telegram botni o'ziga tortib oladi va bot ishlamay qoladi.
Shuning uchun **Render → EduYuz → Settings → Delete Web Service** qiling.
Zaxira kerak bo'lsa, o'chirish o'rniga **Environment** dan `TELEGRAM_BOT_TOKEN` ni olib tashlang.

## 6. Bazani uyg'oq saqlash (ixtiyoriy)

Supabase bepul bazasi bir hafta ishlatilmasa to'xtatiladi. Buning oldini olish uchun:
**GitHub → EduYuz → Settings → Secrets and variables → Actions → Variables** ga yangi o'zgaruvchi qo'shing:
```
BACKEND_HEALTH_URL = https://eduyuz-api.vercel.app/api/v1/health
```

---

## Keyinchalik
- **Yangi kod:** `main` ga birlashtirilgan har bir o'zgarish Vercel'ga **avtomatik** chiqadi.
  Bazaga yangi maydon qo'shilsa ham, u deploy paytida bazaga o'zi qo'shiladi (`prisma db push`).
- **Loglar:** Vercel → eduyuz-api → **Logs**.
- **Cheklovlar:** Vercel → eduyuz-api → **Usage**.
