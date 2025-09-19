import { Router } from "express";

import { validateRequest } from "@lsrv/common/validation";

import { configuratorController } from "./configurator.controller";
import { userRootDirDef } from "./middleware/uers-root-dir-def";
import { GetFileRequestScheme } from "./models/file-stat";

export const configuratorRouter: Router = Router();

configuratorRouter.get("/ft", userRootDirDef, configuratorController.getFileThree);
configuratorRouter.get(
	"/fs",
	validateRequest(GetFileRequestScheme),
	userRootDirDef,
	configuratorController.getFileStat
);
configuratorRouter.get("/file", validateRequest(GetFileRequestScheme), userRootDirDef, configuratorController.getFile);
configuratorRouter.patch("/file", userRootDirDef, configuratorController.patchFile);
