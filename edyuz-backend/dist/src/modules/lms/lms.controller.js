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
const public_decorator_1 = require("../../common/decorators/public.decorator");
let LmsController = class LmsController {
    constructor(lmsService) {
        this.lmsService = lmsService;
    }
    async getLessons(groupId) {
        return this.lmsService.getLessonsByGroup(groupId);
    }
    async createLesson(dto) {
        return this.lmsService.createLesson(dto);
    }
    async deleteLesson(id) {
        return this.lmsService.deleteLesson(id);
    }
    async createHomework(dto) {
        return this.lmsService.createHomework(dto);
    }
    async submitHomework(dto) {
        return this.lmsService.submitHomework(dto);
    }
    async gradeSubmission(submissionId, dto) {
        return this.lmsService.gradeSubmission(submissionId, dto);
    }
    async getSubmissions(homeworkId) {
        return this.lmsService.getSubmissionsByHomework(homeworkId);
    }
    async createQuiz(dto) {
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "getLessons", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('lessons'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lesson_dto_1.CreateLessonDto]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "createLesson", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('lessons/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "deleteLesson", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('homeworks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_homework_dto_1.CreateHomeworkDto]),
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
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('homeworks/grade/:submissionId'),
    __param(0, (0, common_1.Param)('submissionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, grade_submission_dto_1.GradeSubmissionDto]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "gradeSubmission", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('homeworks/:homeworkId/submissions'),
    __param(0, (0, common_1.Param)('homeworkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "getSubmissions", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('quiz'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "createQuiz", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('quiz/submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LmsController.prototype, "submitQuiz", null);
exports.LmsController = LmsController = __decorate([
    (0, common_1.Controller)('lms'),
    __metadata("design:paramtypes", [lms_service_1.LmsService])
], LmsController);
//# sourceMappingURL=lms.controller.js.map