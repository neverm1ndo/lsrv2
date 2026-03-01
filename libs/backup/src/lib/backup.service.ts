import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip, type Gunzip, type Gzip } from 'node:zlib';

import { Injectable, InternalServerErrorException, Logger, NotFoundException, type OnModuleInit } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import iconv from 'iconv-lite';
import { In, LessThan, type Repository } from 'typeorm';

import { mime as getMimeType } from '@lsrv/shared/file-format';

import { BackupEntity } from './entities/backup.entity';
import type { BackupAction } from './enums/backup-action.enum';
import type { BackupInitiator } from './interfaces/backup-initiator.interface';

@Injectable()
export class BackupService implements OnModuleInit {
	private readonly logger = new Logger(BackupService.name);
	private readonly lifetime: number;
	private readonly compressionLevel: number;
	private readonly sizeThreshold: number;
	private readonly backupsPath: string;

	constructor(
		@InjectRepository(BackupEntity)
		private readonly backupRepository: Repository<BackupEntity>,
		private readonly configService: ConfigService
	) {
		this.lifetime = Number(this.configService.get<string>('BACKUP_LIFETIME', '1209600000')); // Default 2 weeks
		this.compressionLevel = Number(this.configService.get<string>('BACKUP_COMPRESSION_LEVEL', '1'));
		this.sizeThreshold = Number(this.configService.get<string>('BACKUP_SIZE_THRESHOLD', '1048576')); // Default 1MB
		this.backupsPath = this.configService.get<string>('BACKUPS_PATH', './backups');
	}

	async onModuleInit() {
		try {
			await mkdir(this.backupsPath, { recursive: true });
			this.logger.log(`Backup directory initialized at ${this.backupsPath}`);
		} catch (error) {
			this.logger.error(`Failed to create backup directory: ${(error as Error).message}`);
		}
	}

	// Fallback utility functions previously from @shared
	private getAvatarURL(avatar?: string): string {
		return avatar ? `/avatars/${avatar}` : '/avatars/default.png';
	}

	private isBinary(mimeType: string): boolean {
		// Simple heuristic
		return !mimeType.startsWith('text/') && !mimeType.includes('json') && !mimeType.includes('xml');
	}

	async backup(path: string, user: BackupInitiator, action: BackupAction): Promise<BackupEntity> {
		const ext = extname(path);
		const filename = basename(path, ext);
		const unix = Date.now();
		const hash = randomUUID();
		const mime = getMimeType(path);

		const creationDate = new Date(unix);
		const expirationDate = new Date(unix + this.lifetime);
		const avatar = this.getAvatarURL(user.user_avatar);

		const backupEntity = this.backupRepository.create({
			hash,
			unix,
			date: creationDate,
			expires: expirationDate,
			action,
			user: {
				nickname: user.username,
				group_id: user.main_group,
				avatar
			},
			file: {
				path,
				name: filename + ext,
				mime,
				binary: this.isBinary(mime)
			}
		});

		try {
			const { size } = await stat(path);
			backupEntity.file.bytes = size;

			const destinationPath = join(this.backupsPath, hash);
			const isNeedToCompress = size >= this.sizeThreshold;

			await this.prepareBackupFile(
				path,
				destinationPath,
				isNeedToCompress ? createGzip({ level: this.compressionLevel }) : undefined
			);

			if (isNeedToCompress) {
				const destStat = await stat(destinationPath);
				backupEntity.file.compressed = destStat.size;
			}

			return await this.backupRepository.save(backupEntity);
		} catch (error) {
			const err = error as Error & { syscall?: string; code?: string };
			if (err.syscall === 'stat' || err.code === 'ENOENT') {
				this.logger.warn(`BACKUPER_SKIP_NEW_FILE (File not found): ${path}`);
				throw new NotFoundException(`File to backup not found: ${path}`);
			}

			this.logger.error(`Error during backup: ${err.message}`, err.stack);
			throw new InternalServerErrorException('Failed to create backup');
		}
	}

