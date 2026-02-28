import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { env } from '@lsrv/common/environment';

import { AuthService } from './data-access.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
	imports: [
		PassportModule,
		JwtModule.register({
			secret: env.LSRV_SECRET || 'fallback-secret-for-compile',
			signOptions: { expiresIn: '1d' } // Add expiration if needed
		})
	],
	controllers: [],
	providers: [AuthService, LocalStrategy, JwtStrategy],
	exports: [AuthService, JwtModule, PassportModule]
})
export class AuthDataAccessModule {}
