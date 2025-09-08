import express, { type Router } from "express";

import { logsController } from "./logs.controller";

export const logsRouter: Router = express.Router();

logsRouter.get("/last", logsController.last);
// authRouter.get("/search", passport.authenticate("jwt"), logsController.logout);

// authRouter.post("/sessions", json(), validateRequest(GetSessionRequesSchema), logsController.session);
// authRouter.post("/sessions/:id", json(), validateRequest(GetSessionRequesSchema), logsController.session);
