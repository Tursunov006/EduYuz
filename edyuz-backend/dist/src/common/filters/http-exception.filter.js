"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('HttpExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Ichki server xatoligi yuz berdi';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' && res.message ? res.message : res;
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (exception.code === 'P2002') {
                status = common_1.HttpStatus.CONFLICT;
                message = "Bunday ma'lumot allaqachon mavjud";
            }
            else if (exception.code === 'P2025') {
                status = common_1.HttpStatus.NOT_FOUND;
                message = "Ma'lumot topilmadi";
            }
            else if (exception.code === 'P2003') {
                status = common_1.HttpStatus.CONFLICT;
                message = "Bu yozuvga bog'langan boshqa ma'lumotlar mavjud, avval ularni o'chiring";
            }
            else {
                this.logger.error(`${request.method} ${request.url} -> Prisma ${exception.code}: ${exception.message}`);
            }
        }
        else {
            const err = exception;
            this.logger.error(`${request.method} ${request.url} -> ${err?.message}`, err?.stack);
        }
        response.status(status).json({
            success: false,
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: message,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map