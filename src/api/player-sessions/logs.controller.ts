import type { Request, Response } from "express";

import { logsService } from "./logs.service";
import type { SearchQuery } from "./models/search-query.model";

type Dummy = NonNullable<unknown>;

class LogsController {
	public search = async (req: Request<Dummy, Dummy, Dummy, SearchQuery>, res: Response) => {
		const serviceResponse = await logsService.search(req.query);

		return res.status(serviceResponse.statusCode).send(serviceResponse.responseObject);
	};
}

export const logsController = new LogsController();
