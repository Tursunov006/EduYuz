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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const groups_service_1 = require("./groups.service");
const create_group_dto_1 = require("./dto/create-group.dto");
const update_group_dto_1 = require("./dto/update-group.dto");
const add_student_dto_1 = require("./dto/add-student.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let GroupsController = class GroupsController {
    constructor(groupsService, access) {
        this.groupsService = groupsService;
        this.access = access;
    }
    async create(dto, user) {
        dto.centerId = this.access.centerForCreate(user, dto.centerId);
        if (dto.courseId)
            await this.access.course(user, dto.courseId);
        if (dto.teacherId)
            await this.access.staff(user, dto.teacherId);
        return this.groupsService.create(dto, user.id);
    }
    findAll(user, centerId, courseId, teacherId) {
        return this.groupsService.findAll(this.access.scopeCenter(user, centerId), courseId, teacherId);
    }
    async findOne(id, user) {
        await this.access.group(user, id);
        return this.groupsService.findOne(id);
    }
    async update(id, dto, user) {
        await this.access.group(user, id);
        if (dto.courseId)
            await this.access.course(user, dto.courseId);
        if (dto.teacherId)
            await this.access.staff(user, dto.teacherId);
        return this.groupsService.update(id, dto);
    }
    async remove(id, user) {
        await this.access.group(user, id);
        return this.groupsService.remove(id);
    }
    async addStudent(groupId, dto, user) {
        await this.access.group(user, groupId);
        await this.access.student(user, dto.studentId);
        return this.groupsService.addStudent(groupId, dto);
    }
    async removeStudent(groupId, studentId, user) {
        await this.access.group(user, groupId);
        return this.groupsService.removeStudent(groupId, studentId);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_dto_1.CreateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('centerId')),
    __param(2, (0, common_1.Query)('courseId')),
    __param(3, (0, common_1.Query)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_group_dto_1.UpdateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "remove", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Post)(':id/students'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_student_dto_1.AddStudentToGroupDto, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "addStudent", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Delete)(':id/students/:studentId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeStudent", null);
exports.GroupsController = GroupsController = __decorate([
    (0, common_1.Controller)('groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService,
        access_service_1.AccessService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map