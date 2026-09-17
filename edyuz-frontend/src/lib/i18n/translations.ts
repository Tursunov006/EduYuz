// EduYuz ko'p tillilik lug'ati (O'zbek, Rus, Ingliz)

export type Language = 'uz' | 'ru' | 'en';

export const translations: Record<Language, Record<string, string>> = {
  uz: {
    // Navigatsiya
    'nav.dashboard': 'Dashboard',
    'nav.students': 'O‘quvchilar',
    'nav.groups': 'Guruhlar',
    'nav.teachers': 'O‘qituvchilar',
    'nav.attendance': 'Davomat',
    'nav.payments': 'To‘lovlar',
    'nav.expenses': 'Moliya & Chiqim',
    'nav.lms': 'LMS Darslar',
    'nav.games': 'Mavzuli O‘yinlar',
    'nav.leaderboard': 'Reyting & Coins',
    'nav.certificates': 'Sertifikatlar',
    'nav.portal': 'O‘quvchi Portali',
    'nav.logout': 'Chiqish',

    // Dashboard
    'dash.title': 'Boshqaruv Paneli',
    'dash.subtitle': 'EduYuz — O‘quv markazining umumiy statistikasi va hisobotlari',
    'dash.totalStudents': 'Jami O‘quvchilar',
    'dash.activeGroups': 'Faol Guruhlar',
    'dash.monthlyRevenue': 'Oylik Tushum',
    'dash.totalDebt': 'Umumiy Qarzdorlik',
    'dash.debtors': 'Qarzdor O‘quvchilar',
    'dash.recentPayments': 'So‘nggi To‘lovlar',
    'dash.sendSms': 'SMS Eslatma',
    'dash.exportExcel': 'Excelga Yuklash',

    // O'quvchilar
    'students.title': 'O‘quvchilar Ro‘yxati',
    'students.add': 'Yangi O‘quvchi Qo‘shish',
    'students.search': 'Ism yoki telefon orqali qidirish...',
    'students.name': 'F.I.O',
    'students.phone': 'Telefon',
    'students.balance': 'Balans',
    'students.coins': 'EduCoins',
    'students.status': 'Holati',
    'students.actions': 'Amallar',

    // O'yinlar
    'games.title': 'Mavzuli Interaktiv O‘yinlar Arenasi',
    'games.subtitle': 'Darslarni o‘yin orqali o‘rganing va EduCoin yutib oling!',
    'games.play': 'O‘yinni Boshlash',
    'games.timer': 'Vaqt',
    'games.score': 'Ball',
    'games.combo': 'On Fire!',
    'games.victory': 'O‘yin Yakunlandi! 🎉',
    'games.earnedCoins': 'EduCoin Yutib Oldingiz!',

    // Mini App
    'app.home': 'Asosiy',
    'app.lessons': 'Darslar',
    'app.games': 'O‘yinlar',
    'app.aiTutor': 'AI Tutor',
    'app.profile': 'Profil',
    'app.debt': 'Qarzdorlik',
    'app.paid': 'To‘langan',

    // Umumiy
    'common.save': 'Saqlash',
    'common.cancel': 'Bekor qilish',
    'common.delete': 'O‘chirish',
    'common.edit': 'Tahrirlash',
    'common.loading': 'Yuklanmoqda...',
    'common.all': 'Barchasi',
    'common.language': 'Til',
    'common.notifications': 'Xabarnomalar',
  },

  ru: {
    // Navigatsiya
    'nav.dashboard': 'Панель управления',
    'nav.students': 'Студенты',
    'nav.groups': 'Группы',
    'nav.teachers': 'Преподаватели',
    'nav.attendance': 'Посещаемость',
    'nav.payments': 'Оплата',
    'nav.expenses': 'Финансы и Расходы',
    'nav.lms': 'LMS Уроки',
    'nav.games': 'Тематические Игры',
    'nav.leaderboard': 'Рейтинг и Монеты',
    'nav.certificates': 'Сертификаты',
    'nav.portal': 'Портал Студента',
    'nav.logout': 'Выйти',

    // Dashboard
    'dash.title': 'Панель управления',
    'dash.subtitle': 'EduYuz — Общая статистика и отчетность учебного центра',
    'dash.totalStudents': 'Всего студентов',
    'dash.activeGroups': 'Активные группы',
    'dash.monthlyRevenue': 'Доход за месяц',
    'dash.totalDebt': 'Общая задолженность',
    'dash.debtors': 'Должники',
    'dash.recentPayments': 'Последние платежи',
    'dash.sendSms': 'SMS Напоминание',
    'dash.exportExcel': 'Экспорт в Excel',

    // O'quvchilar
    'students.title': 'Список студентов',
    'students.add': 'Добавить студента',
    'students.search': 'Поиск по имени или телефону...',
    'students.name': 'Ф.И.О',
    'students.phone': 'Телефон',
    'students.balance': 'Баланс',
    'students.coins': 'EduCoins',
    'students.status': 'Статус',
    'students.actions': 'Действия',

    // O'yinlar
    'games.title': 'Арена Тематических Игр',
    'games.subtitle': 'Изучайте уроки через игры и выигрывайте EduCoins!',
    'games.play': 'Начать игру',
    'games.timer': 'Время',
    'games.score': 'Баллы',
    'games.combo': 'В огне!',
    'games.victory': 'Игра завершена! 🎉',
    'games.earnedCoins': 'Вы выиграли EduCoins!',

    // Mini App
    'app.home': 'Главная',
    'app.lessons': 'Уроки',
    'app.games': 'Игры',
    'app.aiTutor': 'AI Репетитор',
    'app.profile': 'Профиль',
    'app.debt': 'Задолженность',
    'app.paid': 'Оплачено',

    // Umumiy
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.loading': 'Загрузка...',
    'common.all': 'Все',
    'common.language': 'Язык',
    'common.notifications': 'Уведомления',
  },

  en: {
    // Navigatsiya
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.groups': 'Groups',
    'nav.teachers': 'Teachers',
    'nav.attendance': 'Attendance',
    'nav.payments': 'Payments',
    'nav.expenses': 'Finance & Expenses',
    'nav.lms': 'LMS Lessons',
    'nav.games': 'Interactive Games',
    'nav.leaderboard': 'Leaderboard & Coins',
    'nav.certificates': 'Certificates',
    'nav.portal': 'Student Portal',
    'nav.logout': 'Logout',

    // Dashboard
    'dash.title': 'Dashboard',
    'dash.subtitle': 'EduYuz — Educational Center Overall Statistics & Analytics',
    'dash.totalStudents': 'Total Students',
    'dash.activeGroups': 'Active Groups',
    'dash.monthlyRevenue': 'Monthly Revenue',
    'dash.totalDebt': 'Total Debt',
    'dash.debtors': 'Debtor Students',
    'dash.recentPayments': 'Recent Payments',
    'dash.sendSms': 'Send SMS',
    'dash.exportExcel': 'Export to Excel',

    // O'quvchilar
    'students.title': 'Students Directory',
    'students.add': 'Add New Student',
    'students.search': 'Search by name or phone...',
    'students.name': 'Full Name',
    'students.phone': 'Phone',
    'students.balance': 'Balance',
    'students.coins': 'EduCoins',
    'students.status': 'Status',
    'students.actions': 'Actions',

    // O'yinlar
    'games.title': 'Interactive Lesson Games Arena',
    'games.subtitle': 'Master lessons with gamified quizzes and win EduCoins!',
    'games.play': 'Start Game',
    'games.timer': 'Time',
    'games.score': 'Score',
    'games.combo': 'On Fire!',
    'games.victory': 'Game Complete! 🎉',
    'games.earnedCoins': 'EduCoins Earned!',

    // Mini App
    'app.home': 'Home',
    'app.lessons': 'Lessons',
    'app.games': 'Games',
    'app.aiTutor': 'AI Tutor',
    'app.profile': 'Profile',
    'app.debt': 'Debt Amount',
    'app.paid': 'Paid In Full',

    // Umumiy
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.all': 'All',
    'common.language': 'Language',
    'common.notifications': 'Notifications',
  },
};
