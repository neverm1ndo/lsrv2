import md5 from "md5";
import {
	Strategy as LocalStrategy,
	type IStrategyOptions as LocalStrategyOptions,
	type IVerifyOptions as VerifyOptions,
} from "passport-local";
import z, { ZodError } from "zod";

import { isUserInWorkGroup, USER_QUERY_BY_EMAIL, UserSchema } from "@lsrv/api/user";
import { DB_POOL } from "@lsrv/core/db";

const PWD_OFFSET = 32;

const checkPassword = (pass?: string, hash?: string): boolean => {
	if (!pass || !hash) return false;

	const salt = hash.slice(0, hash.length - PWD_OFFSET);
	const realPassword = hash.slice(hash.length - PWD_OFFSET, hash.length);
	const password = md5(salt + pass);

	if (password === realPassword) {
		return true;
	}

	return false;
};

const localStrategyOptions: LocalStrategyOptions = {
	usernameField: "email",
	passwordField: "password",
};

export const localStrategy: LocalStrategy = new LocalStrategy(
	localStrategyOptions,
	(
		email: string,
		password: string,
		done: (error: unknown, user?: Express.User | false, options?: VerifyOptions) => void,
	) => {
		void (async () => {
			try {
				const [userQueryResult] = await DB_POOL.query(USER_QUERY_BY_EMAIL, [email]);

				const userWithGroups = z.array(UserSchema).parse(userQueryResult);

				if (!userWithGroups.length) {
					return void done(null, false, { message: "User not found" });
				}

				const permissions: number[] = [...new Set(userWithGroups.map(({ secondary_group }) => secondary_group))];

                const [user] = userWithGroups;
				const { id, main_group, username, password: hash } = user;
                

				if (!checkPassword(password, hash)) {
					return void done(null, false, { message: "Wrong password" });
				}

				if (!isUserInWorkGroup(user)) {
					return void done(null, false, { message: "User is not in workgroup" });
				}

				return void done(
                    null,
                    {
                        id,
                        username,
                        main_group,
                        permissions
                    }, 
                    { message: "Success" }
                );
			} catch (error) {
                const err = {
                    message: ''
                };

                if (error instanceof ZodError) {
                    console.error(error);
                    err.message = error.issues.map(({ message }) => message).join('. ');
                }

				return void done(err);
			}
		})();
	},
);
