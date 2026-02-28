import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import md5 from 'md5';
import { Strategy } from 'passport-local';
import { ZodError, z } from 'zod';

import { isUserInWorkGroup, USER_QUERY_BY_EMAIL, UserSchema } from '@lsrv/api/user';
import { DB_POOL } from '@lsrv/core/db';

const PWD_OFFSET = 32;

const checkPassword = (pass?: string, hash?: string): boolean => {
	if (!pass || typeof pass !== 'string') return false;
	if (!hash || typeof hash !== 'string' || hash.length <= PWD_OFFSET) return false;

	const salt = hash.slice(0, hash.length - PWD_OFFSET);
	const realPassword = hash.slice(hash.length - PWD_OFFSET);
	const password = md5(salt + pass);

	return password === realPassword;
};

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({ usernameField: 'email', passwordField: 'password' });
	}

	async validate(email: string, password: string): Promise<any> {
		try {
			if (!email || !password) {
				throw new UnauthorizedException('Missing credentials');
			}

			const [userQueryResult] = await DB_POOL.query(USER_QUERY_BY_EMAIL, [email]);
			const userWithGroups = z.array(UserSchema).parse(userQueryResult);

			if (!userWithGroups.length) {
				throw new UnauthorizedException('User not found');
			}

			const [user] = userWithGroups;
			const { id, main_group, username, password: storedHash, permissions, avatar } = user;

			if (!checkPassword(password, storedHash)) {
				throw new UnauthorizedException('Wrong password');
			}

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
				throw new UnauthorizedException(error.issues.map(({ message }) => message).join('. '));
			}
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			throw new UnauthorizedException('Authentication failed');
		}
	}
}
