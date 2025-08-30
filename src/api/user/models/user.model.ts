import { z } from "zod";

export type User = z.infer<typeof UserSchema>;

export const UserSchema = z.object({
	id: z.number(),
	username: z.string(),
	password: z.string(),
	email: z.email(),
	avatar: z.nullable(z.url()),
	main_group: z.number(),
	sercondary_group: z.number(),
	permissions: z.array(z.number()),
});

export interface AdminUserData {
	user_id: number;
	username: string;
	user_avatar: string;
	main_group: number;
	secondary_group?: number;
	permissions: number[] | Set<number>;
	user_email?: string;
}
