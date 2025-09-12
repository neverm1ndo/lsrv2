export type QueryASTNode =
	| LogicalAndNode
	| LogicalOrNode
	| EqualNode
	| NotEqualNode
	| InNode
	| NotInNode
	| ArrayNode
	| RangeNode
	| IdentifierNode
	| StringNode
	| NumberNode;

// Logical nodes

export interface LogicalAndNode {
	type: "LogicalAnd";
	left: QueryASTNode;
	right: QueryASTNode;
}

export interface LogicalOrNode {
	type: "LogicalOr";
	left: QueryASTNode;
	right: QueryASTNode;
}

// Compartions

export interface EqualNode {
	type: "Equal";
	left: IdentifierNode;
	right: LiteralNode;
}

export interface NotEqualNode {
	type: "NotEqual";
	left: IdentifierNode;
	right: LiteralNode;
}

export interface InNode {
	type: "In";
	left: IdentifierNode;
	right: ArrayNode | RangeNode;
}

export interface NotInNode {
	type: "NotIn";
	left: IdentifierNode;
	right: ArrayNode | RangeNode;
}

// Collections and ranges

export interface ArrayNode {
	type: "Array";
	elements: LiteralNode[];
}

export interface RangeNode {
	type: "Range";
	start: NumberNode;
	end: NumberNode;
}

// Literals and identificators

export type LiteralNode = StringNode | NumberNode | IdentifierNode;

export interface IdentifierNode {
	type: "Identifier";
	value: string;
}

export interface StringNode {
	type: "String";
	value: string;
}

export interface NumberNode {
	type: "Number";
	value: number;
}
