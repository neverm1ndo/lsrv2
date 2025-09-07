import { Buffer } from "node:buffer";
import { EOL } from "node:os";

import { describe, expect, it } from "vitest";

import { bsplit } from "./bsplit";

describe("bsplit", () => {
	it("splits by simple string delimiter", () => {
		const buf = Buffer.from("a--b--c");
		const parts = bsplit(buf, Buffer.from("--"));
		expect(parts.map((p) => p.toString())).toEqual(["a", "b", "c"]);
	});

	it("splits multiline by EOL delimiter", () => {
		const buf = Buffer.from(["first line", "second line","third line"].join(EOL));
		const parts = bsplit(buf, Buffer.from(EOL));
		expect(parts.map((p) => p.toString())).toEqual(["first line", "second line", "third line"]);
	});

	it("handles consecutive delimiters (creates empty parts)", () => {
		const buf = Buffer.from("a----b"); // 'a' + '--' + '' + '--' + 'b'
		const parts = bsplit(buf, Buffer.from("--"));
		expect(parts.map((p) => p.toString())).toEqual(["a", "", "b"]);
	});

	it("handles leading and trailing delimiters (empty first/last part)", () => {
		const buf = Buffer.from("--a--");
		const parts = bsplit(buf, Buffer.from("--"));
		expect(parts.map((p) => p.toString())).toEqual(["", "a", ""]);
	});

	it("returns single empty Buffer when input buffer is empty", () => {
		const parts = bsplit(Buffer.alloc(0), Buffer.from("."));
		expect(parts).toHaveLength(1);
		expect(parts[0].length).toBe(0);
	});

	it("throws when delimiter is empty", () => {
		expect(() => bsplit(Buffer.from("x"), Buffer.alloc(0))).toThrow();
	});

	it("returns whole buffer when delimiter not found", () => {
		const buf = Buffer.from("abc");
		const parts = bsplit(buf, Buffer.from("|"));
		expect(parts.map((p) => p.toString())).toEqual(["abc"]);
	});

	it("works with binary (multi-byte) delimiter", () => {
		const buf = Buffer.from([0, 1, 2, 3, 0, 1, 2, 4]);
		const delim = Buffer.from([0, 1, 2]);
		const parts = bsplit(buf, delim);
		// Ожидаем: ['', [3], [4]] -> в hex: ['', '03', '04']
		expect(parts.map((p) => p.toString("hex"))).toEqual(["", "03", "04"]);
	});

	it("preserves buffers correctly (no string conversion side-effects)", () => {
		const buf = Buffer.from("hello--world");
		const parts = bsplit(buf, Buffer.from("--"));
		expect(parts[0].equals(Buffer.from("hello"))).toBe(true);
		expect(parts[1].equals(Buffer.from("world"))).toBe(true);
	});
});
