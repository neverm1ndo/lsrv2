import { Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ZodValidationPipe } from '@lsrv/common/validation';

import type { AdminsService } from './admins.service';
import { type ChangeAdminGroupDto, ChangeAdminGroupSchema } from './dto/change-admin-group.dto';
import { DeveloperGuard } from './guards/developer.guard';

@Controller('admins')
@UseGuards(AuthGuard('jwt'))
export class AdminsController {
	constructor(private readonly adminsService: AdminsService) {}

	@Get('list')
	async getAdminList() {
		return this.adminsService.getAdminList();
	}

	@Post('add-group')
	@UseGuards(DeveloperGuard)
	async addSecondaryGroup(@Body(new ZodValidationPipe(ChangeAdminGroupSchema)) dto: ChangeAdminGroupDto) {
		await this.adminsService.addSecondaryGroup(dto);
		return { status: 'OK' };
	}

	@Delete('delete-group')
	@UseGuards(DeveloperGuard)
	async deleteSecondaryGroup(@Body(new ZodValidationPipe(ChangeAdminGroupSchema)) dto: ChangeAdminGroupDto) {
		await this.adminsService.deleteSecondaryGroup(dto);
		return { status: 'OK' };
	}

	@Patch('change-group')
	@UseGuards(DeveloperGuard)
	async changeMainGroup(@Body(new ZodValidationPipe(ChangeAdminGroupSchema)) dto: ChangeAdminGroupDto) {
		await this.adminsService.changeMainGroup(dto);
		return { status: 'OK' };
	}

	@Patch('change-secondary-group')
	@UseGuards(DeveloperGuard)
	async changeSecondaryGroup(@Body(new ZodValidationPipe(ChangeAdminGroupSchema)) dto: ChangeAdminGroupDto) {
		await this.adminsService.changeSecondaryGroup(dto);
		return { status: 'OK' };
	}
}
