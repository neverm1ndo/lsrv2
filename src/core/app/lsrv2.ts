import { createServer, type Server } from "node:https";
import { join } from "node:path";

import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import passport from "passport";

import { env } from "@lsrv/common";
import { CORS_CONFIG, HTTPS_CONFIG } from "@lsrv/core/http";
import { lsrv2Session } from "@lsrv/core/session";

import errorHandler from "./middleware/error-handler";
import requestLogger from "./middleware/request-logger";

const lsrv2: Express = express();
const server: Server = createServer(HTTPS_CONFIG, lsrv2);

lsrv2.set("secret", env.LSRV_SECRET);

lsrv2.use(cors(CORS_CONFIG));
lsrv2.use(express.urlencoded({ extended: true }));
lsrv2.use(lsrv2Session);
lsrv2.use(passport.initialize());
lsrv2.use(passport.session());
lsrv2.use(helmet());
lsrv2.use(errorHandler());
lsrv2.use(requestLogger);

// API
lsrv2.use("/.well-known/acme-challenge", express.static(join(__dirname, "../static/.well-known/acme-challenge")));
// app.use('/v2', BaseRouter);

export { lsrv2, server };
