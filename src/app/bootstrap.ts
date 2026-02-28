import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { Logger } from 'nestjs-pino';

import { BaseRouter } from '@lsrv/api';
import { env } from '@lsrv/common/environment';
import { GlobalExceptionFilter } from '@lsrv/core';

import { AppModule } from './app.module';
import { LsrvLogsObserver } from './logs.observer'; // Using NestJS observer? No, this uses static new for now

export async function bootstrap() {
	const httpsOptions = {
		key: readFileSync(env.SSL_KEY_PATH, 'utf8'),
		cert: readFileSync(env.SSL_CERT_PATH, 'utf8'),
		rejectUnauthorized: false
	};

	const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(express()), {
		httpsOptions,
		bufferLogs: true
	});

	// Setup Logger
	app.useLogger(app.get(Logger));
	app.useGlobalFilters(new GlobalExceptionFilter());

	// Set global prefix for all NestJS Controllers
	app.setGlobalPrefix('v2');

	// Express urlencoded is applied automatically by Nest, or we can add it:
	app.use(express.urlencoded({ extended: true }));

	// Static files for ACME
	app.use('/.well-known/acme-challenge', express.static(join(__dirname, '../static/.well-known/acme-challenge')));

	// Legacy BaseRouter - Mount it directly to express instance
	// Since we migrated Auth, the v2 BaseRouter still has health, user, logs
	app.use('/v2', BaseRouter);

	// Initialize Socket.io (NestJS way will be added later, for now we will adapt bootstrapIo)
	// To keep legacy io running, we might need to get the HTTP server:
	const server = app.getHttpServer();
	// BUT NestJS natively supports websockets via Gateways.
	// I will leave legacy socket bootstrap here for a moment if needed, or we adapt it in AppModule.

	// Legacy Observer init
	const observer = new LsrvLogsObserver();
	observer.subscribe();

	// Listen on HTTPS
	await app.listen(env.HTTPS_PORT);

	return { app, server };
}
