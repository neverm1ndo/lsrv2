import {
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	type Logger,
	Param,
	Post,
	Req,
	Res,
	StreamableFile,
	UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { Workgroup } from '@lsrv/api/user';
import { CurrentUser } from '@lsrv/common/decorators';
import { ZodValidationPipe } from '@lsrv/common/validation';

import type { BackupService } from './backup.service';
import { type HashParamDto, HashParamSchema } from './dto/hash-param.dto';
import type { BackupInitiator } from './interfaces/backup-initiator.interface';

@Controller('backups')
@UseGuards(AuthGuard('jwt'))
export class BackupController {
	constructor(
		private readonly backupService: BackupService,
		private readonly logger: Logger
	) {}

	private getWorkgroupName(group?: number): string {
		return Workgroup[group as number] || 'no_group';
	}

	@Get('list')
	async getBackups(@Req() req: Request, @CurrentUser() user: BackupInitiator) {
		this.logger.log(
			`[BACKUPS][GET] BACKUPS_LIST (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)}`
		);
		try {
			return await this.backupService.findAll();
		} catch (error) {
			this.logger.error(
				`[BACKUPS][GET] BACKUPS_LIST_FAIL (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)}`,
				(error as Error).stack
			);
			throw error;
		}
	}

	@Get('backup/:hash')
	async downloadBackup(
		@Req() req: Request,
		@CurrentUser() user: BackupInitiator,
		@Param(new ZodValidationPipe(HashParamSchema)) params: HashParamDto,
		@Res({ passthrough: true }) res: Response
	) {
		this.logger.log(
			`[BACKUPS][GET] BACKUP_FILE (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash}`
		);
		try {
			const stream = await this.backupService.getBackupFile(params.hash);

			res.set({
				'Content-Disposition': `attachment; filename="${params.hash}"`,
				'Content-Type': 'application/octet-stream'
			});

			return new StreamableFile(stream);
		} catch (error) {
			this.logger.error(
				`[BACKUPS][GET] BACKUP_FILE_FAIL (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash} ::${(error as Error).message}::`
			);
			throw error;
		}
	}

	@Post('restore/:hash')
	@HttpCode(HttpStatus.OK)
	async restoreBackup(
		@Req() req: Request,
		@CurrentUser() user: BackupInitiator,
		@Param(new ZodValidationPipe(HashParamSchema)) params: HashParamDto
	) {
		this.logger.log(
			`[BACKUPS][POST] BACKUP_FILE_RESTORE (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash}`
		);
		try {
			await this.backupService.restore(params.hash);
			return [];
		} catch (error) {
			this.logger.error(
				`[BACKUPS][POST] BACKUP_FILE_RESTORE_FAIL (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash} ::${(error as Error).message}::`
			);
			throw error;
		}
	}

	@Delete('backup/:hash')
	@HttpCode(HttpStatus.OK)
	async deleteBackup(
		@Req() req: Request,
		@CurrentUser() user: BackupInitiator,
		@Param(new ZodValidationPipe(HashParamSchema)) params: HashParamDto
	) {
		this.logger.log(
			`[BACKUPS][DELETE] BACKUP_FILE_DELETE (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash}`
		);
		try {
			await this.backupService.remove(params.hash);
			return [];
		} catch (error) {
			this.logger.error(
				`[BACKUPS][DELETE] BACKUP_FILE_DELETE_FAIL (${req.socket.remoteAddress}) ${user.username} ${this.getWorkgroupName(user.main_group)} ${params.hash} ::${(error as Error).message}::`
			);
			throw error;
		}
	}
}
