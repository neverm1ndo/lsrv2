import { Router } from "express";
import passport from "passport";

import { authRouter } from "./auth";
import { configuratorRouter } from "./configurator/configurator.router";
import { healthRouter } from "./health";
import { logsRouter } from "./player-sessions/logs.router";

const router = Router();

// LARS API router
const larsRouter = Router();

router.use("/auth", authRouter);
router.use("/health-check", healthRouter);
router.use("/lars", passport.authenticate("jwt", { session: false }), larsRouter);

larsRouter.use("/player-sessions", logsRouter);
larsRouter.use("/configurator", configuratorRouter);

export { router };
