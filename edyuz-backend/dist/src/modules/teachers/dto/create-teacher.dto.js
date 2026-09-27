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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTeacherDto = void 0;
const class_validator_1 = require("class-validator");
class CreateTeacherDto {
}
exports.CreateTeacherDto = CreateTeacherDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "F.I.SH kiritilishi shart" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: "Telefon raqam kiritilishi shart" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "specialty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['percentage', 'fixed'], { message: "Maosh turi 'percentage' yoki 'fixed' bo'lishi kerak" }),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "salaryType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: "Maosh stavkasi son bo'lishi kerak" }),
    __metadata("design:type", Number)
], CreateTeacherDto.prototype, "salaryRate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeacherDto.prototype, "centerId", void 0);
//# sourceMappingURL=create-teacher.dto.js.map