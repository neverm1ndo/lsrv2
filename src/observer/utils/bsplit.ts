export function bsplit(buffer: Buffer, delimiter: Buffer): Buffer[] {
	if (!Buffer.isBuffer(buffer)) {
		throw new TypeError("buffer must be a Buffer");
	}
	if (!Buffer.isBuffer(delimiter)) {
		throw new TypeError("delimiter must be a Buffer");
	}
	if (delimiter.length === 0) {
		throw new Error("delimiter must not be empty");
	}

	if (buffer.length === 0) {
		return [Buffer.alloc(0)];
	}

	const parts: Buffer[] = [];
	let start = 0;
	let idx = buffer.indexOf(delimiter, start);

	while (idx !== -1) {
		parts.push(buffer.subarray(start, idx));
		start = idx + delimiter.length;
		idx = buffer.indexOf(delimiter, start);
	}

	parts.push(buffer.subarray(start));

	return parts;
}
