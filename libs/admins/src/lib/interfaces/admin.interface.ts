export interface AdminUserData {
	user_id: number;
	user_avatar?: string;
	username: string;
	main_group: number;
	secondary_group?: number;
	permissions?: Set<number> | number[];
}
