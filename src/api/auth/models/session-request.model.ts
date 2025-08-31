import { z } from "zod";

export type SessionRequest = z.infer<typeof SessionRequestSchema>;

export const SessionRequestSchema = z.object({
    email: z.email(),
    password: z.string()
});

export const GetSessionRequesSchema = z.object({
    body: SessionRequestSchema
});
