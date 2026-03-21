import { ConflictException, Injectable, InternalServerErrorException, type Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import type { ChangeAdminGroupDto } from './dto/change-admin-group.dto';
import type { AdminUserData } from './interfaces/admin.interface';
import { getAvatarURL } from './utils';

// Constants for table names to allow easy updates if the schema changes
const TABLES = {
	USERS: 'users',
	ADMIN_GROUPS: 'admin_groups'
};

@Injectable()
export class AdminsService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly logger: Logger
	) {}

	async getAdminList(): Promise<AdminUserData[]> {
		try {
			// Query builder to get users joined with their secondary groups
			const rawList = await this.dataSource
				.createQueryBuilder()
				.select([
					'u.id AS user_id',
					'u.avatar AS user_avatar',
					'u.username AS username',
					'u.main_group AS main_group',
					'ag.group_id AS secondary_group'
				])
				.from(TABLES.USERS, 'u')
				.leftJoin(TABLES.ADMIN_GROUPS, 'ag', 'ag.user_id = u.id')
				// Depending on domain logic, you might want to filter only users with certain main_groups or who have records in admin_groups
				// .where('u.main_group > :minGroup', { minGroup: 0 })
				.getRawMany();

			// Optimized O(N) grouping using a Map
			const adminsMap = new Map<number, AdminUserData>();

			for (const curr of rawList) {
				let admin = adminsMap.get(curr.user_id);

				if (!admin) {
					admin = {
						user_id: curr.user_id,
						username: curr.username,
						main_group: curr.main_group,
						user_avatar: getAvatarURL(curr.user_avatar),
						permissions: new Set(
							curr.main_group !== curr.secondary_group
								&& curr.secondary_group !== undefined
								&& curr.secondary_group !== null
								? [curr.secondary_group]
								: []
						)
					};
					adminsMap.set(curr.user_id, admin);
				} else if (curr.secondary_group !== undefined && curr.secondary_group !== null) {
					(admin.permissions as Set<number>).add(curr.secondary_group);
				}
			}

			// Convert Map values to array and Set to array
			return Array.from(adminsMap.values()).map((admin) => {
				admin.permissions = Array.from(admin.permissions as Set<number>);
				return admin;
			});
		} catch (error) {
			this.logger.error(`Failed admin list query: ${(error as Error).message}`, (error as Error).stack);
			throw new InternalServerErrorException('Failed admin list query');
		}
	}

	async addSecondaryGroup(dto: ChangeAdminGroupDto): Promise<void> {
		try {
			await this.dataSource
				.createQueryBuilder()
				.insert()
				.into(TABLES.ADMIN_GROUPS)
				.values({ user_id: dto.id, group_id: dto.group })
				.execute();
		} catch (error) {
			this.handleDatabaseError(error, 'add secondary group');
		}
	}

	async deleteSecondaryGroup(dto: ChangeAdminGroupDto): Promise<void> {
		try {
			await this.dataSource
				.createQueryBuilder()
				.delete()
				.from(TABLES.ADMIN_GROUPS)
				.where('user_id = :userId', { userId: dto.id })
				.andWhere('group_id = :groupId', { groupId: dto.group })
				.execute();
		} catch (error) {
			this.handleDatabaseError(error, 'delete secondary group');
		}
	}

	async changeMainGroup(dto: ChangeAdminGroupDto): Promise<void> {
		try {
			await this.dataSource
				.createQueryBuilder()
				.update(TABLES.USERS)
				.set({ main_group: dto.group })
				.where('id = :userId', { userId: dto.id })
				.execute();
		} catch (error) {
			this.handleDatabaseError(error, 'change main group');
		}
	}

	async changeSecondaryGroup(dto: ChangeAdminGroupDto): Promise<void> {
		try {
			// This updates all secondary groups for a user to the new group.
			// If the logic meant to update a specific group to another, we'd need the old group id.
			// Assuming it sets the primary secondary group based on the old Express query:
			// CHANGE_SECONDARY_GROUP: 'UPDATE admin_groups SET group_id = ? WHERE user_id = ?'
			await this.dataSource
				.createQueryBuilder()
				.update(TABLES.ADMIN_GROUPS)
				.set({ group_id: dto.group })
				.where('user_id = :userId', { userId: dto.id })
				.execute();
		} catch (error) {
			this.handleDatabaseError(error, 'change secondary group');
		}
	}

	/**
	 * Centralized error handler to map DB errors to HTTP exceptions
	 */
	private handleDatabaseError(error: unknown, action: string): never {
		const err = error as Error & { code?: string; errno?: number };
		const MYSQL_ER_DUP_ENTRY_CODE = 1062;

		// Map MySQL duplicate entry error (ER_DUP_ENTRY / 1062) or similar conflicts
		if (err.code === 'ER_DUP_ENTRY' || err.code === '23505' || err.errno === MYSQL_ER_DUP_ENTRY_CODE) {
			this.logger.warn(`Conflict during ${action}: ${err.message}`);
			throw new ConflictException(`Data conflict during ${action}`);
		}

		this.logger.error(`Failed to ${action}: ${err.message}`, err.stack);
		throw new InternalServerErrorException(`Failed to ${action}`);
	}
}
