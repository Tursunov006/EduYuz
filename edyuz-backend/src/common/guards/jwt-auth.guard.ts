import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Ochiq endpointlarda token ixtiyoriy: bor bo'lsa request.user to'ldiriladi,
      // yo'q yoki yaroqsiz bo'lsa so'rov anonim sifatida davom etadi.
      const request = context.switchToHttp().getRequest();
      if (request.headers?.authorization) {
        try {
          await super.canActivate(context);
        } catch {
          request.user = undefined;
        }
      }
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}
