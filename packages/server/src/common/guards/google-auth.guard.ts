import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    // Log error for debugging
    if (err) {
      console.error('Google OAuth error:', err);
    }
    if (info) {
      console.error('Google OAuth info:', info);
    }
    
    // If authentication fails, still allow the request to proceed
    // The callback handler will check req.user and redirect appropriately
    if (err || !user) {
      // Return null so the callback handler can handle the error gracefully
      return null;
    }
    
    return user;
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch (error) {
      // If authentication fails, allow request to proceed to callback handler
      // which will handle the error gracefully with redirect
      const request = context.switchToHttp().getRequest();
      request.user = null;
      return true;
    }
  }
}
