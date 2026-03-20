import { stat } from 'node:fs/promises';
import { basename, join } from 'node:path';

import {
	Body,
	Controller,
	Get,
	InternalServerErrorException,
	NotFoundException,
	Patch,
	Query,
	Res,
	type StreamableFile,
	UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import { Workgroup } from '@lsrv/api/user';
import { CurrentUser } from '@lsrv/common/decorators';
import { env } from '@lsrv/common/environment';
import { ZodValidationPipe } from '@lsrv/common/validation';
import { mime } from '@lsrv/shared/file-format';

import type { ConfiguratorService } from './configurator.service';
import { FileRequestSchema, type FileStatQuery, type PatchFileDto, PatchFileSchema } from './dto/file.dto';

interface ICurrentUser {
	main_group?: number;
}

@Controller('lars/configurator')
@UseGuards(AuthGuard('jwt'))
export class ConfiguratorController {
	constructor(private readonly configuratorService: ConfiguratorService) {}

	private getRootDir(user: ICurrentUser): string {
		return user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
	}

	@Get('ft')
	async getFileThree(
		@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery,
		@CurrentUser() user: ICurrentUser
	) {
		const rootDir = this.getRootDir(user);
		const fullPath = join(rootDir, query.path || '');

		return this.configuratorService.getFileTree({
			rootDir: fullPath,
			ignore: ['omp-server', 'samp03srv', 'cr03srv', 'announcr', 'samp-npc']
		});
	}

	@Get('fs')
	async getFileStat(
		@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery,
		@CurrentUser() user: ICurrentUser
	) {
		const rootDir = this.getRootDir(user);
		const fullPath = join(rootDir, query.path || '');

		return this.configuratorService.getFileStat(fullPath);
	}

	@Get('file')
	async getFile(
		@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery,
		@CurrentUser() user: ICurrentUser,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const rootDir = this.getRootDir(user);
		const fullPath = join(rootDir, query.path || '');
		const filename = basename(fullPath);

		try {
			const stats = await stat(fullPath);
			const fileStream = await this.configuratorService.getFileStream(fullPath);

			res.set({
				'Content-Length': String(stats.size),
				'Content-Disposition': `inline; filename="${filename}"`,
				'Content-Type': mime(filename)
			});

			return fileStream;
		} catch (err) {
			if (err instanceof NotFoundException) {
				throw err;
			}
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new NotFoundException();
			}
			throw new InternalServerErrorException();
		}
	}

	@Patch('file')
	async patchFile(
		@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery,
		@Body(new ZodValidationPipe(PatchFileSchema)) body: PatchFileDto,
		@CurrentUser() user: ICurrentUser
	) {
		const rootDir = this.getRootDir(user);
		const fullPath = join(rootDir, query.path || '', body.path || '');

		return this.configuratorService.patchFile({ path: fullPath, text: body.text });
	}
}
