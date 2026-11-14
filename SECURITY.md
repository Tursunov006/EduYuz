# Xavfsizlik siyosati

## Zaiflik haqida xabar berish
Zaiflik topsangiz, uni ochiq Issue sifatida **yozmang**. GitHub'dagi *Security → Report a vulnerability* orqali yoki platforma egasiga shaxsan xabar bering.

## Ma'lumotlarni himoyalash
- Pasport, manzil va izohlar bazada **AES-256-GCM** bilan shifrlangan holda saqlanadi (kalit: serverdagi `ENCRYPTION_KEY`).
- Parollar bcrypt bilan xeshlanadi; API JWT orqali himoyalangan, markazlar bir-biridan ajratilgan.
- Aloqa faqat HTTPS orqali; baza bilan ulanish SSL talab qiladi (`sslmode=require`).
- Kalitlar, parollar va tokenlar kodda yoki GitHub'da saqlanmaydi — faqat Render/Vercel/GitHub *Secrets* ichida.
