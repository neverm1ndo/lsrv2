import { StatusCodes } from "http-status-codes";
import z from "zod";

import { DB_POOL } from "@lsrv/core/db";
import { logger } from "@lsrv/logger";
import { ServiceResponse } from "@lsrv/models/response";

import { type User, UserSchema } from "./models/user.model";
import { USER_QUERY } from "./sql/user.query";

export class UserService {
	// Retrieves all users from the database
	// async findAll(): Promise<ServiceResponse<User[] | null>> {
	// 	try {
	// 		const users = await this.userRepository.findAllAsync();
	// 		if (!users || users.length === 0) {
	// 			return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
	// 		}
	// 		return ServiceResponse.success<User[]>("Users found", users);
	// 	} catch (ex) {
	// 		const errorMessage = `Error finding all users: $${(ex as Error).message}`;
	// 		logger.error(errorMessage);
	// 		return ServiceResponse.failure(
	// 			"An error occurred while retrieving users.",
	// 			null,
	// 			StatusCodes.INTERNAL_SERVER_ERROR,
	// 		);
	// 	}
	// }

	// Retrieves a single user by their ID
	async findById(id: number): Promise<ServiceResponse<User | null>> {
		try {
			const [userQueryResult] = await DB_POOL.query(USER_QUERY, [id]);

			if (!userQueryResult) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}

			const userWithGroups = z.array(UserSchema).parse(userQueryResult);

			const userPermissions: number[] = [...new Set(userWithGroups.map(({ sercondary_group }) => sercondary_group))];

			const [user] = userWithGroups;
			user.permissions = userPermissions;

			return ServiceResponse.success<User>("User found", user);
		} catch (ex) {
			const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
			logger.error(errorMessage);

			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}
}

export const userService = new UserService();
