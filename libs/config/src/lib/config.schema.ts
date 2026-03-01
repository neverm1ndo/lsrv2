import { z } from 'zod';

const DEFAULT_HTTPS_PORT = 8443;
const DEFAULT_HTTP_PORT = 8080;
const DEFAULT_RATE_LIMIT = 1000;

export const configSchema: z.ZodObject<any> = z.object({
	server: z.object({
		env: z.enum(['development', 'production', 'test']).default('production'),
		host: z.string().min(1).default('localhost'),
		httpsPort: z.coerce.number().int().positive().default(DEFAULT_HTTPS_PORT),
		httpPort: z.coerce.number().int().positive().default(DEFAULT_HTTP_PORT),
		secret: z.string(),
		cors: z.object({
			origin: z.url().default('https://localhost:8443'),
			whitelist: z.string()
		}),
		rateLimit: z.object({
			maxRequests: z.coerce.number().int().positive().default(DEFAULT_RATE_LIMIT),
			windowMs: z.coerce.number().int().positive().default(DEFAULT_RATE_LIMIT)
		})
	}),
	ssl: z.object({
		keyPath: z.string(),
		certPath: z.string()
	}),
	database: z.object({
		mysql: z.object({
			address: z.string(),
			user: z.string(),
			password: z.string(),
			name: z.string()
		}),
		mongo: z.object({
			url: z.string().url()
		})
	}),
	storage: z.object({
		logsPath: z.string(),
		rootPath: z.string(),
		configuratorPath: z.string()
	})
});

export type AppConfig = z.infer<typeof configSchema>;
