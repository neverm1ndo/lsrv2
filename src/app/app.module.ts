import { type MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';

import { AuthFeatureModule } from '@lsrv/auth/feature';
import { env } from '@lsrv/common/environment';
import { AppThrottlerModule, DatabaseModule, LoggerModule, SocketModule } from '@lsrv/core';
import { CORS_CONFIG } from '@lsrv/core/http';
import { lsrv2Session } from '@lsrv/core/session';
import { ObserverModule } from '@lsrv/observer';

@Module({
	imports: [
		DatabaseModule,
		LoggerModule,
		// Only import Throttler if in production, but NestJS recommends setting it and conditionally returning true in a guard.
		// For now, we always import it since ThrottlerGuard will be provided. We can disable it via env if needed.
		...(env.isProduction ? [AppThrottlerModule] : []),
		SocketModule,
		ObserverModule.register({ path: env.LOGS_PATH }),
		AuthFeatureModule // Already migrated
	],
	controllers: [],
	providers: []
})
export class AppModule {
	configure(consumer: MiddlewareConsumer) {
		// Apply global middlewares here that are specific to Express
		consumer
			.apply(cors(CORS_CONFIG), lsrv2Session, passport.initialize(), passport.session(), helmet())
			.forRoutes({ path: '*', method: RequestMethod.ALL });
	}
}
