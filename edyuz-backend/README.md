# EdYuz Backend API

O'quv markazlari va ta'lim muassasalarini avtomatlashtirish (CRM / ERP) tizimi uchun NestJS va Prisma asosida ishlab chiqilgan backend API.

---

## 📁 Loyiha strukturasi

```
edyuz-backend/
├── prisma/
│   └── schema.prisma           # Ma'lumotlar bazasi modellari va aloqalari
├── src/
│   ├── common/
│   │   ├── decorators/         # @CurrentUser, @Roles, @Public
│   │   ├── filters/            # Global HttpExceptionFilter
│   │   └── guards/             # JwtAuthGuard, RolesGuard
│   ├── modules/
│   │   ├── prisma/             # Prisma ORM ulanishi va xizmati
│   │   ├── auth/               # Ro'yxatdan o'tish, login, JWT
│   │   ├── centers/            # O'quv markazlari boshqaruvi
│   │   ├── users/              # Foydalanuvchilar va xodimlar boshqaruvi
│   │   ├── courses/            # Kurslar va fanlar boshqaruvi
│   │   ├── groups/             # Guruhlar va dars jadvallari
│   │   ├── students/           # O'quvchilar profillari
│   │   ├── attendance/         # Guruhlar bo'yicha davomat
│   │   └── payments/           # To'lovlar va talaba balansi
│   ├── app.module.ts           # Asosiy dastur moduli
│   └── main.ts                 # Dasturni ishga tushirish kirish nuqtasi
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 O'rnatish va Ishga tushirish

### 1. Bog'liqliklarni o'rnatish:
```bash
npm install
```

### 2. Muhit parametrlarini sozlash (`.env`):
`.env.example` faylidan nusxa olib `.env` faylini to'ldiring (barcha o'zgaruvchilar izohi o'sha faylda):
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/edyuz_db?schema=public"

# openssl rand -hex 32 bilan yarating
JWT_SECRET=""
JWT_EXPIRES_IN="7d"
CORS_ORIGINS="https://sizning-domen.uz"
TELEGRAM_BOT_TOKEN=""
```

### 🔐 Xavfsizlik qoidalari
- **Barcha endpointlar sukut bo'yicha login talab qiladi** (global `JwtAuthGuard` + `RolesGuard`). Ochiq qilish kerak bo'lsa, ongli ravishda `@Public()` qo'yiladi.
- **Markazlar ajratilgan (multi-tenant):** xodim faqat o'z markazi ma'lumotlarini ko'radi/o'zgartiradi. `centerId` so'rovdan emas, tokendan olinadi (`AccessService`).
- **Rollar:** `superadmin` — markazlarni boshqarish; `admin` — moliya, xodimlar, o'quvchilar; `teacher` — davomat va LMS.
- **Maxfiy kalitlar faqat `.env` da.** Token, parol yoki API kalitni hech qachon kodga yozmang.
- **To'lov webhook'lari imzo bilan tekshiriladi** (`CLICK_SECRET_KEY`, `ATMOS_API_KEY`). Kalit sozlanmagan bo'lsa webhook rad etiladi.
- O'quvchi portali (`/portal`, `/app`) shaxsiy havola (`?studentId=<UUID>`) orqali ishlaydi.

### 3. Prisma migratsiyasini bajarish:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Dasturni ishga tushirish:
```bash
# Rivojlanish (dev) rejimida:
npm run start:dev

# Ishlab chiqarish (prod) rejimida:
npm run build
npm run start:prod
```

---

## 🔑 Asosiy API Endpointlar (Barchasi `/api/v1` prefiksi bilan)

### Auth (`/api/v1/auth`)
- `POST /auth/register` - Yangi xodimni ro'yxatdan o'tkazish (faqat admin, o'z markaziga)
- `POST /auth/login` - Tizimga kirish (JWT token olish)
- `GET /auth/me` - Joriy profil ma'lumotlarini olish

### Markazlar (`/api/v1/centers`)
- `POST /centers` - Yangi markaz qo'shish (faqat SUPER_ADMIN)
- `GET /centers` - Markazlar ro'yxati
- `GET /centers/:id` - Markaz tafsilotlari
- `PATCH /centers/:id` - Markazni tahrirlash
- `DELETE /centers/:id` - Markazni o'chirish

### Foydalanuvchilar (`/api/v1/users`)
- `POST /users` - Xodim yoki o'qituvchi qo'shish
- `GET /users?centerId=...` - Foydalanuvchilar ro'yxati
- `GET /users/:id` - Foydalanuvchi tafsilotlari
- `PATCH /users/:id` - Foydalanuvchini tahrirlash

### Kurslar (`/api/v1/courses`)
- `POST /courses` - Yangi kurs qo'shish
- `GET /courses?centerId=...` - Kurslar ro'yxati
- `GET /courses/:id` - Kurs ma'lumotlari

### Guruhlar (`/api/v1/groups`)
- `POST /groups` - Yangi guruh yaratish
- `GET /groups?centerId=...&courseId=...` - Guruhlar ro'yxati
- `GET /groups/:id` - Guruh va uning o'quvchilari
- `POST /groups/:id/students` - Guruhga o'quvchi biriktirish
- `DELETE /groups/:id/students/:studentId` - Guruhdan o'quvchini chiqarish

### O'quvchilar (`/api/v1/students`)
- `POST /students` - Yangi o'quvchi qo'shish
- `GET /students?centerId=...&search=...` - O'quvchilar ro'yxati va qidiruv
- `GET /students/:id` - O'quvchi profili (guruhlari, to'lovlari, davomati bilan)

### Davomat (`/api/v1/attendance`)
- `POST /attendance/mark` - Guruh uchun kunlik davomat belgilash
- `GET /attendance/group/:groupId?date=YYYY-MM-DD` - Sana bo'yicha guruh davomati
- `GET /attendance/student/:studentId` - O'quvchining barcha davomat tarixi

### To'lovlar (`/api/v1/payments`)
- `POST /payments` - To'lov qabul qilish (o'quvchi balansi avtomatik to'ldiriladi)
- `GET /payments?centerId=...&studentId=...` - To'lovlar tarixi va kassa
