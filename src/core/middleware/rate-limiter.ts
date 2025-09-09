import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { env } from "@lsrv/common/environment";

const RATE_LIMIT_MULTIPLIER = 900;

export const rateLimiter = rateLimit({
	legacyHeaders: true,
	limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS,
	message: "Too many requests, please try again later.",
	standardHeaders: true,
	windowMs: RATE_LIMIT_MULTIPLIER * env.COMMON_RATE_LIMIT_WINDOW_MS,
	keyGenerator: (req: Request): string => {
		if (req.query.apiKey) return req.query.apiKey as string;

		const ipv6Subnet = 64; // calculate or set a fixed value here
		return ipKeyGenerator(req.ip as string, ipv6Subnet);
	}
});
