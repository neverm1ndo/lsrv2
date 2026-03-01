import { z } from 'zod';

export const FileRequestSchema = z.object({
	path: z.string()
});

export type FileStatQuery = z.infer<typeof FileRequestSchema>;

export const PatchFileSchema = z.object({
	path: z.string(),
	text: z.string()
});

export type PatchFileDto = z.infer<typeof PatchFileSchema>;
