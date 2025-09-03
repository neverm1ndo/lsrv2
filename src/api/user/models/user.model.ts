import { z } from "zod";

import { Validation } from "@lsrv/common/validation";

export type User = z.infer<typeof UserSchema>;
export type UserWithPermissions = z.infer<typeof UserWithPermissionsSchema>;

export const UserSchema = z.object({
	id: z.number(),
	username: z.string(),
	password: z.string(),
	email: z.email(),
	avatar: z.nullable(z.string()),
	main_group: z.number(),
	permissions: z
		.string()
		.transform((value) => value.split(",").map(Number))
		.pipe(z.number().array())
});

export const UserWithPermissionsSchema = UserSchema.extend({
	permissions: z.array(z.number())
});

export const GetUserSchema = z.object({
	params: z.object({ id: Validation.id })
});
