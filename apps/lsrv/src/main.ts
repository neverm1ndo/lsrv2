/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app/app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });
	app.useLogger(app.get(Logger));

	const globalPrefix = 'api';
	app.setGlobalPrefix(globalPrefix);

	const DEFAULT_PORT = 3000;
	const port = process.env.PORT || DEFAULT_PORT;
	await app.listen(port);
	const logger = app.get(Logger);
	logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
