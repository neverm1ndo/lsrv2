import z from "zod";

const DEFAULT_LIMIT = 100;

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

/** Schema for search query that got from client */
export const SearchQuerySchema = z.object({
	q: z.string().optional(),
	filter: z
		.string()
		.transform(async (filter) => filter.split(","))
		.default([]),
	limit: z.coerce.number().int().positive().default(DEFAULT_LIMIT),
	last: z.string().optional(),
	from_date: z.coerce.number().optional(),
	to_date: z.coerce.number().optional()
});
