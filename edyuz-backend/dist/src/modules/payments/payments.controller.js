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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const client_1 = require("@prisma/client");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService, access) {
        this.paymentsService = paymentsService;
        this.access = access;
    }
    async create(dto, user) {
        await this.access.student(user, dto.studentId);
        return this.paymentsService.create(dto);
    }
    async chargeMonthly(user, groupId) {
        if (groupId)
            await this.access.group(user, groupId);
        return this.paymentsService.chargeMonthly(user.centerId, groupId);
    }
    async findAll(user, studentId) {
        if (!user) {
            if (!studentId) {
                throw new common_1.BadRequestException('studentId kiritilishi shart');
            }
            return this.paymentsService.findAll(studentId);
        }
        if (studentId)
            await this.access.student(user, studentId);
        return this.paymentsService.findAll(studentId, this.access.scopeCenter(user));
    }
    async findOne(id, user) {
        await this.access.payment(user, id);
        return this.paymentsService.findOne(id);
    }
    clickPrepare(data) {
        return this.paymentsService.clickPrepare(data);
    }
    clickComplete(data) {
        return this.paymentsService.clickComplete(data);
    }
    createAtmosInvoice(body) {
        return this.paymentsService.createAtmosInvoice(body?.studentId, Number(body?.amount));
    }
    atmosCallback(data, sign) {
        return this.paymentsService.atmosCallback(data, sign || data?.sign || '');
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Post)('charge-monthly'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "chargeMonthly", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "findOne", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('click/prepare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "clickPrepare", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('click/complete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "clickComplete", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('atmos/create-invoice'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createAtmosInvoice", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Post)('atmos/callback'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('sign')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "atmosCallback", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        access_service_1.AccessService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map