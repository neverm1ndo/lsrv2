import express, { type Router } from "express";

import { validateRequest } from "@lsrv/common/validation";

import { logsController } from "./logs.controller";
import { type SearchQuery, SearchQuerySchema } from "./models/search-query.model";

export const logsRouter: Router = express.Router();

logsRouter.get("/search", validateRequest<SearchQuery>(SearchQuerySchema), logsController.search);

// authRouter.post("/sessions", json(), validateRequest(GetSessionRequesSchema), logsController.session);
// authRouter.post("/sessions/:id", json(), validateRequest(GetSessionRequesSchema), logsController.session);
