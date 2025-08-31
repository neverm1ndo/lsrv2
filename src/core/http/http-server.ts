import { readFileSync } from "node:fs";

import { env } from "@lsrv/common/environment";

export const HTTPS_CONFIG = {
	key: readFileSync(env.SSL_KEY_PATH, "utf8"),
	cert: readFileSync(env.SSL_CERT_PATH, "utf8"),
	rejectUnauthorized: false
};
