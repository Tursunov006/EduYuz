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
exports.CertificatesController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const certificates_service_1 = require("./certificates.service");
const issue_certificate_dto_1 = require("./dto/issue-certificate.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const access_service_1 = require("../../common/access/access.service");
let CertificatesController = class CertificatesController {
    constructor(certificatesService, access) {
        this.certificatesService = certificatesService;
        this.access = access;
    }
    async issue(dto, user) {
        await this.access.student(user, dto.studentId);
        return this.certificatesService.issue(dto);
    }
    async findAll(user) {
        return this.certificatesService.findAll(this.access.scopeCenter(user));
    }
    async verify(certNumber) {
        return this.certificatesService.verify(certNumber);
    }
    async findByStudent(studentId, user) {
        if (user)
            await this.access.student(user, studentId);
        return this.certificatesService.findByStudent(studentId);
    }
};
exports.CertificatesController = CertificatesController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.RoleType.admin),
    (0, common_1.Post)('issue'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [issue_certificate_dto_1.IssueCertificateDto, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "issue", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('verify/:certNumber'),
    __param(0, (0, common_1.Param)('certNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "verify", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "findByStudent", null);
exports.CertificatesController = CertificatesController = __decorate([
    (0, common_1.Controller)('certificates'),
    __metadata("design:paramtypes", [certificates_service_1.CertificatesService,
        access_service_1.AccessService])
], CertificatesController);
//# sourceMappingURL=certificates.controller.js.map