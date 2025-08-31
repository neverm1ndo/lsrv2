import type { User } from "./models/user.model";

export enum Workgroup {
	CHALLENGER = 9,
	DEV,
	ADMIN,
	MAPPER,
	CFR,
	BACKUPER,
}

export type WorkgroupName = keyof typeof Workgroup;

export const isUserInWorkGroup = (user?: User): boolean => {
	if (!user) return false;

	const isInWorkGroup = Boolean<string | undefined>(Workgroup[user.main_group]);

	return isInWorkGroup;
};

export const getWorkgorupName = <T extends { main_group: Workgroup | number }>(user?: T): WorkgroupName | undefined => {
	 if (!user) return;

	return Workgroup[user.main_group] as WorkgroupName | undefined;
}
