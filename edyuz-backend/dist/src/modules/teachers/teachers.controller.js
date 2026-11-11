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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const teachers_service_1 = require("./teachers.service");
const create_teacher_dto_1 = require("./dto/create-teacher.dto");
const update_teacher_dto_1 = require("./dto/update-teacher.dto");
const pay_salary_dto_1 = require("./dto/pay-salary.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let TeachersController = class TeachersController {
    constructor(teachersService, access) {
        this.teachersService = teachersService;
        this.access = access;
    }
    findAll(user, centerId) {
        return this.teachersService.findAll(this.access.scopeCenter(user, centerId));
    }
    async findOne(id, user) {
        await this.access.staff(user, id);
        return this.teachersService.findOne(id);
    }
    create(dto, user) {
        dto.centerId = this.access.centerForCreate(user, dto.centerId);
        return this.teachersService.create(dto);
    }
    async update(id, dto, user) {
        await this.access.staff(user, id);
        return this.teachersService.update(id, dto);
    }
    async delete(id, user) {
        await this.access.staff(user, id);
        return this.teachersService.delete(id);
    }
    async paySalary(id, dto, user) {
        await this.access.staff(user, id);
        return this.teachersService.paySalary(id, dto);
    }
    async getSalaryHistory(id, user) {
        await this.access.staff(user, id);
        return this.teachersService.getSalaryHistory(id);
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('centerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_teacher_dto_1.CreateTeacherDto, Object]),
    __metadata("design:returntype", void 0)
], TeachersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_teacher_dto_1.UpdateTeacherDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/pay-salary'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_salary_dto_1.PaySalaryDto, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "paySalary", null);
__decorate([
    (0, common_1.Get)(':id/salary-history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getSalaryHistory", null);
exports.TeachersController = TeachersController = __decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService,
        access_service_1.AccessService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map