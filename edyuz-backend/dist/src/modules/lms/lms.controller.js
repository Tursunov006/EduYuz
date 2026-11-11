"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LmsController = void 0;
const common_1 = require("@nestjs/common");
const lms_service_1 = require("./lms.service");
const create_lesson_dto_1 = require("./dto/create-lesson.dto");
const create_homework_dto_1 = require("./dto/create-homework.dto");
const submit_homework_dto_1 = require("./dto/submit-homework.dto");
const grade_submission_dto_1 = require("./dto/grade-submission.dto");
const quiz_dto_1 = require("./dto/quiz.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let LmsController = class LmsController {
    constructor(lmsService, access) {
        this.lmsService = lmsService;
        this.access = access;
    }
    async getLessons(groupId, user) {
        if (user) {
            await this.access.group(user, groupId);
            return this.lmsService.getLessonsByGroup(groupId);
        }
        return this.lmsService.getLessonsByGroupPublic(groupId);
    }
    async createLesson(dto, user) {
        await this.access.group(user, dto.groupId);
        return this.lmsService.createLesson(dto);
    }
    async deleteLesson(id, user) {
        await this.access.lesson(user, id);
        return this.lmsService.deleteLesson(id);
    }
    async createHomework(dto, user) {
        await this.access.lesson(user, dto.lessonId);
        return this.lmsService.createHomework(dto);
    }
    async submitHomework(dto) {
        return this.lmsService.submitHomework(dto);
    }
    async gradeSubmission(submissionId, dto, user) {
        await this.access.submission(user, submissionId);
        return this.lmsService.gradeSubmission(submissionId, dto);
    }
    async getSubmissions(homeworkId, user) {
        await this.access.homework(user, homeworkId);
        return this.lmsService.getSubmissionsByHomework(homeworkId);
    }
    async createQuiz(dto, user) {
        await this.access.lesson(user, dto.lessonId);
        return this.lmsService.createQuiz(dto.lessonId, dto.title, dto.questions);
    }
    async submitQuiz(dto) {
        return this.lmsService.submitQuiz(dto.quizId, dto.studentId, dto.answers);
    }
};
exports.LmsController = LmsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('groups/:groupId/lessons'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "getLessons", null);
__decorate([
    (0, common_1.Post)('lessons'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lesson_dto_1.CreateLessonDto, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Delete)('lessons/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "deleteLesson", null);
__decorate([
    (0, common_1.Post)('homeworks'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_homework_dto_1.CreateHomeworkDto, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "createHomework", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('homeworks/submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submit_homework_dto_1.SubmitHomeworkDto]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "submitHomework", null);
__decorate([
    (0, common_1.Post)('homeworks/grade/:submissionId'),
    __param(0, (0, common_1.Param)('submissionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grade_submission_dto_1.GradeSubmissionDto, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "gradeSubmission", null);
__decorate([
    (0, common_1.Get)('homeworks/:homeworkId/submissions'),
    __param(0, (0, common_1.Param)('homeworkId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "getSubmissions", null);
__decorate([
    (0, common_1.Post)('quiz'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quiz_dto_1.CreateQuizDto, Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "createQuiz", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('quiz/submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quiz_dto_1.SubmitQuizDto]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "submitQuiz", null);
exports.LmsController = LmsController = __decorate([
    (0, common_1.Controller)('lms'),
    __metadata("design:paramtypes", [lms_service_1.LmsService,
        access_service_1.AccessService])
], LmsController);
//# sourceMappingURL=lms.controller.js.map