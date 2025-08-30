import dotenv from "dotenv";
import { array, coerce, object, string, treeifyError, url, enum as zenum } from "zod";

dotenv.config();

const envSchema = object({
	NODE_ENV: zenum(["development", "production", "test"]).default("production"),
	HOST: string().min(1).default("localhost"),
	HTTPS_PORT: coerce.number().int().positive().default(8443),
	HTTP_PORT: coerce.number().int().positive().default(8080),
	CORS_ORIGIN: url().default("http://localhost:8080"),
	COMMON_RATE_LIMIT_MAX_REQUESTS: coerce.number().int().positive().default(1000),
	COMMON_RATE_LIMIT_WINDOW_MS: coerce.number().int().positive().default(1000),
	SSL_KEY_PATH: string(),
	SSL_CERT_PATH: string(),
	LSRV_SECRET: string(),
	MONGO_URL: url(),
	CORS_WHITELIST: array(url()),
	DB_ADDRESS: url(),
	DB_USER: string(),
	DB_NAME: string(),
	DB_PASSWORD: string(),
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
	isTest: parsedEnv.data.NODE_ENV === "test",
};
