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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const mark_attendance_dto_1 = require("./dto/mark-attendance.dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const access_service_1 = require("../../common/access/access.service");
let AttendanceController = class AttendanceController {
    constructor(attendanceService, access) {
        this.attendanceService = attendanceService;
        this.access = access;
    }
    async faceScan(image, user) {
        if (!image || typeof image !== 'string') {
            throw new common_1.BadRequestException('Rasm yuborilmadi');
        }
        return this.attendanceService.processFaceScan(image, user.centerId);
    }
    async markAttendance(dto, user) {
        await this.access.group(user, dto.groupId);
        return this.attendanceService.markGroupAttendance(dto, user.id);
    }
    async findByGroupAndDate(groupId, date, user) {
        await this.access.group(user, groupId);
        return this.attendanceService.findByGroupAndDate(groupId, date);
    }
    async getStudentAttendance(studentId, user) {
        if (user)
            await this.access.student(user, studentId);
        return this.attendanceService.getStudentAttendance(studentId);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('face-scan'),
    __param(0, (0, common_1.Body)('image')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "faceScan", null);
__decorate([
    (0, common_1.Post)('mark'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_attendance_dto_1.MarkAttendanceDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Get)('group/:groupId'),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "findByGroupAndDate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService,
        access_service_1.AccessService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map