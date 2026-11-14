# EduYuz — uy serveri (Ubuntu Server 24.04)

Eski kompyuterni (i3, 4 GB RAM yetadi) EduYuz backend serveriga aylantirish.
Sayt (frontend) **Vercel**da, baza **Supabase**da qoladi — kompyuterda faqat backend ishlaydi.
Render zaxira sifatida turadi: uy serveri o'chsa, sayt yana Render'ga qaytariladi.

```
Foydalanuvchi → www.eduyuz.uz (Vercel) → api.eduyuz.uz (Cloudflare Tunnel) → uydagi PC (Docker) → Supabase
```

## Kerak bo'ladi
- Ubuntu Server 24.04 o'rnatilgan kompyuter (internet kabeli bilan)
- **UPS** (svet o'chganda server o'chmasligi uchun) — tavsiya etiladi
- Bepul **Cloudflare** hisobi va `eduyuz.uz` domenining DNS'i Cloudflare'ga ulangan bo'lishi

## 1. Kodni yuklab olish
```bash
sudo apt-get install -y git
git clone https://github.com/Tursunov006/EduYuz.git ~/EduYuz
cd ~/EduYuz/server
```

## 2. Cloudflare Tunnel yaratish (bir marta, brauzerda)
1. https://dash.cloudflare.com → **Add a domain** → `eduyuz.uz` → Free reja. Cloudflare bergan 2 ta
   nameserver'ni domen sotib olingan joyda (registrator) o'rnating. Vercel yozuvlari Cloudflare'ga
   avtomatik ko'chiriladi — `www.eduyuz.uz` ishlashda davom etadi.
2. **Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared** → nom: `eduyuz-home`.
3. Ko'rsatilgan buyruqdagi **token**ni nusxalang (`eyJ...` bilan boshlanadi) — keyingi qadamda kerak.
4. **Public Hostname** qo'shing: Subdomain `api`, Domain `eduyuz.uz`,
   Service **HTTP** → `backend:3000`.

## 3. Sozlash va ishga tushirish
```bash
bash setup.sh          # Docker o'rnatadi va .env yaratadi
nano .env              # qiymatlarni to'ldiring (pastga qarang), Ctrl+O, Enter, Ctrl+X
bash setup.sh          # serverni ishga tushiradi va tungi zaxirani yoqadi
```
`.env` ga Render → **Environment**dagi qiymatlarni **aynan** ko'chiring:
`DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `TELEGRAM_BOT_TOKEN` (+ bo'lsa SMS/AI kalitlari),
va 2-qadamdagi `CLOUDFLARE_TUNNEL_TOKEN`.
> ⚠️ `ENCRYPTION_KEY` va `JWT_SECRET` Render'dagidan farq qilsa, login va shifrlangan ma'lumotlar ishlamaydi.

Tekshirish:
```bash
curl http://127.0.0.1:3000/api/v1/health      # {"status":"ok","db":"up"}
curl https://api.eduyuz.uz/api/v1/health      # internet orqali ham shunday bo'lishi kerak
```

## 4. Saytni uy serveriga ulash
1. **Vercel** → loyiha → Settings → Environment Variables → `NEXT_PUBLIC_API_URL` =
   `https://api.eduyuz.uz/api/v1` → **Redeploy**.
2. **Render** → edyuz-backend → Environment → `TELEGRAM_BOT_TOKEN`ni o'chiring (yoki xizmatni
   **Suspend** qiling). Aks holda Render va uy serveri Telegram webhook'ini bir-biridan tortib oladi.

## Kundalik ishlar
| Vazifa | Buyruq |
|---|---|
| Holat | `sudo docker compose ps` |
| Loglar | `sudo docker compose logs -f --tail=100 backend` |
| Yangi kodni olish | `bash update.sh` |
| Qayta ishga tushirish | `sudo docker compose restart` |
| Qo'lda zaxira | `bash backup.sh` (fayllar: `backups/`, oxirgi 14 kun saqlanadi) |

Kompyuter svet kelganda o'zi yonishi uchun BIOS'da **AC Power Recovery / Restore on AC Power Loss → Power On**
ni yoqing. Docker konteynerlari tizim yonishi bilan o'zi ishga tushadi.

## Uy serveri ishlamay qolsa (favqulodda)
Vercel'da `NEXT_PUBLIC_API_URL`ni `https://eduyuz.onrender.com/api/v1` ga qaytaring, Render'da
`TELEGRAM_BOT_TOKEN`ni qayta qo'ying va **Manual Deploy** bosing — sayt 5 daqiqada Render'da ishlaydi.
