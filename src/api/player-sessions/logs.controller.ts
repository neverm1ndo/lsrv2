import type { Request, Response } from "express";

import { logsService } from "./logs.service";
import type { SearchQuery } from "./models/search-query.model";

class LogsController {
	public search = async (req: Request, res: Response) => {};
	public last = async (req: Request<SearchQuery>, res: Response) => {
		const serviceResponse = await logsService.last(req.params);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	};
}

export const logsController = new LogsController();
