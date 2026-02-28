import { Module } from '@nestjs/common';

import { AuthDataAccessModule } from '@lsrv/auth/data-access';

import { AuthController } from './feature.controller';

@Module({
	imports: [AuthDataAccessModule],
	controllers: [AuthController],
	providers: []
})
export class AuthFeatureModule {}
