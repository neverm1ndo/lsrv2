import { z } from 'zod';

export const HashParamSchema = z.object({
	hash: z.string().uuid({ message: 'Hash must be a valid UUID' })
});

export type HashParamDto = z.infer<typeof HashParamSchema>;
