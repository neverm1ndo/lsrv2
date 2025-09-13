import { Router } from "express";

import { validateRequest } from "@lsrv/common/validation";

import { configuratorController } from "./configurator.controller";
import { GetFileStatRequestScheme } from "./models/file-stat";

export const configuratorRouter: Router = Router();

configuratorRouter.get("/ft", configuratorController.getFileThree);
configuratorRouter.get("/fs", validateRequest(GetFileStatRequestScheme), configuratorController.getFileStat);
configuratorRouter.get("/file", validateRequest(GetFileStatRequestScheme), configuratorController.getFile);
configuratorRouter.post("/save", configuratorController.saveFile);
