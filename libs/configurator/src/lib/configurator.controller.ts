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
	Req,
	Res,
	type StreamableFile,
	UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { Workgroup } from '@lsrv/api/user';
import { env } from '@lsrv/common/environment';
import { mime } from '@lsrv/common/mime';
import { ZodValidationPipe } from '@lsrv/common/validation';

import type { ConfiguratorService } from './configurator.service';
import { FileRequestSchema, type FileStatQuery, type PatchFileDto, PatchFileSchema } from './dto/file.dto';

@Controller('lars/configurator')
@UseGuards(AuthGuard('jwt'))
export class ConfiguratorController {
	constructor(private readonly configuratorService: ConfiguratorService) {}

	private getRootDir(req: Request): string {
		// biome-ignore lint/style/useNamingConvention: matching database model
		const user = (req as unknown as { user?: { main_group?: number } }).user;
		return user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
	}

	@Get('ft')
	async getFileThree(@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery, @Req() req: Request) {
		const rootDir = this.getRootDir(req);
		const fullPath = join(rootDir, query.path || '');

		return this.configuratorService.getFileTree({
			rootDir: fullPath,
			ignore: ['omp-server', 'samp03srv', 'cr03srv', 'announcr', 'samp-npc']
		});
	}

	@Get('fs')
	async getFileStat(@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery, @Req() req: Request) {
		const rootDir = this.getRootDir(req);
		const fullPath = join(rootDir, query.path || '');

		return this.configuratorService.getFileStat(fullPath);
	}

	@Get('file')
	async getFile(
		@Query(new ZodValidationPipe(FileRequestSchema)) query: FileStatQuery,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	): Promise<StreamableFile> {
		const rootDir = this.getRootDir(req);
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
		@Req() req: Request
	) {
		const rootDir = this.getRootDir(req);
		const fullPath = join(rootDir, query.path || '', body.path || '');

		return this.configuratorService.patchFile({ path: fullPath, text: body.text });
	}
}
