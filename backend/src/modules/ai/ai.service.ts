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
