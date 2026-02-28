import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServiceResponse } from '@lsrv/models/response';
import { UserSession } from './models/session.model';

type SessionResponse = ServiceResponse<UserSession | null | unknown>;

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(user: UserSession): Promise<SessionResponse> {
    const { id, username, main_group, permissions, avatar } = user;
    const payload = { id, username, main_group, permissions };

    try {
      const token = this.jwtService.sign(payload);
      
      return ServiceResponse.success(`Successfully logged in as "${user.username}"`, {
        id,
        username,
        main_group,
        avatar,
        permissions,
        token,
      });
    } catch (err) {
      return ServiceResponse.failure('Unexpected error', err, 500);
    }
  }
}
