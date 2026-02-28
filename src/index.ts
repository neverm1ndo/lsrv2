import http from 'node:http';

import express from 'express';

import { env } from '@lsrv/common/environment';
import { logger } from '@lsrv/logger'; // using original logger for generic process handlers for now

import { bootstrap } from './app/bootstrap';

async function start() {
	const { app, server } = await bootstrap();

	logger.info(`Server (HTTPS) running on port https://${env.HOST}:${env.HTTPS_PORT}`);

	// Create a separate simple HTTP server for ACME challenges and redirect if needed
	const httpApp = express();
	httpApp.use('/.well-known/acme-challenge', express.static('./static/.well-known/acme-challenge'));

	const httpServer = http.createServer(httpApp);
	httpServer.listen(env.HTTP_PORT, () => {
		logger.info(`Server (HTTP) running on port http://${env.HOST}:${env.HTTP_PORT}`);
	});

	const ForceShutdownDelay = 10000;

	const onCloseSignal = async () => {
		logger.info('sigint received, shutting down');
		await app.close();
		httpServer.close(() => {
			logger.info('server closed');
			process.exit();
		});
		setTimeout(() => process.exit(1), ForceShutdownDelay).unref(); // Force shutdown after 10s
	};

	process.on('SIGINT', onCloseSignal);
	process.on('SIGTERM', onCloseSignal);
}

start().catch((err) => {
	logger.error(err, 'Failed to start application');
	process.exit(1);
});
