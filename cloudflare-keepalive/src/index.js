// EduYuz serverini ish vaqtida uyg'oq saqlaydi.
// Vercel bepul tarifida server bir muddat so'rov kelmasa "uxlaydi" va birinchi ochilish sekin bo'ladi.
// Bu Worker Toshkent vaqti bilan 07:00–22:00 oralig'ida har 5 daqiqada /health ga murojaat qiladi
// (jadval wrangler.jsonc dagi "crons" da). Brauzerda Worker manzili ochilsa — joriy holat ko'rsatiladi.
const HEALTH_URL = 'https://eduyuz-api.vercel.app/api/v1/health';

async function ping() {
  const started = Date.now();
  try {
    const res = await fetch(HEALTH_URL, { headers: { 'User-Agent': 'eduyuz-keepalive' } });
    const body = await res.text();
    return `${res.status} ${Date.now() - started}ms ${body}`;
  } catch (e) {
    return `xato: ${e.message}`;
  }
}

export default {
  async scheduled(_event, _env, ctx) {
    ctx.waitUntil(ping().then((r) => console.log('EduYuz health:', r)));
  },
  async fetch() {
    return new Response(`EduYuz server: ${await ping()}\n`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
