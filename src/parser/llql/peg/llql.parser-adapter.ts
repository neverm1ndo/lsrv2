import { parse } from "./llql.parser.js";

type LLQLLiteralType = "Equal" | "Identifier" | "String" | "Number" | "In" | "Range" | "Array" | LLQLLogical;
type LLQLLogical = "LogicalOr" | "LogicalAnd";

type LLQL_AST = {
	type: LLQLLiteralType;
	left: LLQL_AST;
	right: LLQL_AST;
	elements?: LLQL_AST[];
	value?: string | number;
};

export class LLQLParserAdapter {
	parse(value: string): LLQL_AST {
		return parse(value);
	}
}
