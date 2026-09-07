# 🎓 EduYuz — O‘quv Markazlari Boshqaruvi (CRM, ERP & LMS)

Zamonaviy o‘quv markazlari, xususiy maktablar va IT-akademiyalar uchun to‘liq avtomatlashtirilgan boshqaruv platformasi.

---

## 🌟 Asosiy Imkoniyatlar

### 1. 👥 O‘quvchilar va Guruhlar
- O‘quvchilar bazasi, to‘liq kontakt ma'lumotlari va hisob balansi nazorati.
- Guruhlar, dars jadvali (kunlar, soatlar) va biriktirilgan o‘qituvchilar.
- O‘quvchilarni 1-klikda guruhga biriktirish yoki guruhdan chiqarish.

### 2. 📅 Davomat & Xabarnomalar
- Tezkor davomat qilish jurnali (Keldi, Kelmadi, Kechikdi).
- Darsga kelgan talabalarga avtomatik **+10 EduCoin** rag‘batlantirish.
- Kelmagan o‘quvchilar ota-onalariga **Telegram Bot** va **Eskiz.uz SMS** orqali avtomatik bildirishnoma.

### 3. 💳 To‘lovlar & Avtomatik Billing
- Naqd pul, Bank kartasi, Click va Payme to‘lovlarini qabul qilish.
- Elektron to‘lov cheklari (kvitansiyalar).
- Barcha guruhlardan bir tugma bilan oylik to‘lov yechish (avtomatik hisoblash va qarzdorlik holati).

### 4. 👨‍🏫 O‘qituvchilar & Oylik Maosh (Payroll)
- O‘qituvchilar tarkibi, fanlari va biriktirilgan guruhlari.
- Maosh hisoblash sxemalari: **Foiz stavkasi (%)** (guruh tushumidan) yoki **Qat'iy oylik**.
- Joriy oydagi hisoblangan maosh va qoldiq summani avtomatik ko‘rsatish.
- Oylik berish kvitansiyalari va to‘lovlar tarixi.

### 5. 💸 Moliya, Xarajatlar & Sof Foyda (Net Profit)
- Chiqimlar toifalari (Ijara, kommunal, oyliklar, marketing, uskunalar, kanselyariya, soliqlar).
- **Haqiqiy Sof Foyda (Net Profit)** = `Jami Kirim - Jami Chiqim (Operatsion + Oyliklar)`.
- Xarajatlarning vizual foizli diagrammasi.

### 6. 📲 Aloqa: Telegram Bot & SMS Gateway
- **Telegram Bot:** Rasmiy xabardor qiluvchi bot (`@Edyuz_crmbot`).
- **Eskiz.uz SMS Gateway:** Ota-onalarga SMS kvitansiyalar, davomat xabarlari va qarzdorlik eslatmalari.
- **Tezkor SMS tugmasi:** Bosh sahifa va o‘quvchilar jadvalidan 1-klikda SMS jo‘natish.

### 7. 📱 O‘quvchi & Ota-ona Shaxsiy Portali (Mobile WebApp)
- Balans, to‘plangan EduCoinlar va dars jadvali.
- Davomat tarixi va to‘lovlar cheklari.
- Video darslar, uy vazifalarni ko‘rish va topshirish.
- Bitiruv sertifikatlarini yuklab olish.

### 8. 🏆 Gamifikatsiya (EduCoins & Leaderboard)
- O‘quvchilar reytingi (Top 3 shohsupa va jadval).
- Darsdagi faollik, uy vazifasi va davomat uchun coinlar berish.

### 9. 📜 QR-kodli Rasmiy Sertifikatlar
- A4 formatidagi chop etishga tayyor sertifikat shabloni.
- Haqiqiylikni tasdiqlovchi jonli QR-kod.
- Ochiq tekshirish sahifasi (`/verify/[certNumber]`).

---

## 🛠 Texnologiyalar Steki

| Qism | Texnologiya |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router, Turbopack), Tailwind CSS, Lucide Icons, Axios |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, MySQL, JWT, Passport, Bcrypt |
| **Integratsiyalar** | Telegram Bot API, Eskiz.uz SMS REST API, QRCode, Canvas |

---

## 🚀 O‘rnatish va Ishga Tushirish

### 1. Repozitoriyani klonlash
```bash
git clone https://github.com/Tursunov006/EduYuz.git
cd EduYuz
```

### 2. Backend sozlamalari
```bash
cd backend
npm install
cp .env.example .env
# .env faylida MySQL ma'lumotlarini to'ldiring:
# DATABASE_URL="mysql://root:password@localhost:3306/edyuz_db"

npx prisma db push
npm run start:dev
```
Backend ishga tushadi: `http://localhost:3000/api/v1`

### 3. Frontend sozlamalari
```bash
cd ../frontend
npm install
npm run dev
```
Frontend ishga tushadi: `http://localhost:3000` (yoki `http://localhost:3001`)

---

## 👨‍💻 Muallif
**Ibrohim Tursunov**  
GitHub: [@Tursunov006](https://github.com/Tursunov006)
