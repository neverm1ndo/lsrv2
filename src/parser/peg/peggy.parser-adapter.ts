import type { Parser as PeggyParser } from "peggy";

import { type ParseMethod, ParserAdapter } from "../parser-adapter";

const EOL_STUFF = /\r?\n|\r/g;

export class PeggyParserAdapter<T> extends ParserAdapter implements ParseMethod<T> {
	private readonly _pegParser: PeggyParser = require("./log.parser.js");

	parse(value: Buffer): T {
		const utf8 = this._toUTF8(value).replace(EOL_STUFF, "");

		return this._pegParser.parse(this.encode ? utf8 : value.toString());
	}
}
