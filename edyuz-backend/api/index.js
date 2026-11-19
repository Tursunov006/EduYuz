// Vercel serverless funksiyasi: barcha so'rovlar (vercel.json rewrites) shu yerga keladi.
// Nest ilovasi bir marta yaratiladi va keyingi so'rovlarda qayta ishlatiladi ("issiq" holat).
const { createApp } = require('../dist/src/app.factory');

let serverPromise;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const app = await createApp();
      await app.init();
      return app.getHttpAdapter().getInstance();
    })().catch((err) => {
      serverPromise = undefined; // keyingi so'rovda qayta urinib ko'radi
      throw err;
    });
  }
  return serverPromise;
}

module.exports = async (req, res) => {
  const server = await getServer();
  return server(req, res);
};
