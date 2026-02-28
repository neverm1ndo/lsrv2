import { Injectable } from '@nestjs/common';

import type { QueryASTNode } from './ast.js';
import { parse } from './llql.parser.js';

@Injectable()
export class LLQLParserAdapter {
	parse(value: string): QueryASTNode {
		return parse(value);
	}
}
