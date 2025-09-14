import { stat } from "node:fs/promises";
import { basename, join } from "node:path";

import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { env } from "@lsrv/common/environment";
import { mime } from "@lsrv/common/mime";
import type { Dummy } from "@lsrv/common/models";

import { Workgroup } from "../user";
import { configuratorService } from "./configurator.service";
import type { FileStatQuery } from "./models/file-stat";

export class ConfiguratorController {
	public async getFileThree(req: Request, res: Response) {
		const rootDir = req.user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
		const serviceResponse = await configuratorService.getFileTree({
			rootDir,
			ignore: ["omp-server", "samp03srv", "samp-npc"]
		});

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	}

	public async getFileStat(req: Request<Dummy, Dummy, Dummy, FileStatQuery>, res: Response) {
		const rootDir = req.user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
		const serviceResponse = await configuratorService.getFileStat(rootDir, req.query.path);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	}

	public async getFile(req: Request<Dummy, Dummy, Dummy, FileStatQuery>, res: Response) {
		const rootDir = req.user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
		const filename = basename(req.query.path);
		const fullPath = join(rootDir, req.query.path);

		try {
			const stats = await stat(fullPath);
			const headers = new Headers({
				"Content-Length": stats.size.toString(),
				"Content-Disposition": `inline; filename="${filename}"`,
				"Content-Type": mime(filename)
			});

			const fileStream = await configuratorService.getFileStream(fullPath);

			res.setHeaders(headers);

			fileStream.pipe(res);
		} catch (err) {
			if ((err as Error & { code: string }).code === "ENOENT") {
				return res.status(StatusCodes.NOT_FOUND).send();
			}

			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
		}
	}

	public async patchFile(req: Request, res: Response) {
		const rootDir = req.user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;
		const fullPath = join(rootDir, req.body.patch.path);

		req.body.patch.path = fullPath;

		const serviceResponse = await configuratorService.patchFile(req.body.patch);

		res.status(serviceResponse.statusCode).send();
	}
}

export const configuratorController = new ConfiguratorController();
