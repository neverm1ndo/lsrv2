import express, { json, type Router } from "express";
import passport from "passport";

import { validateRequest } from "@lsrv/common/validation";

import { authController } from "./auth.controller";
import { GetSessionRequesSchema } from "./models/session-request.model";

export const authRouter: Router = express.Router();

authRouter.get("/", passport.authenticate("jwt", { session: false }), authController.auth);
authRouter.get("/logout", passport.authenticate("jwt"), authController.logout);

authRouter.post("/session", json(), authController.session);
