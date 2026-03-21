import { Module } from '@nestjs/common';

import { LLQLParserAdapter } from './llql/peg/llql.parser-adapter';
import { PeggyParserAdapter } from './logs-parser/peg/peggy.parser-adapter';

@Module({
	providers: [
		LLQLParserAdapter,
		// Provide PeggyParserAdapter via a factory or value to bypass boolean injection issues
		{
			provide: PeggyParserAdapter,
			useFactory: () => new PeggyParserAdapter()
		}
	],
	exports: [LLQLParserAdapter, PeggyParserAdapter]
})
export class ParserModule {}
