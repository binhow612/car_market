import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  private readonly logger = new Logger(GoogleAuthGuard.name);

  // Override to prevent exceptions from being thrown
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Log request details for debugging callback URL issues
    if (request.url?.includes('/google/callback')) {
      this.logger.log(`Google OAuth callback received: ${request.url}`);
      this.logger.log(`Query params: ${JSON.stringify(request.query)}`);
      this.logger.log(`Full URL: ${request.protocol}://${request.get('host')}${request.originalUrl}`);
    }
    
    try {
      // Try to authenticate
      const result = await super.canActivate(context) as boolean;
      return result;
    } catch (error: any) {
      // Log the error for debugging
      this.logger.error('Google OAuth authentication failed:', error?.message || error);
      
      // If authentication fails, set user to null and allow request to proceed
      // This allows the controller to handle the error gracefully
      request.user = null;
      return true; // Always return true to allow request to proceed to controller
    }
  }

  // Override handleRequest to always allow request to proceed
  // This is called by Passport after strategy validation
  override handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    // If there's an error or no user, log it but don't throw
    if (err) {
      // Log detailed error information
      const errorDetails: any = {
        message: err.message,
        code: err.code,
        status: err.status,
        uri: err.uri,
      };
      
      // Add stack trace in development
      if (process.env.NODE_ENV === 'development') {
        errorDetails.stack = err.stack;
      }
      
      this.logger.error('Google OAuth error in handleRequest:', errorDetails);
      
      // Log specific error messages for common issues
      if (err.code === 'invalid_client') {
        this.logger.error(
          'Invalid client error - This usually means:'
        );
        this.logger.error(
          '1) Client ID or Client Secret is incorrect'
        );
        this.logger.error(
          '2) Callback URL in environment variable does not match Google Console'
        );
        this.logger.error(
          '3) OAuth credentials are for a different project/environment'
        );
        this.logger.error(
          'Please verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL match your Google Cloud Console OAuth 2.0 configuration'
        );
      } else if (err.code === 'redirect_uri_mismatch') {
        this.logger.error(
          'Redirect URI mismatch - The callback URL used in the request does not match any authorized redirect URI in Google Console'
        );
        this.logger.error(
          'Make sure the exact callback URL (including /api/ prefix if used) is added to Authorized redirect URIs in Google Console'
        );
      }
      
      return null;
    }
    
    if (!user) {
      this.logger.warn('Google OAuth validation returned no user', info ? { info } : '');
      return null;
    }
    
    // Return user if validation succeeded
    return user;
  }
}
