import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ZodError, z } from 'zod';

import { isUserInWorkGroup, USER_QUERY, type User, UserSchema, UserWithPermissionsSchema } from '@lsrv/api/user';
import { env } from '@lsrv/common/environment';
import { DB_POOL } from '@lsrv/core/db';

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;

const JwtUserPayloadSchema = UserWithPermissionsSchema.pick({
	id: true,
	username: true,
	main_group: true,
	permissions: true
});

if (!env.LSRV_SECRET) {
	throw new Error('Environment variable LSRV_SECRET is not defined - JWT strategy cannot be initialized');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: env.LSRV_SECRET
		});
	}

	async validate(payload: JwtUserPayload): Promise<any> {
		try {
			if (!payload || typeof payload.id === 'undefined') {
				throw new UnauthorizedException('Invalid token payload');
			}

			const { id } = payload;
			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);
			const userWithGroups: User[] = z.array(UserSchema).parse(userQueryResult);

			if (!userWithGroups.length) {
				throw new UnauthorizedException('User not found');
			}

			const [user] = userWithGroups;
			const { username, main_group, avatar, permissions } = user;

			if (!isUserInWorkGroup(user)) {
				throw new UnauthorizedException('User is not in workgroup');
			}

			return {
				id,
				username,
				main_group,
				permissions,
				avatar
			};
		} catch (error) {
			if (error instanceof ZodError) {
				throw new UnauthorizedException('Malformed user data');
			}
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Authentication error');
		}
	}
}
