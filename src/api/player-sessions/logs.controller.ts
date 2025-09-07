import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { logger } from "@lsrv/logger";

import { logsService } from "./logs.service";

class LogsController {
    public search = async (req: Request, res: Response) => {
        
    }
}

export const logsController = new LogsController();