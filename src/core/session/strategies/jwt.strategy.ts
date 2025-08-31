import { ExtractJwt, Strategy as JWTStrategy, type StrategyOptions as JWTStrategyOptions } from "passport-jwt";
import z from "zod";

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

const jwtStrategyOptions: JWTStrategyOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: env.LSRV_SECRET,
};

export const jwtStrategy = new JWTStrategy(jwtStrategyOptions, ({ id }: JwtUserPayload, done) => {
	void (async () => {
		try {
			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);
			const userWithGroups: User[] = z.array(UserSchema).parse(userQueryResult);

			const [user] = userWithGroups;
			const { username, main_group, avatar } = user;

			const permissions = [...new Set(userWithGroups.map(({ secondary_group }) => secondary_group))];

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
			return void done(error);
		}
	})();
});
