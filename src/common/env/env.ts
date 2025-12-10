import dotenv from "dotenv";
import { coerce, object, string, treeifyError, url, enum as zenum } from "zod";

dotenv.config();

const DEFAULT_HTTPS_PORT = 8443;
const DEFAULT_HTTP_PORT = 8080;
const DEFAULT_RATE_LIMIT = 1000;

const envSchema = object({
	NODE_ENV: zenum(["development", "production", "test"]).default("production"),
	HOST: string().min(1).default("localhost"),
	HTTPS_PORT: coerce.number().int().positive().default(DEFAULT_HTTPS_PORT),
	HTTP_PORT: coerce.number().int().positive().default(DEFAULT_HTTP_PORT),
	CORS_ORIGIN: url().default("https://localhost:8443"),
	COMMON_RATE_LIMIT_MAX_REQUESTS: coerce.number().int().positive().default(DEFAULT_RATE_LIMIT),
	COMMON_RATE_LIMIT_WINDOW_MS: coerce.number().int().positive().default(DEFAULT_RATE_LIMIT),
	SSL_KEY_PATH: string(),
	SSL_CERT_PATH: string(),
	LSRV_SECRET: string(),
	MONGO_URL: url(),
	CORS_WHITELIST: string(),
	DB_ADDRESS: string(),
	DB_USER: string(),
	DB_NAME: string(),
	DB_PASSWORD: string(),
	LOGS_PATH: string(),
	ROOT_PATH: string(),
	CONFIGURATOR_PATH: string()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", treeifyError(parsedEnv.error));

	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test"
};
