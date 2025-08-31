import type { CorsOptions } from "cors";

import { env } from "@lsrv/common/environment";

const { CORS_WHITELIST } = env;

function checkCorsOrigin(origin: string | undefined, callback: (error: Error | null, origin?: boolean) => void) {
	if (!origin || !CORS_WHITELIST.includes(origin)) {
		return void callback(null, true);
	}

	callback(new Error("Not allowed by CORS"));
}

export const CORS_CONFIG: CorsOptions = {
	credentials: true,
	methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
	origin: checkCorsOrigin,
	preflightContinue: false,
	optionsSuccessStatus: 204
};
