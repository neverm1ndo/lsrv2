import { env } from "@lsrv/common/environment";
import { lsrv2, server } from "@lsrv/core";
import { logger } from "@lsrv/logger";

[
	{ server, port: env.HTTPS_PORT, protocol: "https" }, // https
	{ server: lsrv2, port: env.HTTP_PORT, protocol: "http" } // http, used for certbot
].forEach(({ server, port, protocol }) => {
	const { NODE_ENV, HOST } = env;

	server.listen(port, () => logger.info(`Server (${NODE_ENV}) running on port ${protocol}://${HOST}:${port}`));
});

const FORCE_SHUTDOWN_DELAY = 10000;

const onCloseSignal = () => {
	logger.info("sigint received, shutting down");
	server.close(() => {
		logger.info("server closed");
		process.exit();
	});
	setTimeout(() => process.exit(1), FORCE_SHUTDOWN_DELAY).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal);
process.on("SIGTERM", onCloseSignal);
