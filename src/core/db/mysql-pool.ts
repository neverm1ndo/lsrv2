import { createPool } from "mysql2";

import { env } from "@lsrv/common";

export const DB_POOL = createPool({
	host: env.DB_ADDRESS,
	user: env.DB_USER,
	database: env.DB_NAME,
	password: env.DB_PASSWORD,
}).promise();
