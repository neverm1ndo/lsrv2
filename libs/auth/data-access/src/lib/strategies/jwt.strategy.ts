import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { z } from 'zod';

import { isUserInWorkGroup, type User, UserSchema, UserWithPermissionsSchema } from '@lsrv/api/user';
import { env } from '@lsrv/common/environment';
import { DB_POOL } from '@lsrv/core/db';

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>;

const JwtUserPayloadSchema = UserWithPermissionsSchema.pick({
	id: true,
	username: true,
	main_group: true,
	permissions: true
});

const JWT_USER_QUERY = `
    SELECT
        ug.user_id AS id,
        u.username,
        u.user_avatar AS avatar,
        u.group_id AS main_group,
        GROUP_CONCAT(DISTINCT ug.group_id ORDER BY ug.group_id SEPARATOR ',') AS permissions,
        u.user_email AS email
    FROM phpbb_user_group AS ug
    JOIN phpbb_users AS u
        ON u.user_id = ug.user_id
    WHERE ug.user_id = ?
        AND ug.group_id BETWEEN 9 AND 14
    GROUP BY
        u.user_id,
        u.username,
        u.user_avatar,
        u.group_id,
        u.user_email;
`;

const SafeUserSchema = UserSchema.omit({ password: true });

if (!env.LSRV_SECRET) {
	throw new Error('Environment variable LSRV_SECRET is not defined - JWT strategy cannot be initialized');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: env.LSRV_SECRET,
			algorithms: ['HS256']
		});
	}

	async validate(
		payload: JwtUserPayload
	): Promise<{ id: number; username: string; main_group: number; permissions: number[]; avatar: string | null }> {
		try {
			if (!payload || typeof payload.id === 'undefined') {
				throw new UnauthorizedException();
			}

			const { id } = payload;
			const [userQueryResult] = await DB_POOL.query(JWT_USER_QUERY, [id]);
			const userWithGroups = z.array(SafeUserSchema).parse(userQueryResult);

			if (!userWithGroups.length) {
				throw new UnauthorizedException();
			}

			const [user] = userWithGroups;

			if (!isUserInWorkGroup(user as User)) {
				throw new UnauthorizedException();
			}

			const { username, main_group, avatar, permissions } = user as User;

			return {
				id,
				username,
				main_group,
				permissions,
				avatar
			};
		} catch (_error) {
			throw new UnauthorizedException();
		}
	}
}
