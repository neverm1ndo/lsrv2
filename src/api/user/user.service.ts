import { StatusCodes } from "http-status-codes";
import z from "zod";

import { DB_POOL } from "@lsrv/core/db";
import { logger } from "@lsrv/logger";
import { ServiceResponse } from "@lsrv/models/response";

import { UserSchema, type UserWithPermissions } from "./models/user.model";
import { USER_QUERY } from "./sql/user.query";

export class UserService {
	// Retrieves a single user by their ID
	async findById(id: number): Promise<ServiceResponse<UserWithPermissions | null>> {
		try {
			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);

			if (!userQueryResult) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}

			const userWithGroups = z.array(UserSchema).parse(userQueryResult);

			const permissions: number[] = [...new Set(userWithGroups.map(({ secondary_group }) => secondary_group))];

			const [user] = userWithGroups;

			return ServiceResponse.success<UserWithPermissions>("User found", { ...user, permissions });
		} catch (ex) {
			const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
			logger.error(errorMessage);

			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}

export const userService = new UserService();
