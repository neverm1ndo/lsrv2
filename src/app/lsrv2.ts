import { createServer, type Server } from "node:https";
import { join } from "node:path";

import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import passport from "passport";
import type { Server as IoServer } from "socket.io";

import { BaseRouter } from "@lsrv/api";
import { CORS_CONFIG, HTTPS_CONFIG } from "@lsrv/core/http";
import { errorHandler, rateLimiter, requestLogger } from "@lsrv/core/middlewares";
import { lsrv2Session } from "@lsrv/core/session";
import { bootstrapIo } from "@lsrv/core/socket";

import { LsrvLogsObserver } from "./logs.observer";


// Application
const lsrv2: Express = express();
const server: Server = createServer(HTTPS_CONFIG, lsrv2);
const io: IoServer = bootstrapIo(server, { cors: CORS_CONFIG }, [
	lsrv2Session,
	passport.authenticate("jwt"),
	passport.initialize(),
	passport.session()
]);

const observer: LsrvLogsObserver = new LsrvLogsObserver();

observer.subscribe();

// Middlewares
lsrv2.use(cors(CORS_CONFIG));
lsrv2.use(express.urlencoded({ extended: true }));
lsrv2.use(lsrv2Session);
lsrv2.use(passport.initialize());
lsrv2.use(passport.session());
lsrv2.use(helmet());
lsrv2.use(rateLimiter);

// Logging
lsrv2.use(requestLogger);

// API Routes
lsrv2.use("/.well-known/acme-challenge", express.static(join(__dirname, "../static/.well-known/acme-challenge")));
lsrv2.use("/v2", BaseRouter);

// Error handlers
lsrv2.use(errorHandler());

export { lsrv2, server, io };
