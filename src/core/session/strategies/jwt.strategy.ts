import { ExtractJwt, Strategy as JWTStrategy, type StrategyOptions as JWTStrategyOptions } from "passport-jwt";
import z, { ZodError } from "zod";

import { isUserInWorkGroup, USER_QUERY, type User, UserSchema, UserWithPermissionsSchema } from "@lsrv/api/user";
import { env } from "@lsrv/common/environment";
import { DB_POOL } from "@lsrv/core/db";

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;

const JwtUserPayloadSchema = UserWithPermissionsSchema.pick({
	id: true,
	username: true,
	main_group: true,
	permissions: true
});

if (!env.LSRV_SECRET) {
	throw new Error("Environment variable LSRV_SECRET is not defined - JWT strategy cannot be initialized");
}

const jwtStrategyOptions: JWTStrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: env.LSRV_SECRET
};

export const jwtStrategy = new JWTStrategy(jwtStrategyOptions, (payload: JwtUserPayload | undefined, done) => {
	void (async () => {
		try {
			if (!payload || typeof payload.id === "undefined") {
				return void done(null, false, { message: "Invalid token payload" });
			}

			const { id } = payload;

			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);

			const userWithGroups: User[] = z.array(UserSchema).parse(userQueryResult);

			if (!userWithGroups.length) {
				return void done(null, false, { message: "User not found" });
			}

			const [user] = userWithGroups;
			const { username, main_group, avatar, permissions } = user;

			if (!isUserInWorkGroup(user)) {
				return void done(null, false, { message: "User is not in workgroup" });
			}

			return void done(null, {
				id,
				username,
				main_group,
				permissions,
				avatar
			});
		} catch (error) {
			if (error instanceof ZodError) {
				console.error("JWT user parsing error:", error);
				return void done(null, false, { message: "Malformed user data" });
			}
			return void done(error);
		}
	})();
});
