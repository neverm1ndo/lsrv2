import { Router } from "express";
import passport from "passport";

import { authRouter } from "./auth";
import { healthRouter } from "./health";

const router = Router();

// LARS API router
const larsRouter = Router();
//   larsRouter.use('/bans', BansRouter);
//   larsRouter.use('/logs', LogsRouter);
//   larsRouter.use('/maps', Guards.mapperGuard as Handler, MapsRouter);
//   larsRouter.use('/configs', Guards.configuratorGuard as Handler, ConfigsRouter);
//   larsRouter.use('/admins', AdminsRouter);
//   larsRouter.use('/backups', Guards.backuperGuard as Handler, BackupsRouter);
//   larsRouter.use('/stats', StatsRouter);
//   larsRouter.use('/utils', Guards.developerGuard as Handler, UtilsRouter);

router.use("/auth", authRouter);
router.use('/health-check', healthRouter);
router.use("/lars", passport.authenticate("jwt", { session: false }), larsRouter);

export { router };
