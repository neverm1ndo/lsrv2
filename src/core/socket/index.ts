import type { IncomingMessage } from "node:http";
import type { Server as HttpsServer } from "node:https";

import type { Handler } from "express";
import passport from "passport";
import { type ExtendedError, Server as IoServer, type ServerOptions as IoServerOptions, type Socket } from "socket.io";

import { server } from "@lsrv/core";
import { CORS_CONFIG } from "@lsrv/core/http";
import { lsrv2Session } from "@lsrv/core/session";

export interface IIncomingMessage<User> extends IncomingMessage {
	user?: User;
}

export interface SocketWithUser<User> extends Socket {
	request: IIncomingMessage<User>;
}

const wrap = (middleware: (...args: unknown[]) => Handler) => (socket: Socket, next: (err?: ExtendedError) => void) =>
	middleware(socket.request, {}, next);

const createIoServer = (server: HttpsServer, options: Partial<IoServerOptions>): IoServer =>
	new IoServer(server, options);

const bootstrapIo = <User = unknown>(
	server: HttpsServer,
	options: Partial<IoServerOptions>,
	middlewares: ((...args: unknown[]) => Handler)[],
) => {
	const io = createIoServer(server, options);

	middlewares.forEach((middlware) => {
		io.use(wrap(middlware));
	});

	io.use((socket: SocketWithUser<User>, next: (err?: ExtendedError) => void) => {
		socket.request.user ? next() : next(new Error("Unauthorized"));
	});

	return io;
};

export const io: IoServer = bootstrapIo(server, { cors: CORS_CONFIG }, [
	lsrv2Session,
	passport.authenticate("jwt"),
	passport.initialize(),
	passport.session(),
]);
