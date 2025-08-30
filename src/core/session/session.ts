import MongoStore from "connect-mongo";
import session from "express-session";
import passport from "passport";

import { env } from "@lsrv/common";
import { getMongoClient } from "@lsrv/core/db";

import { jwtStrategy } from "./strategies/jwt.strategy";

export const lsrv2Session = session({
	secret: env.LSRV_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 31536000000,
		secure: true,
		sameSite: "none",
	},
	store: MongoStore.create({ client: getMongoClient() }),
});

passport.use("jwt", jwtStrategy);
