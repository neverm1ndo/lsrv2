import express, { json, type Router } from "express";
import passport from "passport";

import { validateRequest } from "@lsrv/common/validation";

export const authRouter: Router = express.Router();

// authRouter.get("/last", logsController.auth);
// authRouter.get("/search", passport.authenticate("jwt"), logsController.logout);

// authRouter.post("/sessions", json(), validateRequest(GetSessionRequesSchema), logsController.session);
// authRouter.post("/sessions/:id", json(), validateRequest(GetSessionRequesSchema), logsController.session);
