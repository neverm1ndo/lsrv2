import type { Request } from "express";
import { StatusCodes } from "http-status-codes";
import { sign } from "jsonwebtoken";
import passport from "passport";

import { env } from "@lsrv/common/environment";
import { logger } from "@lsrv/logger";
import { ServiceResponse } from "@lsrv/models/response";

import type { UserSession } from "./models/session.model";

type SessionResponse = ServiceResponse<UserSession | null | unknown>;

export class AuthService {
	async session(req: Request): Promise<SessionResponse> {
		const { promise: authentication, resolve, reject } = Promise.withResolvers<SessionResponse>();
		const secret = env.LSRV_SECRET;

		passport.authenticate("local", { session: false }, (err: unknown, user: UserSession) => {
			if (err || !user || !secret) {

				return reject({
					message: "An error occured",
					err,
					status: StatusCodes.UNAUTHORIZED,
				});
			}

			req.login(user, { session: false }, (err) => {
				if (err)
					reject({
						message: "Unexpected error",
						body: err,
						status: StatusCodes.INTERNAL_SERVER_ERROR,
					});
			});

			const { id, username, main_group, permissions, avatar } = user;
			const token = sign({ id, username, main_group, permissions }, secret);

			resolve(
				ServiceResponse.success(`Successfully logged in as "${user.username}"`, {
					id,
					username,
					main_group,
                    avatar,
					permissions,
					token,
				}),
			);
		})(req);

		try {
			const userAuthentication = await authentication;

			return userAuthentication;
		} catch (err) {
			logger.error("Authentication error");

			const { message, body, status } = err as { message: string; body: unknown | null; status: StatusCodes };

			return ServiceResponse.failure(message, body, status);
		}
	}
}

export const authService = new AuthService();
