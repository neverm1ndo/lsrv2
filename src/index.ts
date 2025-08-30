import { env } from "@lsrv/common";
import { lsrv2, server } from "@lsrv/core";
import { logger } from "@lsrv/logger";

[
	{ server, port: env.HTTPS_PORT }, // https
	{ server: lsrv2, port: env.HTTP_PORT }, // http, used for certbot
].forEach(({ server, port }) => {
	const { NODE_ENV, HOST } = env;

	server.listen(port, () => logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${port}`));
});

const onCloseSignal = () => {
	logger.info("sigint received, shutting down");
	server.close(() => {
		logger.info("server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
