import type { QueryASTNode } from "./ast.js";
import { parse } from "./llql.parser.js";

export class LLQLParserAdapter {
	parse(value: string): QueryASTNode {
		return parse(value);
	}
}
