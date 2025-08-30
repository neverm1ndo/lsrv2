import { ExtractJwt, Strategy as JWTStrategy, type StrategyOptions as JWTStrategyOptions } from "passport-jwt";
import z from "zod";

import { USER_QUERY, type User, UserSchema, Workgroup } from "@lsrv/api/user";
import { lsrv2 } from "@lsrv/core";
import { DB_POOL } from "@lsrv/core/db";

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;

const JwtUserPayloadSchema = z.object({
	id: z.number(),
	username: z.string(),
	main_group: z.number(),
	permissions: z.array(z.number()),
});

const isUserInWorkGroup = (user?: User): boolean => {
	if (!user) return false;

	const isInWorkGroup = Boolean<string | undefined>(Workgroup[user.main_group]);

	return isInWorkGroup;
};

const jwtStrategyOptions: JWTStrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: lsrv2.get("secret"),
};

export const jwtStrategy = new JWTStrategy(jwtStrategyOptions, ({ id }: JwtUserPayload, done) => {
	void (async () => {
		try {
			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);

			const userWithGroups = z.array(UserSchema).parse(userQueryResult);

			const userPermissions: number[] = [...new Set(userWithGroups.map(({ sercondary_group }) => sercondary_group))];

			const [user] = userWithGroups;
			user.permissions = userPermissions;

			if (!isUserInWorkGroup(user)) {
				return void done(null, false, { message: "User is not in workgroup" });
			}

			return void done(null, user);
		} catch (error) {
			return void done(error);
		}
	})();
});
