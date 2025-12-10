import { type ParseMethod, ParserAdapter } from "../parser-adapter";
import { parse } from "./logs.parser";

const EOL = /\r?\n|\r/g;

export class PeggyParserAdapter<T> extends ParserAdapter implements ParseMethod<T> {
	parse(value: Buffer): T {
		const utf8 = this._toUTF8(value).replace(EOL, "");

		return parse(this.encode ? utf8 : value.toString());
	}
}
