import { join } from "node:path";

import type { Handler, NextFunction, Request, Response } from "express";

import { Workgroup } from "@lsrv/api/user";
import { env } from "@lsrv/common/environment";

export const userRootDirDef: Handler = (
	req: Request<unknown, unknown, unknown, Partial<{ path: string }>>,
	_res: Response,
	next: NextFunction
) => {
	const rootDir = req.user?.main_group === Workgroup.DEV ? env.ROOT_PATH : env.CONFIGURATOR_PATH;

	Object.defineProperty(req, "query", {
		...Object.getOwnPropertyDescriptor(req, "query"),
		value: { ...req.query, path: join(rootDir, req.query.path || "") },
		writable: false
	});

	next();
};
