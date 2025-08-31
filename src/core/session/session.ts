import MongoStore from "connect-mongo";
import session from "express-session";
import passport from "passport";

import { env } from "@lsrv/common/environment";
import { clientPromise } from "@lsrv/core/db";

import { jwtStrategy } from "./strategies/jwt.strategy";
import { localStrategy } from "./strategies/local.strategy";

export const lsrv2Session = session({
	secret: env.LSRV_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 31536000000,
		secure: true,
		sameSite: "none",
	},
	store: MongoStore.create({ clientPromise }),
});

passport.use("jwt", jwtStrategy);
passport.use('local', localStrategy);
