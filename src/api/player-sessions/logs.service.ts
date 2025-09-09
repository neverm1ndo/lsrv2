import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@lsrv/common/models";

import { type LogLine, LogLineModel } from "./models/logline.model";
import type { SearchQuery } from "./models/search-query.model";

type RootFilterQueryKey = "_id" | keyof LogLine;
type RootFilterQueryValue = Partial<{ $lt: number | string; $gt: number | string }> | string | number;
type RootFilterQuery = Partial<Record<RootFilterQueryKey, RootFilterQueryValue>>;

export class LogsService {
	// constructor(
	// 	private readonly queryParserAdapter = mew QueryParserAdapter()
	// ) {}

	async search(query: SearchQuery) {
		const rootFilterQuery = this.buldRootFilterQueryObject(query);

		const lines = await LogLineModel.find(rootFilterQuery)
			.limit(query.limit)
			.sort({ unix: 1 })
			.where("process")
			.nin(query.filter)
			.lean()
			.exec();

		return ServiceResponse.success("Search result", lines, StatusCodes.OK);
	}

	private parseOuery() {}

	private buldRootFilterQueryObject(query: SearchQuery): RootFilterQuery {
		const rootFilterQuery: RootFilterQuery = {};

		if (query.last) {
			rootFilterQuery._id = { $lt: query.last };
		}

		if (query.from_date || query.to_date) {
			rootFilterQuery.unix = {};

			if (query.from_date) rootFilterQuery.unix.$gt = query.from_date;
			if (query.to_date) rootFilterQuery.unix.$lt = query.to_date;
		}

		return rootFilterQuery;
	}
}

export const logsService = new LogsService();