	async restore(hash: string): Promise<BackupEntity> {
		const backup = await this.backupRepository.findOne({ where: { hash } });
		if (!backup) {
			throw new NotFoundException('BACKUP_IS_NOT_EXISTS');
		}

		const backupFilePath = join(this.backupsPath, backup.hash);

		try {
			await this.prepareBackupFile(
				backupFilePath,
				backup.file.path,
				backup.file.compressed ? createGunzip({ level: this.compressionLevel }) : undefined
			);
		} catch (error) {
			const err = error as Error & { syscall?: string; code?: string };
			this.logger.error(`Error during restore: ${err.message}`, err.stack);
			throw new InternalServerErrorException('Failed to restore backup');
		}

		return backup;
	}

	async removeExpired(): Promise<void> {
		const now = new Date();
		const expiredBackups = await this.backupRepository.find({
			where: { expires: LessThan(now) }
		});

		if (expiredBackups.length === 0) {
			return;
		}

		const successfulHashes: string[] = [];
		const chunkSize = 50;

		// Delete files in chunks to avoid EMFILE and I/O overload
		for (let i = 0; i < expiredBackups.length; i += chunkSize) {
			const chunk = expiredBackups.slice(i, i + chunkSize);

			await Promise.all(
				chunk.map(async (note) => {
					try {
						const filePath = join(this.backupsPath, note.hash);
						await unlink(filePath);
						successfulHashes.push(note.hash);
					} catch (error) {
						const err = error as Error & { syscall?: string; code?: string };
						if (err.code === 'ENOENT') {
							// If file is already gone, we can safely consider it a success for DB cleanup
							successfulHashes.push(note.hash);
						} else {
							this.logger.warn(`Failed to delete expired backup file ${note.hash}: ${err.message}`);
						}
					}
				})
			);
		}

		// Remove from DB only for successfully deleted files
		if (successfulHashes.length > 0) {
			const dbChunkSize = 500;
			for (let i = 0; i < successfulHashes.length; i += dbChunkSize) {
				const hashChunk = successfulHashes.slice(i, i + dbChunkSize);
				await this.backupRepository.delete({ hash: In(hashChunk) });
			}
		}
		this.logger.log(`Removed ${successfulHashes.length} expired backups`);
	}

	async remove(hash: string): Promise<void> {
		const backup = await this.backupRepository.findOne({ where: { hash } });
		if (!backup) return;

		try {
			const filepath = join(this.backupsPath, hash);
			await unlink(filepath);
		} catch (error) {
			const err = error as Error & { syscall?: string; code?: string };
			if (err.code !== 'ENOENT') {
				this.logger.error(`Failed to delete backup file: ${err.message}`, err.stack);
			}
		}

		await this.backupRepository.delete({ hash });
	}

	async getBackupFile(hash: string): Promise<NodeJS.ReadableStream> {
		const backup = await this.backupRepository.findOne({ where: { hash } });
		if (!backup) {
			throw new NotFoundException('BACKUP_IS_NOT_EXISTS');
		}

		const filepath = join(this.backupsPath, hash);
		try {
			// Проверяем существование файла
			await stat(filepath);

			let stream: NodeJS.ReadableStream = createReadStream(filepath);

			if (backup.file.compressed) {
				const gunzip = createGunzip();
				stream = stream.pipe(gunzip);
			}

			// Если файл текстовый, применяем трансформацию ANSI -> UTF8 на лету
			if (!backup.file.binary) {
				stream = stream.pipe(iconv.decodeStream('win1251')).pipe(iconv.encodeStream('utf8'));
			}

			return stream;
		} catch (error) {
			const err = error as Error & { syscall?: string; code?: string };
			this.logger.error(`Failed to read backup file: ${err.message}`, err.stack);
			throw new InternalServerErrorException('Failed to read backup file');
		}
	}

	private async prepareBackupFile(source: string, destination: string, transform?: Gzip | Gunzip): Promise<void> {
		const readStream = createReadStream(source);
		const writeStream = createWriteStream(destination);

		if (transform) {
			await pipeline(readStream, transform, writeStream);
		} else {
			await pipeline(readStream, writeStream);
		}
	}
}
