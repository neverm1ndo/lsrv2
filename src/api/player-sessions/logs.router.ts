import express, { type Router } from "express";

import { logsController } from "./logs.controller";

export const logsRouter: Router = express.Router();

logsRouter.get("/search", logsController.search);

// authRouter.post("/sessions", json(), validateRequest(GetSessionRequesSchema), logsController.session);
// authRouter.post("/sessions/:id", json(), validateRequest(GetSessionRequesSchema), logsController.session);
