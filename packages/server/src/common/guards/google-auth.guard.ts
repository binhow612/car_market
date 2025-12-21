import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // Override to prevent exceptions from being thrown
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    try {
      // Try to authenticate
      const result = await super.canActivate(context) as boolean;
      return result;
    } catch (error) {
      // If authentication fails, set user to null and allow request to proceed
      request.user = null;
      return true;
    }
  }

  // Override handleRequest to always allow request to proceed
  override handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // Always return user (or null) without throwing
    // The controller will handle the case when user is null
    return err ? null : user;
  }
}
