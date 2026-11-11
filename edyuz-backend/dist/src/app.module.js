"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const centers_module_1 = require("./modules/centers/centers.module");
const users_module_1 = require("./modules/users/users.module");
const courses_module_1 = require("./modules/courses/courses.module");
const groups_module_1 = require("./modules/groups/groups.module");
const students_module_1 = require("./modules/students/students.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const payments_module_1 = require("./modules/payments/payments.module");
const telegram_module_1 = require("./modules/telegram/telegram.module");
const lms_module_1 = require("./modules/lms/lms.module");
const gamification_module_1 = require("./modules/gamification/gamification.module");
const certificates_module_1 = require("./modules/certificates/certificates.module");
const teachers_module_1 = require("./modules/teachers/teachers.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const sms_module_1 = require("./modules/sms/sms.module");
const ai_module_1 = require("./modules/ai/ai.module");
const games_module_1 = require("./modules/games/games.module");
const instagram_module_1 = require("./modules/instagram/instagram.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
            prisma_module_1.PrismaModule,
            sms_module_1.SmsModule,
            telegram_module_1.TelegramModule,
            lms_module_1.LmsModule,
            gamification_module_1.GamificationModule,
            certificates_module_1.CertificatesModule,
            teachers_module_1.TeachersModule,
            expenses_module_1.ExpensesModule,
            ai_module_1.AiModule,
            games_module_1.GamesModule,
            instagram_module_1.InstagramModule,
            auth_module_1.AuthModule,
            centers_module_1.CentersModule,
            users_module_1.UsersModule,
            courses_module_1.CoursesModule,
            groups_module_1.GroupsModule,
            students_module_1.StudentsModule,
            attendance_module_1.AttendanceModule,
            payments_module_1.PaymentsModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map