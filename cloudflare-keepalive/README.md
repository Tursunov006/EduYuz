# eduyuz-keepalive (Cloudflare Worker)

Vercel'dagi EduYuz serverini ish vaqtida uyg'oq saqlaydi: Toshkent vaqti bilan 07:00–22:55 oralig'ida
har 5 daqiqada `https://eduyuz-api.vercel.app/api/v1/health` ga murojaat qiladi. Bepul limit (kuniga 100 000 so'rov)
ichida — kuniga ~190 so'rov.

## Cloudflare'ga ulash (bir marta)
Cloudflare → Workers & Pages → Create → **Import a repository** → `Tursunov006/EduYuz`:
- **Project name:** `eduyuz-keepalive`
- **Advanced settings → Path (root directory):** `cloudflare-keepalive`
- Build command — bo'sh, Deploy command — `npx wrangler deploy` (standart)

Shundan keyin `main` ga kelgan o'zgarishlar Cloudflare'ga avtomatik chiqadi.

Tekshirish: Worker manzilini oching (`https://eduyuz-keepalive.<akkaunt>.workers.dev`) —
`EduYuz server: 200 ... {"status":"ok","db":"up"}` chiqishi kerak.
