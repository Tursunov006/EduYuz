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
const centers_service_1 = require("./centers.service");
const create_center_dto_1 = require("./dto/create-center.dto");
const update_center_dto_1 = require("./dto/update-center.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let CentersController = class CentersController {
    constructor(centersService) {
        this.centersService = centersService;
    }
    create(dto) {
        return this.centersService.create(dto);
    }
    findAll() {
        return this.centersService.findAll();
    }
    findOne(id) {
        return this.centersService.findOne(id);
    }
    update(id, dto) {
        return this.centersService.update(id, dto);
    }
    remove(id) {
        return this.centersService.remove(id);
    }
};
exports.CentersController = CentersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_center_dto_1.CreateCenterDto]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "findOne", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_center_dto_1.UpdateCenterDto]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "update", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CentersController.prototype, "remove", null);
exports.CentersController = CentersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('centers'),
    __metadata("design:paramtypes", [centers_service_1.CentersService])
], CentersController);
//# sourceMappingURL=centers.controller.js.map