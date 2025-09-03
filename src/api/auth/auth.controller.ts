import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { logger } from "@lsrv/logger";

import { authService } from "./auth.service";

class AuthController {
	public session: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await authService.session(req);

		res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	};

	public auth: RequestHandler = async (req: Request, res: Response) => {
		res.status(StatusCodes.OK).send(req.user);
	};

	public logout: RequestHandler = async (req: Request, res: Response) => {
		req.session.destroy((err) => {
			if (err) {
				return logger.error(err, "Session destruction error");
			}
		});

		res.status(StatusCodes.OK).send("bye");
	};
}

export const authController = new AuthController();
