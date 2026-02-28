import { Controller, Get, HttpStatus, Post, Request, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

import type { AuthService } from '@lsrv/auth/data-access';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UseGuards(AuthGuard('local'))
	@Post('session')
	async session(@Request() req: any, @Res() res: Response) {
		const serviceResponse = await this.authService.login(req.user);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	}

	@UseGuards(AuthGuard('jwt'))
	@Get()
	getProfile(@Request() req: any, @Res() res: Response) {
		return res.status(HttpStatus.OK).send(req.user);
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('logout')
	logout(@Request() req: any, @Res() res: Response) {
		if (req.session) {
			req.session.destroy((err: any) => {
				if (err) {
					console.error(err, 'Session destruction error');
				}
			});
		}

		return res.status(HttpStatus.OK).send('bye');
	}
}
