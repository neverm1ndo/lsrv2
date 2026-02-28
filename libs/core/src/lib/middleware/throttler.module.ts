import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { env } from '@lsrv/common/environment';

const RATE_LIMIT_MULTIPLIER = 900; // Found in existing rate-limiter.ts

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{
				ttl: RATE_LIMIT_MULTIPLIER * env.COMMON_RATE_LIMIT_WINDOW_MS,
				limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS
			}
		])
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		}
	]
})
export class AppThrottlerModule {}
