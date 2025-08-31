import { z } from "zod";

import { UserWithPermissionsSchema } from "@lsrv/api/user";

export type UserSession = z.infer<typeof UserSessionSchema>;

export const UserSessionSchema = UserWithPermissionsSchema.omit({
	password: true,
	email: true,
	secondary_group: true,
}).extend({
	token: z.optional(z.jwt()),
});

declare global {
	namespace Express {
		interface User extends UserSession {}
	}
}
