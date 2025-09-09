import { decode, encode } from "iconv-lite";

export interface ParseMethod<T> {
	parse(value: Buffer): T;
}

export abstract class ParserAdapter {
	constructor(protected encode: boolean = true) {}

	protected _toUTF8(value: string | Buffer): string {
		const result =
			typeof value === "string"
				? encode(this._decodeWIN1251toString(Buffer.from(value, "binary")), "utf8")
				: encode(this._decodeWIN1251toString(value), "utf8");
		return result.toString();
	}

	private _decodeWIN1251toString(buffer: Buffer): string {
		return decode(buffer, "win1251");
	}
}
