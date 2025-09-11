import type { Request, Response } from "express";

import { logsService } from "./logs.service";

// import type { SearchQuery } from "./models/search-query.model";

class LogsController {
	public search = async (req: Request<any>, res: Response) => {
		console.log(req.query);
		const serviceResponse = await logsService.search(req.query);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	};
}

export const logsController = new LogsController();
