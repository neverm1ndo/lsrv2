import { z } from 'zod';

export const ChangeAdminGroupSchema = z.object({
	id: z.number(),
	group: z.number(),
	username: z.string().optional()
});

export type ChangeAdminGroupDto = z.infer<typeof ChangeAdminGroupSchema>;
