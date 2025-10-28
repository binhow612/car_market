import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/rbac/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const duration = Date.now() - startTime;
        const method = request.method;
        const url = request.url;
        const statusCode = response.statusCode;

        // Only log significant actions
        if (this.shouldLog(method, url, statusCode)) {
          try {
            await this.auditService.log({
              userId: user?.id,
              action: this.getActionFromMethod(method),
              resource: this.getResourceFromUrl(url),
              resourceId: this.extractResourceId(request),
              details: {
                method,
                url,
                statusCode,
                duration,
                userAgent: request.headers['user-agent'],
              },
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            });
          } catch (error) {
            console.error('Failed to log audit event:', error);
          }
        }
      }),
    );
  }

  private shouldLog(method: string, url: string, statusCode: number): boolean {
    // Log all non-GET requests and important GET requests
    if (method !== 'GET') {
      return true;
    }

    // Log important GET requests
    const importantPaths = ['/admin', '/users/profile', '/listings/my'];
    return importantPaths.some(path => url.includes(path));
  }

  private getActionFromMethod(method: string): string {
    const actionMap = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  private getResourceFromUrl(url: string): string {
    if (url.includes('/users')) return 'USER';
    if (url.includes('/listings')) return 'LISTING';
    if (url.includes('/transactions')) return 'TRANSACTION';
    if (url.includes('/admin')) return 'ADMIN';
    if (url.includes('/chat')) return 'CHAT';
    if (url.includes('/assistant')) return 'ASSISTANT';
    if (url.includes('/logs')) return 'LOGS';
    return 'SYSTEM';
  }

  private extractResourceId(request: any): string | undefined {
    return request.params?.id || request.body?.id || request.query?.id;
  }
}
