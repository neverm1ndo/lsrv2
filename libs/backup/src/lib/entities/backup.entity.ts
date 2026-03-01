import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

import { BackupAction } from '../enums/backup-action.enum';

export interface BackupUser {
	nickname: string;
	group_id: number;
	avatar: string;
}

export interface BackupFile {
	path: string;
	name: string;
	mime: string;
	binary: boolean;
	bytes?: number;
	compressed?: number;
}

@Entity('backups')
export class BackupEntity {
	@PrimaryColumn({ type: 'uuid' })
	hash: string;

	@Column({ type: 'bigint' })
	unix: number;

	@CreateDateColumn()
	date: Date;

	@Column({ type: 'datetime' })
	expires: Date;

	@Column({ type: 'int', enum: BackupAction })
	action: BackupAction;

	@Column({ type: 'json' })
	user: BackupUser;

	@Column({ type: 'json' })
	file: BackupFile;
}
