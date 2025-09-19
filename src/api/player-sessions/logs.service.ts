import { StatusCodes } from "http-status-codes";
import type { FilterQuery } from "mongoose";

import { ServiceResponse } from "@lsrv/common/models";
import { type LiteralNode, LLQLParserAdapter, type QueryASTNode } from "@lsrv/parser";

import { type LogLine, LogLineModel } from "./models/logline.model";
import type { SearchQuery } from "./models/search-query.model";

type RootFilterQueryKey = "_id" | keyof LogLine;
type RootFilterQueryValue = Partial<{ $lt: number | string; $gt: number | string }> | string | number;
type RootFilterQuery = Partial<Record<RootFilterQueryKey, RootFilterQueryValue>>;
type ParsedQueryFilter = FilterQuery<Record<string, unknown>>;

export class LogsService {
	constructor(private readonly queryParserAdapter = new LLQLParserAdapter()) {}

	async search(query: SearchQuery) {
		const rootFilterQuery = this.buldRootFilterQueryObject(query);

		const lines = await LogLineModel.find(rootFilterQuery).limit(query.limit).sort({ unix: 1 }).lean().exec();

		return ServiceResponse.success("Search result", lines, StatusCodes.OK);
	}

	private parseOuery(queryExpression: string) {
		const ast = this.queryParserAdapter.parse(queryExpression);

		return this.queryASTToMongoose(ast);
	}

	private buldRootFilterQueryObject(query: SearchQuery): RootFilterQuery {
		let rootFilterQuery: RootFilterQuery = {};

		if (query.q) {
			const queryObject = this.parseOuery(query.q);

			rootFilterQuery = queryObject;
		}

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

	private queryASTToMongoose(ast: QueryASTNode): ParsedQueryFilter {
		switch (ast.type) {
			case "LogicalAnd":
				return { $and: [this.queryASTToMongoose(ast.left), this.queryASTToMongoose(ast.right)] };

			case "LogicalOr":
				return { $or: [this.queryASTToMongoose(ast.left), this.queryASTToMongoose(ast.right)] };

			case "Equal": {
				const field = ast.left.value;
				const value = this.literalToValue(ast.right);

				return { [field]: value };
			}

			case "NotEqual": {
				const field = ast.left.value;
				const value = this.literalToValue(ast.right);
				return { [field]: { $ne: value } };
			}

			case "In": {
				const field = ast.left.value;
				if (ast.right.type === "Array") {
					return {
						[field]: {
							$in: ast.right.elements.map(this.literalToValue)
						}
					};
				}
				if (ast.right.type === "Range") {
					return {
						[field]: {
							$gte: ast.right.start.value,
							$lte: ast.right.end.value
						}
					};
				}

				throw new Error(`Unsupported IN right operand: ${ast.right}`);
			}

			case "NotIn": {
				const field = ast.left.value;
				if (ast.right.type === "Array") {
					return { [field]: { $nin: ast.right.elements.map(this.literalToValue) } };
				}
				if (ast.right.type === "Range") {
					return {
						[field]: { $not: { $gte: ast.right.start.value, $lte: ast.right.end.value } }
					};
				}
				throw new Error(`Unsupported NOT IN operand: ${ast.right}`);
			}

			default:
				throw new Error(`Unknown AST node type: ${ast.type}`);
		}
	}

	private literalToValue(node: LiteralNode): string | number | RegExp {
		switch (node.type) {
			case "String":
				if (node.value.includes("*")) {
					const regex = `^${node.value.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`;

					return new RegExp(regex);
				}
				return node.value;

			case "Number":
				return node.value;

			case "Identifier":
				return node.value;

			default: {
				const _exhaustive: never = node;
				return _exhaustive;
			}
		}
	}
}

export const logsService = new LogsService();
