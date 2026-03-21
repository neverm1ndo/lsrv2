import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { Workgroup } from '@lsrv/api/user';

@Injectable()
export class DeveloperGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const user = request.user;

		if (user?.main_group !== Workgroup.DEV) {
			throw new ForbiddenException('Developer access required');
		}

		return true;
	}
}
