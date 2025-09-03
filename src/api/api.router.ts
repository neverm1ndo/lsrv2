import { Router } from "express";
import passport from "passport";

import { authRouter } from "./auth";
import { healthRouter } from "./health";

const router = Router();

// LARS API router
const larsRouter = Router();

router.use("/auth", authRouter);
router.use("/health-check", healthRouter);
router.use("/lars", passport.authenticate("jwt", { session: false }), larsRouter);

export { router };
