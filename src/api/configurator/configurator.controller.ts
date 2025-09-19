import { stat } from "node:fs/promises";
import { basename, join } from "node:path";

import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { mime } from "@lsrv/common/mime";
import type { Dummy } from "@lsrv/common/models";

import { configuratorService } from "./configurator.service";
import type { FileStatQuery } from "./models/file-stat";

export class ConfiguratorController {
	public async getFileThree(req: Request<unknown, unknown, unknown, FileStatQuery>, res: Response) {
		const serviceResponse = await configuratorService.getFileTree({
			rootDir: req.query.path,
			ignore: ["omp-server", "samp03srv", "samp-npc"]
		});

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	}

	public async getFileStat(req: Request<Dummy, Dummy, Dummy, FileStatQuery>, res: Response) {
		const serviceResponse = await configuratorService.getFileStat(req.query.path);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	}

	public async getFile(req: Request<Dummy, Dummy, Dummy, FileStatQuery>, res: Response) {
		const filename = basename(req.query.path);

		try {
			const stats = await stat(req.query.path);
			const fileStream = await configuratorService.getFileStream(req.query.path);

			res.set({
				"Content-Length": String(stats.size),
				"Content-Disposition": `inline; filename="${filename}"`,
				"Content-Type": mime(filename)
			});

			fileStream.pipe(res);
		} catch (err) {
			if ((err as Error & { code: string }).code === "ENOENT") {
				return res.status(StatusCodes.NOT_FOUND).send();
			}

			res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
		}
	}

	public async patchFile(req: Request<unknown, unknown, { text: string; path: string }, FileStatQuery>, res: Response) {
		const fullPath = join(req.query.path, req.body.path);

		req.body.path = fullPath;

		const serviceResponse = await configuratorService.patchFile(req.body);

		res.status(serviceResponse.statusCode).send();
	}
}

export const configuratorController = new ConfiguratorController();
