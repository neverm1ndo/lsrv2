import express, { type Router } from "express";

import { validateRequest } from "@lsrv/common/validation";

import { GetUserSchema } from "./models/user.model";
import { userController } from "./user.controller";

export const userRouter: Router = express.Router();

userRouter.get("user/:id", validateRequest(GetUserSchema), userController.getUser);
