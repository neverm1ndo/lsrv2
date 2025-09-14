import { createReadStream } from "node:fs";
import { open, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

import DiffMatchPatch from "diff-match-patch";
import { StatusCodes } from "http-status-codes";
import { decodeStream, encodeStream } from "iconv-lite";

import { mime } from "@lsrv/common/mime";
import { ServiceResponse } from "@lsrv/common/models";

import { buildTree, type FileTreeOptions } from "./ftree";
import { isBinary } from "./utils/is-binary";

const dmp = new DiffMatchPatch();

export class ConfiguratorService {
	async getFileTree(options: FileTreeOptions) {
		return ServiceResponse.success("File three", await buildTree(options), StatusCodes.OK);
	}

	async getFileStat(root: string, path: string) {
		const fullPath = join(root, path);

		try {
			const stats = await stat(fullPath);
			const fileStat = {
				size: stats.size,
				mtime: stats.mtime,
				mime: mime(path)
			};

			return ServiceResponse.success("File stat", fileStat, StatusCodes.OK);
		} catch (err) {
			return ServiceResponse.failure("File stat failure", err, StatusCodes.NOT_FOUND);
		}
	}

	async getFileStream(fullPath: string) {
		const BUFFER_SIZE = 512;

		const rangedBuffer = Buffer.alloc(BUFFER_SIZE);
		const fileHandle = await open(fullPath, "r");

		const { bytesRead } = await fileHandle.read(rangedBuffer, 0, BUFFER_SIZE, 0);

		fileHandle.close();

		const sampleBuffer = rangedBuffer.subarray(0, bytesRead);
		const buffer = sampleBuffer.buffer.slice(
			sampleBuffer.byteOffset,
			sampleBuffer.byteOffset + sampleBuffer.byteLength
		);

		const isBinaryFile = isBinary(buffer);

		const stream = createReadStream(fullPath);

		if (isBinaryFile) {
			return stream;
		}

		return stream.pipe(decodeStream("win1251")).pipe(encodeStream("utf8"));
	}

	async patchFile(patch: { path: string; text: string }) {
		try {
			const current = await readFile(patch.path, "utf8");

			const patches = dmp.patch_fromText(patch.text);
			const [incoming, results] = dmp.patch_apply(patches, current);

			if (results.some((applied) => !applied)) {
				throw new Error("Patch did not apply cleanly", { cause: StatusCodes.CONFLICT });
			}

			await writeFile(patch.path, incoming, "utf-8");

			return ServiceResponse.success("File patched", null, StatusCodes.OK);
		} catch (err) {
			return ServiceResponse.failure((err as Error).message, err, (err as Error).cause as number);
		}
	}
}

export const configuratorService = new ConfiguratorService();
