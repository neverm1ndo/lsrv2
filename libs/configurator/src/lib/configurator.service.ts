import { createReadStream } from 'node:fs';
import { type FileHandle, open, readFile, stat, writeFile } from 'node:fs/promises';
import type { Readable } from 'node:stream';

import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	StreamableFile
} from '@nestjs/common';
import DiffMatchPatch from 'diff-match-patch';
import { decodeStream, encodeStream } from 'iconv-lite';

import { mime } from '@lsrv/common/mime';

import type { FileTreeOptions, TreeNode } from './interfaces/ftree.interface';
import { buildTree } from './utils/ftree';
import { isBinary } from './utils/is-binary';

const dmp = new DiffMatchPatch();

@Injectable()
export class ConfiguratorService {
	async getFileTree(options: FileTreeOptions): Promise<TreeNode> {
		return buildTree(options);
	}

	async getFileStat(path: string) {
		try {
			const stats = await stat(path);
			return {
				size: stats.size,
				mtime: stats.mtime,
				mime: mime(path)
			};
		} catch (err) {
			throw new NotFoundException('File stat failure', { cause: err });
		}
	}

	async getFileStream(path: string) {
		const BufferSize = 512;
		const rangedBuffer = Buffer.alloc(BufferSize);

		let fileHandle: FileHandle | undefined;
		let streamCreated = false;
		try {
			fileHandle = await open(path, 'r');
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				throw new NotFoundException('File not found', { cause: err });
			}
			throw new InternalServerErrorException('Error opening file', { cause: err });
		}

		try {
			const { bytesRead } = await fileHandle.read(rangedBuffer, 0, BufferSize, 0);

			const sampleBuffer = rangedBuffer.subarray(0, bytesRead);
			const buffer = sampleBuffer.buffer.slice(
				sampleBuffer.byteOffset,
				sampleBuffer.byteOffset + sampleBuffer.byteLength
			);

			const isBinaryFile = isBinary(buffer);

			const stream = createReadStream('', { fd: fileHandle.fd, start: 0 });
			streamCreated = true;

			if (isBinaryFile) {
				return new StreamableFile(stream);
			}

			return new StreamableFile(stream.pipe(decodeStream('win1251')).pipe(encodeStream('utf8')) as unknown as Readable);
		} finally {
			// Only close if we didn't hand off the fd to createReadStream
			if (fileHandle && !streamCreated) {
				await fileHandle.close();
			}
		}
	}
	async patchFile(patch: { path: string; text: string }) {
		try {
			const current = await readFile(patch.path, 'utf8');

			const patches = dmp.patch_fromText(patch.text);
			const [incoming, results] = dmp.patch_apply(patches, current);

			if (results.some((applied) => !applied)) {
				throw new ConflictException('Patch did not apply cleanly');
			}

			await writeFile(patch.path, incoming, 'utf-8');

			return { success: true };
		} catch (err) {
			if (err instanceof ConflictException) {
				throw err;
			}
			throw new InternalServerErrorException((err as Error).message, { cause: err });
		}
	}
}
