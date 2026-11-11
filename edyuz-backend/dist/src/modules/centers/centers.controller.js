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
exports.CentersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const centers_service_1 = require("./centers.service");
const create_center_dto_1 = require("./dto/create-center.dto");
const update_center_dto_1 = require("./dto/update-center.dto");
const center_admin_dto_1 = require("./dto/center-admin.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let CentersController = class CentersController {
    constructor(centersService, access) {
        this.centersService = centersService;
        this.access = access;
    }
    create(dto) {
        return this.centersService.create(dto);
    }
    findAll(user) {
        return this.centersService.findAll(this.access.isSuperadmin(user) ? undefined : user.centerId);
    }
    async findOne(id, user) {
        await this.access.center(user, id);
        return this.centersService.findOne(id);
    }
    async update(id, dto, user) {
        await this.access.center(user, id);
        return this.centersService.update(id, dto);
    }
    updateStatus(id, dto) {
        return this.centersService.updateStatus(id, dto.status, dto.days ?? 30);
    }
    resetPassword(id, dto) {
        return this.centersService.resetDirectorPassword(id, dto.password);
    }
    remove(id, user) {
        if (id === user.centerId) {
            throw new common_1.ForbiddenException("O'zingiz biriktirilgan tizim markazini o'chirib bo'lmaydi");
        }
        return this.centersService.remove(id);
    }
};
exports.CentersController = CentersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.superadmin),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_center_dto_1.CreateCenterDto]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CentersController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_center_dto_1.UpdateCenterDto, Object]),
    __metadata("design:returntype", Promise)
], CentersController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.superadmin),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, center_admin_dto_1.UpdateCenterStatusDto]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "updateStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.superadmin),
    (0, common_1.Post)(':id/reset-password'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, center_admin_dto_1.ResetDirectorPasswordDto]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "resetPassword", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.superadmin),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "remove", null);
exports.CentersController = CentersController = __decorate([
    (0, common_1.Controller)('centers'),
    __metadata("design:paramtypes", [centers_service_1.CentersService,
        access_service_1.AccessService])
], CentersController);
//# sourceMappingURL=centers.controller.js.map