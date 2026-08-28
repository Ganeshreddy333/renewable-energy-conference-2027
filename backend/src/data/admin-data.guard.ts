import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const publicReadTables = new Set([
  'site_data',
  'website_content',
  'speakers',
  'media_partners',
  'information_blocks',
]);

const publicInsertTables = new Set([
  'contact_messages',
  'abstract_submissions',
  'registration_intents',
]);

@Injectable()
export class AdminDataGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const table = String(request.params.table || '');
    const path = String(request.route?.path || request.path || '');
    const isPublicRequest =
      (request.method === 'GET' && publicReadTables.has(table)) ||
      (request.method === 'POST' && publicInsertTables.has(table)) ||
      (request.method === 'POST' && [
        '/rpc/validate_registration_coupon',
        '/functions/create-stripe-checkout',
        '/functions/create-paypal-order',
        '/functions/capture-paypal-order',
      ].includes(path)) ||
      (request.method === 'POST' && path.includes('/webhooks/payment/'));

    if (isPublicRequest) {
      request.isAdmin = false;
      return true;
    }

    const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('An administrator session is required');

    try {
      const payload = await this.jwtService.verifyAsync<{ role?: string }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      if (payload.role !== 'admin') throw new UnauthorizedException('Administrator access is required');
      request.isAdmin = true;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Your administrator session is invalid or has expired');
    }
  }
}
