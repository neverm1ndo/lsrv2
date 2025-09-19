import z from "zod";

export type FileStatQuery = z.infer<typeof FileRequestScheme>;

export const FileRequestScheme = z.object({
	path: z.string()
});

export const GetFileRequestScheme = z.object({
	query: FileRequestScheme
});
