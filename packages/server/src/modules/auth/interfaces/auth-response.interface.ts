import { User } from '../../../entities/user.entity';

export interface AuthResponse {
  user: User;
  accessToken: string;
}
