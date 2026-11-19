import { createApp } from './app.factory';

async function bootstrap() {
  const app = await createApp();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 EduYuz Backend muvaffaqiyatli ishga tushdi: http://localhost:${port}/api/v1`);
}
bootstrap();
