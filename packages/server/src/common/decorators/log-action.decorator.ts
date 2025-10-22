import { SetMetadata } from '@nestjs/common';
import { LogCategory } from '../../entities/activity-log.entity';

export interface LogActionOptions {
  category?: LogCategory;
  message?: string;
  description?: string;
  logRequest?: boolean;
  logResponse?: boolean;
  logUser?: boolean;
}

export const LOG_ACTION_KEY = 'logAction';

export const LogAction = (options: LogActionOptions = {}) =>
  SetMetadata(LOG_ACTION_KEY, {
    category: options.category || LogCategory.USER_ACTION,
    message: options.message,
    description: options.description,
    logRequest: options.logRequest !== false, // Default to true
    logResponse: options.logResponse !== false, // Default to true
    logUser: options.logUser !== false, // Default to true
  });
