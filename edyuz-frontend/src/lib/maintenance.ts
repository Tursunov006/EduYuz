// Texnik ishlar rejimi. true bo'lsa butun sayt o'rniga "Texnik ishlar" sahifasi chiqadi.
// Server (API) va Telegram bot ishlashda qoladi, ma'lumotlarga tegilmaydi.
// Qaytarish uchun: `on` ni false qilib, qayta deploy qiling.
export const MAINTENANCE = {
  on: true,
  until: '22:00', // Toshkent vaqti
};
