import z from "zod";

export type FileStatQuery = z.infer<typeof FileStatRequestScheme>;

export const FileStatRequestScheme = z.object({
	path: z.string()
});

export const GetFileStatRequestScheme = z.object({
	query: FileStatRequestScheme
});
