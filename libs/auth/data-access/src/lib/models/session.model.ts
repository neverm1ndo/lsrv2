import { z } from 'zod';

import { UserWithPermissionsSchema } from '@lsrv/api/user';

export type UserSession = z.infer<typeof UserSessionSchema>;

export const UserSessionSchema = UserWithPermissionsSchema.omit({
  password: true,
  email: true,
  secondary_group: true,
}).extend({
  token: z.optional(z.string()),
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends UserSession {}
  }
}
