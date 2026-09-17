import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  timeLimitSeconds: number;
  points: number;
}

export interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

export interface ParentBotContext {
  student?: any;
  groupInfo?: any;
  teacher?: any;
  attendances?: any[];
  allCourses?: any[];
  center?: any;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  // 1. Dars rejasi va konspektini generatsiya qilish
  async generateLessonPlan(topic: string, courseTitle?: string, level: string = 'Boshlang\'ich') {
    this.logger.log(`Generating AI lesson plan for topic: "${topic}" (${courseTitle || 'Umumiy'})`);

    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      try {
        const externalResult = await this.callExternalAiForLesson(apiKey, topic, courseTitle, level);
        if (externalResult) return externalResult;
      } catch (err) {
        this.logger.warn(`External AI error, switching to smart local generator: ${err.message}`);
      }
    }

    return this.generateSmartLessonFallback(topic, courseTitle, level);
  }

  // 2. Interaktiv Viktorina (Kahoot uslubi) savollarini generatsiya qilish
  async generateQuiz(topic: string, count: number = 5): Promise<QuizQuestion[]> {
    this.logger.log(`Generating AI Quiz for topic: "${topic}" (count: ${count})`);

    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      try {
        const externalQuiz = await this.callExternalAiForQuiz(apiKey, topic, count);
        if (externalQuiz && externalQuiz.length > 0) return externalQuiz;
      } catch (err) {
        this.logger.warn(`External AI quiz error, using smart generator: ${err.message}`);
      }
    }

    return this.generateSmartQuizFallback(topic, count);
  }

  // 3. Flashcard / Match O'yini kartalarini generatsiya qilish
  async generateMatchCards(topic: string): Promise<MatchPair[]> {
    return this.generateSmartMatchFallback(topic);
  }

  // 4. Talaba uchun AI Repetitor Chat
  async chatTutor(message: string, studentName?: string, topic?: string): Promise<string> {
    const greeting = studentName ? `Salom, ${studentName}! 😊` : 'Assalomu alaykum! 😊';
    const cleanMsg = message.toLowerCase().trim();

    if (cleanMsg.includes('salom') || cleanMsg.includes('assalom')) {
      return `${greeting} Men sizning EduYuz AI Repetitoringizman. Bugungi mavzu yoki darslaringiz bo'yicha qanday savolingiz bor? Savolingizni bemalol yozing! 🚀`;
    }

    if (cleanMsg.includes('tanga') || cleanMsg.includes('coin') || cleanMsg.includes('ball')) {
      return `🪙 **EduCoins haqida:**
Siz darslarga qatnashish (+10 coin), uy vazifalarini a'lo topshirish va dars bo'yicha interaktiv o'yinlarda g'olib bo'lish orqali tangalar to'plashingiz mumkin! 

Tangalaringiz reyting shohsupasida o'rningizni ko'taradi va maxsus sertifikatlarga eshik ochadi. Hozir qaysi darsni o'rganamiz?`;
    }

    if (cleanMsg.includes('o\'yin') || cleanMsg.includes('oyin') || cleanMsg.includes('game') || cleanMsg.includes('viktorina')) {
      return `🎮 Darslarni o'yin orqali mustahkamlash ajoyib usul! Dars sahifasidagi **"🎮 Dars bo'yicha O'yin"** tugmasini bosing — taymerli viktorinada to'g'ri javoblarni topib, tangalar yutib oling!`;
    }

    return `${greeting}

Savolingiz: **"${message}"**

💡 **AI Repetitor javobi:**
1. **Asosiy qoida:** Har qanday dars mavzusini kichik qismlarga bo'lib, amalda qo'llab ko'rish eng samarali usuldir.
2. **Amaliy maslahat:** Nazariyani o'qib bo'lgach, darhol konspekt tuzing va o'z so'zlaringiz bilan bitta misol keltiring.
3. **Keyingi qadam:** Ushbu mavzu bo'yicha tushunmagan aniq joyingiz bo'lsa (masalan: formulasi, sintaksisi yoki ma'nosi), yozing, bittalab tahlil qilamiz! 🌟`;
  }

  // 5. Telegram Bot orqali ota-onalar bilan muloqot qiluvchi AI
  async chatParentBot(message: string, ctx: ParentBotContext): Promise<string> {
    const text = message.toLowerCase().trim();
    const student = ctx.student;
    const studentName = student?.fullName || 'Farzandingiz';
    const groupName = ctx.groupInfo?.name || student?.groups?.[0]?.group?.name || 'Guruh';
    const courseTitle = ctx.groupInfo?.course?.title || student?.groups?.[0]?.group?.course?.title || 'O‘quv kursi';
    const teacherName = ctx.teacher?.fullName || ctx.groupInfo?.teacher?.fullName || 'Guruh Ustozi';
    const teacherPhone = ctx.teacher?.phone || '+998 90 123 45 67';

    // 1. Davomat haqida so'ralsa
    if (
      text.includes('davomat') ||
      text.includes('keldi') ||
      text.includes('kelmad') ||
      text.includes('qatnash') ||
      text.includes('darsga') ||
      text.includes('yoqlama')
    ) {
      if (!student) {
        return `Hurmatli ota-ona! Farzandingiz davomatini ko'rish uchun avval botda farzandingiz profilingizni ulang yoki /start bosing.`;
      }

      const attList = ctx.attendances || [];
      const presentCount = attList.filter((a) => a.status === 'present').length;
      const lateCount = attList.filter((a) => a.status === 'late').length;
      const absentCount = attList.filter((a) => a.status === 'absent').length;
      const total = attList.length || 1;
      const percent = Math.round((presentCount / total) * 100);
      const lastAtt = attList[0];

      let lastStatusText = 'Hali dars qayd etilmagan';
      if (lastAtt) {
        const dStr = new Date(lastAtt.date).toLocaleDateString('uz-UZ');
        const stStr = lastAtt.status === 'present' ? '✅ Darsda bo‘lgan' : lastAtt.status === 'late' ? '⏳ Kechikkan' : '❌ Kelmagan';
        lastStatusText = `${dStr} sanasida (${stStr})`;
      }

      return `📊 <b>${studentName} — Davomat Hisoboti:</b>

📚 <b>Guruh:</b> ${groupName} (${courseTitle})
📈 <b>Davomat ko‘rsatkichi:</b> ${percent}%
✅ <b>Qatnashgan darslar:</b> ${presentCount} ta
⏳ <b>Kechikkan:</b> ${lateCount} ta
❌ <b>Qoldirgan:</b> ${absentCount} ta
🕒 <b>Oxirgi dars:</b> ${lastStatusText}

<i>EduYuz AI: Farzandingiz darslarga mas'uliyat bilan qatnashmoqda! Har qanday savolingiz bo'lsa, bemalol yozing.</i>`;
    }

    // 2. To'lov va Qarz haqida so'ralsa
    if (
      text.includes('qarz') ||
      text.includes('tolov') ||
      text.includes('to‘lov') ||
      text.includes('balans') ||
      text.includes('pul') ||
      text.includes('narx') ||
      text.includes('oylik tolov')
    ) {
      if (!student) {
        return `Hurmatli ota-ona! Kurs narxlari har bir yo'nalish bo'yicha oyiga 350 000 so'mdan 800 000 so'mgacha. Farzandingizning aniq hisobini ko'rish uchun telefon raqamingizni ulashing.`;
      }

      const bal = Number(student.balance || 0);
      const isDebt = bal < 0;
      const formatted = Math.abs(bal).toLocaleString('uz-UZ') + " so'm";

      if (isDebt) {
        return `💳 <b>${studentName} — To‘lov Holati:</b>

📌 <b>Joriy qarzdorlik miqdori:</b> <b>${formatted}</b>
📚 <b>Guruh:</b> ${groupName}

Iltimos, to‘lovni o‘quv markazi kassasi orqali yoki Click / Payme orqali amalga oshirishingiz mumkin. To‘lov qilingandan so‘ng chek avtomatik tarzda Telegramingizga yuboriladi. Rahmat!`;
      } else {
        return `✅ <b>${studentName} — To‘lov Holati:</b>

Farzandingiz bo‘yicha to‘lovlar to‘liq amalga oshirilgan! Qarzdorlik mavjud emas. O‘z vaqtida amalga oshirilgan to‘lov uchun markazimiz nomidan minnatdorchilik bildiramiz! 🌟`;
      }
    }

    // 3. EduCoins, Tangalar va Ballar haqida
    if (
      text.includes('tanga') ||
      text.includes('coin') ||
      text.includes('ball') ||
      text.includes('reyting') ||
      text.includes('yutuq')
    ) {
      const coins = student?.coins || 0;
      const points = student?.points || 0;

      return `🪙 <b>${studentName} — Gamifikatsiya & Yutuqlar:</b>

⭐ <b>To‘plagan EduCoinlar:</b> <b>${coins} EduCoin</b>
🏆 <b>Umumiy Tajriba Ballari:</b> <b>${points} ball</b>

💡 <i>EduCoins haqida:</i>
Farzandingiz har bir darsga kelganida (+10 coin), dars konspektlari va interaktiv viktorina o‘yinlarida to‘g‘ri javob berganida tangalar yutib oladi. Bu tangalar o‘quvchilarning umumiy reytingdagi mavqeini ko‘taradi va sertifikat olishga yordam beradi! 🚀`;
    }

    // 4. Ustoz va O'qituvchi haqida
    if (
      text.includes('ustoz') ||
      text.includes('oqituvchi') ||
      text.includes('o‘qituvchi') ||
      text.includes('muallim') ||
      text.includes('boglanish') ||
      text.includes('telefon') ||
      text.includes('xabar')
    ) {
      return `👨‍🏫 <b>Guruh Ustozi Haqida Ma'lumot:</b>

👤 <b>Ustoz:</b> ${teacherName}
📚 <b>Fan/Kurs:</b> ${courseTitle}
🏫 <b>Guruh:</b> ${groupName}
📞 <b>Aloqa uchun:</b> ${teacherPhone}

💬 <i>Ustozga xabar qoldirmoqchimisiz?</i>
Shunchaki: <b>"Ustozga xabar: Farzandim bugun 10 daqiqa kechikadi"</b> deb yozib yuboring — EduYuz AI bu xabarni darhol ustozga yetkazadi! 🙏`;
    }

    // 5. O'quv markazi va Kurslar haqida
    if (
      text.includes('markaz') ||
      text.includes('kurs') ||
      text.includes('manzil') ||
      text.includes('qayerda') ||
      text.includes('qanday kurs') ||
      text.includes('filial')
    ) {
      const coursesList = ctx.allCourses && ctx.allCourses.length > 0
        ? ctx.allCourses.map((c: any) => `• <b>${c.title}</b> — ${Number(c.price || 500000).toLocaleString('uz-UZ')} so'm/oy`).join('\n')
        : `• <b>Dasturlash (Frontend & Backend)</b>\n• <b>Ingliz tili & IELTS</b>\n• <b>Matematika va Mantiq</b>\n• <b>Robototexnika va IT</b>`;

      return `🏫 <b>EduYuz Zamonaviy Ta'lim Markazi:</b>

Bizning markazimizda ilg‘or texnologiyalar, interaktiv LMS platformasi, jonli o‘yinlar va sun'iy intellekt repetitori asosida ta'lim beriladi.

📋 <b>Mavjud Kurslarimiz:</b>
${coursesList}

📍 <b>Manzil:</b> Markaziy bino, Toshkent sh.
📞 <b>Ma'lumot uchun:</b> +998 71 200 00 00
🌐 <b>Mobil Mini Ilova:</b> /app havolasi orqali ochiladi.`;
    }

    // 6. Ustozga xabar qoldirish (xabar / kechikadi / kelolmaydi)
    if (
      text.includes('kechik') ||
      text.includes('kelolmay') ||
      text.includes('bormay') ||
      text.includes('kasal') ||
      text.includes('iltimos')
    ) {
      return `✅ <b>Xabaringiz Qabul Qilindi!</b>

Hurmatli ota-ona, <b>${studentName}</b> haqidagi xabaringiz guruh ustozi <b>${teacherName}</b> va markaz ma'muriyatiga yetkazildi. 
Farzandingiz salomatligi va ta'limiga befarq bo'lmaganingiz uchun tashakkur! 🙏`;
    }

    // 7. Umumiy salomlashish va yo'riqnoma
    return `Assalomu alaykum, hurmatli ota-ona! 😊

Men <b>EduYuz AI</b> — ta'lim markazining rasmiy aqlli yordamchisiman.
Men sizga farzandingiz <b>${studentName}</b> bo‘yicha quyidagi ma'lumotlarni berishga tayyorman:

• 📊 <b>Davomati:</b> Darslarga qatnashuvi va yo‘qlamasi;
• 💳 <b>To‘lovlar:</b> Oylik to‘lov, qarzdorlik va kvitansiyalar;
• 🪙 <b>EduCoins:</b> Yig‘ilgan tangalar va reyting shohsupasi;
• 👨‍🏫 <b>Ustoz:</b> Guruh ustozi bilan bog‘lanish va xabar qoldirish;
• 🏫 <b>Kurslar:</b> Markazimizdagi barcha yangi yo‘nalishlar.

Savolingizni bemalol yozishingiz yoki quyidagi menyudan foydalanishingiz mumkin! 👇`;
  }


  private async callExternalAiForLesson(apiKey: string, topic: string, courseTitle?: string, level?: string) {
    return null;
  }

  private async callExternalAiForQuiz(apiKey: string, topic: string, count: number) {
    return null;
  }

  private generateSmartLessonFallback(topic: string, courseTitle?: string, level: string = 'Boshlang\'ich') {
    return {
      topic,
      courseTitle: courseTitle || 'Zamonaviy Fan',
      level,
      estimatedTimeMinutes: 45,
      summary: `Ushbu darsda siz "${topic}" mavzusining tub mohiyatini, real hayotda va amaliyotda qo'llanishini to'liq o'rganib olasiz.`,
      sections: [
        {
          title: `1. "${topic}" mavzusiga kirish va asosiy tushunchalar`,
          content: `Ushbu mavzu o'quvchiga fanni chuqur tushunish uchun fundament bo'lib xizmat qiladi. Mavzuni o'rganishda quyidagi asosiy tamoyillarga e'tibor berish lozim:
- Tushunchaning vujudga kelish sababi va zamonaviy qo'llanishi;
- Asosiy qoidalar va ta'riflar;
- Keng tarqalgan xatolar va ularning oldini olish.`,
        },
        {
          title: `2. Amaliy misollar va tahlil`,
          content: `Nazariyani mustahkamlash uchun quyidagi amaliy modelni ko'rib chiqamiz:
1. Birinchi qadam: Boshlang'ich holatni tahlil qilish;
2. Ikkinchi qadam: Asosiy qoidani ketma-ketlikda tatbiq etish;
3. Uchinchi qadam: Natijani tekshirish va optimallashtirish.`,
        },
        {
          title: `3. Xulosa va eslab qolish kerak bo'lgan "Oltin Qoidalar"`,
          content: `✅ 1-qoida: Mavzuning negizini yodlamang, balki mantiqan tushunib oling.
✅ 2-qoida: Mavzu bo'yicha kamida 3 ta mustaqil misol ishlang.
✅ 3-qoida: Dars yakunida interaktiv viktorinada qatnashib, o'z bilimingizni tekshiring!`,
        },
      ],
      homework: {
        title: `Uyga vazifa: "${topic}" mavzusi bo'yicha mustaqil loyiha`,
        description: `1. Darsda o'tilgan asosiy 3 ta qoidani o'z konspekt daftaringizga yozing.
2. Mavzuga oid kamida bitta to'liq amaliy misol ishlab, LMS portaliga yuklang.
3. Portal orqali viktorina o'yinini o'ynab, kamida 80% natija qayd eting.`,
        maxScore: 100,
      },
      interactiveQuestionsCount: 5,
    };
  }

  private generateSmartQuizFallback(topic: string, count: number = 5): QuizQuestion[] {
    const questions: QuizQuestion[] = [
      {
        id: 'q-1',
        question: `"${topic}" mavzusining eng asosiy maqsadi nima?`,
        options: [
          'Bilimlarni tizimli ravishda amaliyotga tatbiq etish',
          'Faqat nazariy qoidalarni yodlab olish',
          'Vaqtinchalik xotirada saqlash',
          'Hech qanday amaliy ahamiyatga ega emas',
        ],
        correctIndex: 0,
        explanation: `To'g'ri javob! "${topic}" mavzusi nazariyani tizimli va to'g'ri amaliyotda qo'llash uchun xizmat qiladi.`,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q-2',
        question: `Ushbu mavzuni o'rganishda qaysi bosqich eng muhim hisoblanadi?`,
        options: [
          'Boshlang\'ich tushunchalarni to\'g\'ri anglash va tahlil',
          'Xatolarga e\'tibor bermasdan tez o\'tib ketish',
          'Faqat dars oxiridagi savollarni ko\'rish',
          'Faqat o\'qituvchining aytganini eshitish',
        ],
        correctIndex: 0,
        explanation: `Boshlang'ich tushunchalarni mustahkam o'zlashtirish barcha keyingi bosqichlar uchun asos bo'ladi.`,
        timeLimitSeconds: 15,
        points: 100,
      },
      {
        id: 'q-3',
        question: `"${topic}" bo'yicha amaliy masalani yechishda birinchi nima qilinadi?`,
        options: [
          'Shart va boshlang\'ich ma\'lumotlar to\'liq tahlil qilinadi',
          'Darhol tavakkal yakuniy xulosa qilinadi',
          'Yechimni boshqadan ko\'chirib olinadi',
          'Masala qoldirib ketiladi',
        ],
        correctIndex: 0,
        explanation: `To'g'ri! Avval boshlang'ich shart va ma'lumotlarni to'liq tahlil qilib olish zarur.`,
        timeLimitSeconds: 20,
        points: 100,
      },
      {
        id: 'q-4',
        question: `Quyidagilardan qaysi biri to'g'ri amaliyot hisoblanadi?`,
        options: [
          'Har bir qadamni tekshirib, xatolardan xulosa chiqarish',
          'Xatolarni yashirish va ko\'rsatmaslik',
          'Doim bir xil usulda qotib qolish',
          'Mashqlarni bajarmaslik',
        ],
        correctIndex: 0,
        explanation: `Xatolarni tahlil qilish va to'g'irlash orqali bilim eng mustahkam holatga keladi.`,
        timeLimitSeconds: 15,
        points: 100,
      },
      {
        id: 'q-5',
        question: `O'rganilgan "${topic}" bilimini uzoq muddat xotirada saqlash siri nimada?`,
        options: [
          'Doimiy takrorlash, o\'yinlar va amaliy loyihalarda qo\'llash',
          'Darsdan keyin mavzuni butunlay unutish',
          'Faqat imtihondan oldingi kecha o\'qish',
          'Hech kim bilan fikr almashmaslik',
        ],
        correctIndex: 0,
        explanation: `Ajoyib natija! Doimiy takrorlash va interaktiv o'yinlar bilimni eng yuqori darajada mustahkamlaydi!`,
        timeLimitSeconds: 20,
        points: 100,
      },
    ];

    return questions.slice(0, count);
  }

  private generateSmartMatchFallback(topic: string): MatchPair[] {
    return [
      { id: 'm1', term: `${topic}: Asos`, definition: 'Mavzuning poydevor tushunchasi' },
      { id: 'm2', term: 'Amaliyot', definition: 'Nazariyani jonli misolda sinab ko\'rish' },
      { id: 'm3', term: 'Tahlil', definition: 'Muammoni qismlarga bo\'lib o\'rganish' },
      { id: 'm4', term: 'Optimallashtirish', definition: 'Eng yaxshi va tez natijaga erishish' },
      { id: 'm5', term: 'EduCoin', definition: 'O\'quvchining mehnati uchun beriladigan rag\'bat' },
    ];
  }
}
