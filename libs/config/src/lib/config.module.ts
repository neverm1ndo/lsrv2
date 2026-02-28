import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadConfig } from './config.loader';

@Global()
@Module({
	imports: [
		ConfigModule.forRoot({
			load: [loadConfig],
			isGlobal: true,
			ignoreEnvFile: true // We don't want dotenv, we only use json
		})
	]
})
export class AppConfigModule {}
